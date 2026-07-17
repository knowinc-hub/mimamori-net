import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

/**
 * 投稿への通報を作成する（一般メンバー用）。
 * 通報の内容は管理者のみが閲覧できる（firestore.rules）。
 */
export async function createReport(input: {
  requestId: string
  requestSummary: string
  reason: string
  detail: string
}): Promise<void> {
  const u = auth.currentUser
  if (!u) throw new Error('ログインが必要です')
  await addDoc(collection(db, 'reports'), {
    requestId: input.requestId,
    requestSummary: input.requestSummary,
    reason: input.reason,
    detail: input.detail.trim(),
    reporterUid: u.uid,
    status: 'open',
    createdAt: serverTimestamp(),
  })
}
