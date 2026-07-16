import type { Repository } from './repository'
import type {
  HistoryEntry,
  Profile,
  RequestInput,
  SearchRequest,
  UpdateInput,
} from '../types'
import { seedRequests } from './seed'

// スキーマ変更時はバージョンを上げて古いローカルデータを無視する
const KEYS = {
  requests: 'mimamori:v2:requests',
  history: 'mimamori:v2:history',
  profile: 'mimamori:v2:profile',
  draft: 'mimamori:v2:draft',
  seeded: 'mimamori:v2:seeded',
} as const

const DEFAULT_PROFILE: Profile = {
  nickname: '田中さん',
  area: '武蔵野市',
  district: '吉祥寺',
  joinedAt: '2025年4月',
  contributions: 3,
  notify: { newRequest: true, resolved: true, night: false },
}

/** ローディング状態をUIで確認できるよう、わずかな遅延を挟む */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Phase 1 用のローカル実装。localStorage に保存し、初回のみデモデータを投入する。
 * Phase 2 で firestoreRepository に差し替える。
 */
export class LocalRepository implements Repository {
  constructor() {
    if (!localStorage.getItem(KEYS.seeded)) {
      write(KEYS.requests, seedRequests())
      write(KEYS.seeded, true)
    }
  }

  async listRequests(): Promise<SearchRequest[]> {
    await delay()
    return read<SearchRequest[]>(KEYS.requests, []).sort(
      (a, b) => b.createdAt - a.createdAt,
    )
  }

  async createRequest(input: RequestInput): Promise<SearchRequest> {
    await delay()
    const now = Date.now()
    const request: SearchRequest = {
      id: newId('r'),
      status: 'active',
      area: input.area,
      location: input.location.trim(),
      personName: input.personName.trim() || undefined,
      detail: input.detail.trim() || undefined,
      contact: input.contact.trim() || undefined,
      photoDataUrl: input.photoDataUrl ?? undefined,
      policeReported: input.policeReported,
      policeReportNumber: input.policeReportNumber.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      updates: [],
    }
    const requests = read<SearchRequest[]>(KEYS.requests, [])
    requests.unshift(request)
    write(KEYS.requests, requests)
    return request
  }

  async addUpdate(requestId: string, input: UpdateInput): Promise<SearchRequest> {
    await delay(150)
    const requests = read<SearchRequest[]>(KEYS.requests, [])
    const request = requests.find((r) => r.id === requestId)
    if (!request) throw new Error('依頼が見つかりませんでした')
    request.updates.push({
      id: newId('u'),
      kind: input.kind,
      location: input.location.trim() || undefined,
      whenText: input.whenText.trim() || undefined,
      comment: input.comment.trim() || undefined,
      createdAt: Date.now(),
    })
    request.updatedAt = Date.now()
    write(KEYS.requests, requests)
    return request
  }

  async resolveRequest(id: string): Promise<HistoryEntry> {
    await delay()
    const requests = read<SearchRequest[]>(KEYS.requests, [])
    const idx = requests.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('依頼が見つかりませんでした')
    const request = requests[idx]
    // 設計原則: 解決したら写真・氏名・詳細・連絡先・更新情報の内容は消える。
    // 履歴には日時・エリア・件数のみを残す。
    requests.splice(idx, 1)
    write(KEYS.requests, requests)
    const entry: HistoryEntry = {
      id: request.id,
      area: request.area,
      resolvedAt: Date.now(),
      elapsedMinutes: Math.max(0, Math.floor((Date.now() - request.createdAt) / 60000)),
      updateCount: request.updates.length,
    }
    const history = read<HistoryEntry[]>(KEYS.history, [])
    history.unshift(entry)
    write(KEYS.history, history)
    return entry
  }

  async listHistory(): Promise<HistoryEntry[]> {
    await delay()
    return read<HistoryEntry[]>(KEYS.history, []).sort(
      (a, b) => b.resolvedAt - a.resolvedAt,
    )
  }

  async getProfile(): Promise<Profile> {
    await delay(100)
    return read<Profile>(KEYS.profile, DEFAULT_PROFILE)
  }

  async updateProfile(profile: Profile): Promise<Profile> {
    write(KEYS.profile, profile)
    return profile
  }

  async loadDraft(): Promise<RequestInput | null> {
    return read<RequestInput | null>(KEYS.draft, null)
  }

  async saveDraft(draft: RequestInput): Promise<void> {
    write(KEYS.draft, draft)
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(KEYS.draft)
  }
}

export const repository: Repository = new LocalRepository()
