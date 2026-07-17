import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Area, MemberStatus, Report } from '../types'
import { profileFromDoc } from './firestoreRepository'
import type { Profile } from '../types'

/** 管理画面専用のデータアクセス。セキュリティルール側で管理者のみに制限されている。 */

export interface Member extends Profile {
  uid: string
}

export interface InviteCode {
  code: string
  organizationName: string
  active: boolean
}

const toMillis = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : 0)

export async function listMembers(): Promise<Member[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ uid: d.id, ...profileFromDoc(d.data()) }))
}

export async function setMemberStatus(uid: string, status: MemberStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status })
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  const snap = await getDocs(collection(db, 'inviteCodes'))
  return snap.docs
    .map((d) => ({
      code: d.id,
      organizationName: (d.data().organizationName as string) ?? '',
      active: Boolean(d.data().active),
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export async function createInviteCode(code: string, organizationName: string): Promise<void> {
  const ref = doc(db, 'inviteCodes', code)
  if ((await getDoc(ref)).exists()) {
    throw new Error('同じコードがすでに存在します')
  }
  await setDoc(ref, { organizationName, active: true, createdAt: serverTimestamp() })
}

export async function setInviteCodeActive(code: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'inviteCodes', code), { active })
}

export async function listReports(): Promise<Report[]> {
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      requestId: data.requestId as string,
      requestSummary: (data.requestSummary as string) ?? '',
      reason: data.reason as string,
      detail: (data.detail as string) || undefined,
      reporterUid: data.reporterUid as string,
      status: data.status as Report['status'],
      createdAt: toMillis(data.createdAt),
    }
  })
}

export async function setReportStatus(id: string, status: Report['status']): Promise<void> {
  await updateDoc(doc(db, 'reports', id), { status })
}

/** 通報対象の依頼の現在の状態（存在有無・非表示か）を取得。管理者のみ読める */
export async function getRequestState(
  requestId: string,
): Promise<{ exists: boolean; hidden: boolean; area?: Area; location?: string }> {
  const snap = await getDoc(doc(db, 'requests', requestId))
  if (!snap.exists()) return { exists: false, hidden: false }
  return {
    exists: true,
    hidden: Boolean(snap.data().hidden),
    area: snap.data().area as Area,
    location: snap.data().location as string,
  }
}

export async function setRequestHidden(requestId: string, hidden: boolean): Promise<void> {
  await updateDoc(doc(db, 'requests', requestId), { hidden })
}
