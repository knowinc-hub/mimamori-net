/**
 * Firestore セキュリティルールのユニットテスト。
 * 実行: npm run test:rules（Firestore エミュレータ上で実行される）
 */
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

// テスト用ユーザー
const APPROVED_MUSASHINO = 'user-approved-musashino'
const APPROVED_NERIMA = 'user-approved-nerima'
const PENDING_USER = 'user-pending'
const ADMIN_USER = 'user-admin'
const NEW_USER = 'user-new'

const db = (uid: string | null) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore()

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'mimamori-net-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  // 前提データはルールを無効化して投入
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore()
    await setDoc(doc(f, 'users', APPROVED_MUSASHINO), {
      nickname: '田中さん',
      area: '武蔵野市',
      status: 'approved',
      notify: {},
    })
    await setDoc(doc(f, 'users', APPROVED_NERIMA), {
      nickname: '鈴木さん',
      area: '練馬区',
      status: 'approved',
      notify: {},
    })
    await setDoc(doc(f, 'users', PENDING_USER), {
      nickname: '承認待ちさん',
      area: '武蔵野市',
      status: 'pending',
      notify: {},
    })
    await setDoc(doc(f, 'users', ADMIN_USER), {
      nickname: '管理者',
      area: '武蔵野市',
      status: 'approved',
      notify: {},
    })
    await setDoc(doc(f, 'admins', ADMIN_USER), { createdAt: 0 })
    await setDoc(doc(f, 'inviteCodes', 'VALID-CODE'), {
      organizationName: 'テストPTA',
      active: true,
    })
    await setDoc(doc(f, 'inviteCodes', 'DISABLED-CODE'), {
      organizationName: '停止済み団体',
      active: false,
    })
    // 武蔵野市の依頼（投稿者: APPROVED_MUSASHINO）
    await setDoc(doc(f, 'requests', 'req-1'), {
      area: '武蔵野市',
      location: '吉祥寺駅北口付近',
      policeReported: true,
      authorUid: APPROVED_MUSASHINO,
      createdAt: 0,
      updatedAt: 0,
    })
    await setDoc(doc(f, 'requests', 'req-1', 'private', 'main'), {
      personName: '山田さん',
      detail: '青いジャンパー',
      contact: '090-XXXX-XXXX',
      photoDataUrl: '',
      policeReportNumber: '2025-0412',
    })
  })
})

describe('閲覧制限（設計原則: エリア内の承認メンバーのみ）', () => {
  it('未ログインは依頼を読めない', async () => {
    await assertFails(getDoc(doc(db(null), 'requests', 'req-1')))
  })

  it('承認待ちユーザーは依頼を読めない', async () => {
    await assertFails(getDoc(doc(db(PENDING_USER), 'requests', 'req-1')))
  })

  it('承認済みユーザーは依頼メタを読める', async () => {
    await assertSucceeds(getDoc(doc(db(APPROVED_MUSASHINO), 'requests', 'req-1')))
  })

  it('private は同エリアの承認ユーザーのみ読める', async () => {
    await assertSucceeds(
      getDoc(doc(db(APPROVED_MUSASHINO), 'requests', 'req-1', 'private', 'main')),
    )
  })

  it('private は他エリアの承認ユーザーには読めない', async () => {
    await assertFails(
      getDoc(doc(db(APPROVED_NERIMA), 'requests', 'req-1', 'private', 'main')),
    )
  })

  it('他人の users ドキュメントは読めない', async () => {
    await assertFails(getDoc(doc(db(APPROVED_MUSASHINO), 'users', APPROVED_NERIMA)))
  })

  it('管理者は他人の users ドキュメントを読める', async () => {
    await assertSucceeds(getDoc(doc(db(ADMIN_USER), 'users', APPROVED_MUSASHINO)))
  })
})

describe('会員登録（承認制・招待コード必須）', () => {
  const registration = {
    nickname: '新規さん',
    area: '武蔵野市',
    district: '',
    status: 'pending',
    inviteCode: 'VALID-CODE',
    organizationName: 'テストPTA',
    notify: { newRequest: true, resolved: true, night: false },
    createdAt: 0,
  }

  it('有効な招待コードで pending として登録できる', async () => {
    await assertSucceeds(setDoc(doc(db(NEW_USER), 'users', NEW_USER), registration))
  })

  it('無効化された招待コードでは登録できない', async () => {
    await assertFails(
      setDoc(doc(db(NEW_USER), 'users', NEW_USER), {
        ...registration,
        inviteCode: 'DISABLED-CODE',
      }),
    )
  })

  it('存在しない招待コードでは登録できない', async () => {
    await assertFails(
      setDoc(doc(db(NEW_USER), 'users', NEW_USER), {
        ...registration,
        inviteCode: 'NO-SUCH-CODE',
      }),
    )
  })

  it('いきなり approved としては登録できない', async () => {
    await assertFails(
      setDoc(doc(db(NEW_USER), 'users', NEW_USER), {
        ...registration,
        status: 'approved',
      }),
    )
  })

  it('自分で status を approved に変更できない', async () => {
    await assertFails(
      updateDoc(doc(db(PENDING_USER), 'users', PENDING_USER), { status: 'approved' }),
    )
  })

  it('管理者は status を変更（承認）できる', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ADMIN_USER), 'users', PENDING_USER), { status: 'approved' }),
    )
  })

  it('本人は通知設定を変更できる', async () => {
    await assertSucceeds(
      updateDoc(doc(db(APPROVED_MUSASHINO), 'users', APPROVED_MUSASHINO), {
        notify: { newRequest: false, resolved: true, night: false },
      }),
    )
  })
})

describe('捜索依頼の作成（警察届出前提）', () => {
  const validRequest = {
    area: '武蔵野市',
    location: '三鷹駅北口',
    policeReported: true,
    authorUid: APPROVED_MUSASHINO,
    createdAt: 0,
    updatedAt: 0,
  }

  it('承認ユーザーは届出済みの依頼を作成できる', async () => {
    await assertSucceeds(setDoc(doc(db(APPROVED_MUSASHINO), 'requests', 'req-new'), validRequest))
  })

  it('警察届出なし（policeReported=false）では作成できない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_MUSASHINO), 'requests', 'req-new'), {
        ...validRequest,
        policeReported: false,
      }),
    )
  })

  it('他人になりすました authorUid では作成できない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_NERIMA), 'requests', 'req-new'), validRequest),
    )
  })

  it('承認待ちユーザーは作成できない', async () => {
    await assertFails(
      setDoc(doc(db(PENDING_USER), 'requests', 'req-new'), {
        ...validRequest,
        authorUid: PENDING_USER,
      }),
    )
  })
})

describe('寄せられた情報（中身のない反応は不可）', () => {
  it('場所つきの目撃情報を作成できる', async () => {
    await assertSucceeds(
      setDoc(doc(db(APPROVED_NERIMA), 'requests', 'req-1', 'updates', 'u1'), {
        kind: 'sighting',
        location: '田無駅北口',
        whenText: '11時頃',
        comment: '',
        authorUid: APPROVED_NERIMA,
        createdAt: 0,
      }),
    )
  })

  it('場所も内容も空の「反応」は作成できない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_NERIMA), 'requests', 'req-1', 'updates', 'u1'), {
        kind: 'sighting',
        location: '',
        whenText: '',
        comment: '',
        authorUid: APPROVED_NERIMA,
        createdAt: 0,
      }),
    )
  })

  it('不正な kind では作成できない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_NERIMA), 'requests', 'req-1', 'updates', 'u1'), {
        kind: 'share',
        location: 'どこか',
        whenText: '',
        comment: '',
        authorUid: APPROVED_NERIMA,
        createdAt: 0,
      }),
    )
  })
})

describe('解決と削除（設計原則: 解決したら消える）', () => {
  it('投稿者は依頼と private を削除できる', async () => {
    const f = db(APPROVED_MUSASHINO)
    await assertSucceeds(deleteDoc(doc(f, 'requests', 'req-1', 'private', 'main')))
    await assertSucceeds(deleteDoc(doc(f, 'requests', 'req-1')))
  })

  it('投稿者以外は削除できない', async () => {
    const f = db(APPROVED_NERIMA)
    await assertFails(deleteDoc(doc(f, 'requests', 'req-1', 'private', 'main')))
    await assertFails(deleteDoc(doc(f, 'requests', 'req-1')))
  })

  it('管理者は削除できる', async () => {
    await assertSucceeds(deleteDoc(doc(db(ADMIN_USER), 'requests', 'req-1')))
  })

  it('履歴は日時・エリア・件数のみ書き込める', async () => {
    await assertSucceeds(
      setDoc(doc(db(APPROVED_MUSASHINO), 'history', 'h1'), {
        area: '武蔵野市',
        resolvedAt: 0,
        elapsedMinutes: 45,
        updateCount: 3,
      }),
    )
  })

  it('履歴に個人情報（氏名など）は書き込めない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_MUSASHINO), 'history', 'h1'), {
        area: '武蔵野市',
        resolvedAt: 0,
        elapsedMinutes: 45,
        updateCount: 3,
        personName: '山田さん',
      }),
    )
  })
})

describe('招待コード・管理者', () => {
  it('一般ユーザーは招待コードを作成できない', async () => {
    await assertFails(
      setDoc(doc(db(APPROVED_MUSASHINO), 'inviteCodes', 'NEW-CODE'), {
        organizationName: '勝手な団体',
        active: true,
      }),
    )
  })

  it('管理者は招待コードを作成できる', async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN_USER), 'inviteCodes', 'NEW-CODE'), {
        organizationName: '新しい団体',
        active: true,
      }),
    )
  })

  it('クライアントからは admins に書き込めない（管理者でも）', async () => {
    await assertFails(setDoc(doc(db(ADMIN_USER), 'admins', 'someone'), { createdAt: 0 }))
  })
})
