import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { Repository } from './repository'
import type {
  Area,
  HistoryEntry,
  Profile,
  RequestInput,
  RequestUpdate,
  SearchRequest,
  UpdateInput,
} from '../types'

const DRAFT_KEY = 'mimamori:v2:draft'

function uid(): string {
  const u = auth.currentUser
  if (!u) throw new Error('ログインが必要です')
  return u.uid
}

function toMillis(v: unknown): number {
  return v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now()
}

/**
 * Phase 2 の本実装。Firestore 構成:
 * - requests/{id}                  … 依頼メタ（状態・エリア・場所・日時・届出フラグ）
 * - requests/{id}/private/main    … 氏名・詳細・連絡先・写真（解決時に物理削除する対象を隔離）
 * - requests/{id}/updates/{uid}   … 目撃情報・情報提供・発見報告（解決時に削除）
 * - history/{id}                  … 日時・エリア・件数のみ
 * - users/{uid} / inviteCodes / admins … 承認制会員まわり
 *
 * 写真は Firestore の private ドキュメントに DataURL で保存する（縮小済み・最大約900KB）。
 * Cloud Storage を使わないのは、Spark プランで完結させることと、
 * 解決時の削除を「1ドキュメントの削除」で確実にするため。
 */
export class FirestoreRepository implements Repository {
  async listRequests(): Promise<SearchRequest[]> {
    // 非表示（通報対応済み）の依頼は一般メンバーには出さない
    const snap = await getDocs(
      query(
        collection(db, 'requests'),
        where('hidden', '==', false),
        orderBy('createdAt', 'desc'),
      ),
    )
    return Promise.all(
      snap.docs.map(async (d) => {
        const meta = d.data()
        const base: SearchRequest = {
          id: d.id,
          status: 'active',
          area: meta.area as Area,
          location: meta.location as string,
          createdAt: toMillis(meta.createdAt),
          updatedAt: toMillis(meta.updatedAt),
          policeReported: Boolean(meta.policeReported),
          authorUid: meta.authorUid as string,
          updates: [],
        }
        // private は同エリアの承認メンバーのみ読める。読めない場合は伏せたまま表示する。
        try {
          const priv = await getDoc(doc(db, 'requests', d.id, 'private', 'main'))
          if (priv.exists()) {
            const p = priv.data()
            base.personName = p.personName || undefined
            base.detail = p.detail || undefined
            base.contact = p.contact || undefined
            base.photoDataUrl = p.photoDataUrl || undefined
            base.policeReportNumber = p.policeReportNumber || undefined
          }
        } catch {
          /* 権限なし（他エリア）: メタ情報のみ表示 */
        }
        try {
          const ups = await getDocs(collection(db, 'requests', d.id, 'updates'))
          base.updates = ups.docs
            .map((u): RequestUpdate => {
              const data = u.data()
              return {
                id: u.id,
                kind: data.kind,
                location: data.location || undefined,
                whenText: data.whenText || undefined,
                comment: data.comment || undefined,
                createdAt: toMillis(data.createdAt),
              }
            })
            .sort((a, b) => a.createdAt - b.createdAt)
        } catch {
          /* 権限なし */
        }
        return base
      }),
    )
  }

  async createRequest(input: RequestInput): Promise<SearchRequest> {
    const id = doc(collection(db, 'requests')).id
    const batch = writeBatch(db)
    batch.set(doc(db, 'requests', id), {
      area: input.area,
      location: input.location.trim(),
      policeReported: input.policeReported,
      authorUid: uid(),
      hidden: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(db, 'requests', id, 'private', 'main'), {
      personName: input.personName.trim(),
      detail: input.detail.trim(),
      contact: input.contact.trim(),
      photoDataUrl: input.photoDataUrl ?? '',
      policeReportNumber: input.policeReportNumber.trim(),
    })
    await batch.commit()
    const now = Date.now()
    return {
      id,
      status: 'active',
      area: input.area,
      location: input.location.trim(),
      createdAt: now,
      updatedAt: now,
      policeReported: input.policeReported,
      authorUid: uid(),
      updates: [],
    }
  }

  async addUpdate(requestId: string, input: UpdateInput): Promise<SearchRequest> {
    const updateRef = doc(collection(db, 'requests', requestId, 'updates'))
    await setDoc(updateRef, {
      kind: input.kind,
      location: input.location.trim(),
      whenText: input.whenText.trim(),
      comment: input.comment.trim(),
      authorUid: uid(),
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'requests', requestId), {
      updatedAt: serverTimestamp(),
      updateCount: increment(1),
    })
    const all = await this.listRequests()
    const found = all.find((r) => r.id === requestId)
    if (!found) throw new Error('依頼が見つかりませんでした')
    return found
  }

  async resolveRequest(id: string): Promise<HistoryEntry> {
    const reqSnap = await getDoc(doc(db, 'requests', id))
    if (!reqSnap.exists()) throw new Error('依頼が見つかりませんでした')
    const meta = reqSnap.data()
    const ups = await getDocs(collection(db, 'requests', id, 'updates'))

    // 設計原則: 解決したら消える。private・updates・本体を物理削除し、
    // 履歴には日時・エリア・件数のみを残す。
    const entry = {
      area: meta.area as Area,
      resolvedAt: serverTimestamp(),
      elapsedMinutes: Math.max(
        0,
        Math.floor((Date.now() - toMillis(meta.createdAt)) / 60000),
      ),
      updateCount: ups.size,
    }
    const batch = writeBatch(db)
    batch.set(doc(db, 'history', id), entry)
    ups.docs.forEach((u) => batch.delete(u.ref))
    batch.delete(doc(db, 'requests', id, 'private', 'main'))
    batch.delete(doc(db, 'requests', id))
    await batch.commit()
    return {
      id,
      area: entry.area,
      resolvedAt: Date.now(),
      elapsedMinutes: entry.elapsedMinutes,
      updateCount: entry.updateCount,
    }
  }

  async listHistory(): Promise<HistoryEntry[]> {
    const snap = await getDocs(
      query(collection(db, 'history'), orderBy('resolvedAt', 'desc')),
    )
    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        area: data.area as Area,
        resolvedAt: toMillis(data.resolvedAt),
        elapsedMinutes: data.elapsedMinutes ?? 0,
        updateCount: data.updateCount ?? 0,
      }
    })
  }

  async getProfile(): Promise<Profile> {
    const snap = await getDoc(doc(db, 'users', uid()))
    if (!snap.exists()) throw new Error('プロフィールが見つかりませんでした')
    return profileFromDoc(snap.data())
  }

  async updateProfile(profile: Profile): Promise<Profile> {
    // status / area / organizationName はセキュリティルール上も本人からは変更不可
    await updateDoc(doc(db, 'users', uid()), {
      nickname: profile.nickname,
      district: profile.district,
      notify: profile.notify,
    })
    return profile
  }

  // 下書きは端末ローカルに保存（未投稿の個人情報をサーバに置かない）
  async loadDraft(): Promise<RequestInput | null> {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      return raw ? (JSON.parse(raw) as RequestInput) : null
    } catch {
      return null
    }
  }

  async saveDraft(draft: RequestInput): Promise<void> {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(DRAFT_KEY)
  }
}

export function profileFromDoc(data: Record<string, unknown>): Profile {
  const created = toMillis(data.createdAt)
  const d = new Date(created)
  return {
    nickname: (data.nickname as string) ?? '',
    area: data.area as Area,
    district: (data.district as string) ?? '',
    joinedAt: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    contributions: (data.contributions as number) ?? 0,
    status: data.status as Profile['status'],
    organizationName: (data.organizationName as string) || undefined,
    notify: (data.notify as Profile['notify']) ?? {
      newRequest: true,
      resolved: true,
      night: false,
    },
  }
}
