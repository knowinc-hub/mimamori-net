import type { Repository } from './repository'
import type { HistoryEntry, Post, PostInput, Profile } from '../types'
import { seedPosts } from './seed'

const KEYS = {
  posts: 'mimamori:posts',
  history: 'mimamori:history',
  profile: 'mimamori:profile',
  draft: 'mimamori:draft',
  seeded: 'mimamori:seeded',
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

/**
 * Phase 1 用のローカル実装。localStorage に保存し、初回のみデモデータを投入する。
 * Phase 2 で firestoreRepository に差し替える。
 */
export class LocalRepository implements Repository {
  constructor() {
    if (!localStorage.getItem(KEYS.seeded)) {
      write(KEYS.posts, seedPosts())
      write(KEYS.seeded, true)
    }
  }

  async listPosts(): Promise<Post[]> {
    await delay()
    return read<Post[]>(KEYS.posts, []).sort((a, b) => b.createdAt - a.createdAt)
  }

  async createPost(input: PostInput): Promise<Post> {
    await delay()
    const now = Date.now()
    const post: Post = {
      id: `p-${now}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      status: 'active',
      area: input.area,
      location: input.location.trim(),
      personName: input.personName.trim() || undefined,
      detail: input.detail.trim() || undefined,
      contact: input.contact.trim() || undefined,
      photoDataUrl:
        input.type === 'searching' && input.photoDataUrl
          ? input.photoDataUrl
          : undefined,
      policeReported: input.type === 'searching' ? input.policeReported : undefined,
      policeReportNumber:
        input.type === 'searching'
          ? input.policeReportNumber.trim() || undefined
          : undefined,
      createdAt: now,
      updatedAt: now,
      responses: 0,
    }
    const posts = read<Post[]>(KEYS.posts, [])
    posts.unshift(post)
    write(KEYS.posts, posts)
    return post
  }

  async addResponse(id: string): Promise<Post> {
    await delay(120)
    const posts = read<Post[]>(KEYS.posts, [])
    const post = posts.find((p) => p.id === id)
    if (!post) throw new Error('投稿が見つかりませんでした')
    post.responses += 1
    post.updatedAt = Date.now()
    write(KEYS.posts, posts)
    return post
  }

  async resolvePost(id: string): Promise<HistoryEntry> {
    await delay()
    const posts = read<Post[]>(KEYS.posts, [])
    const idx = posts.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('投稿が見つかりませんでした')
    const post = posts[idx]
    // 設計原則: 解決したら写真・氏名・詳細・連絡先は消える。
    // 履歴には日時・エリア・解決した事実のみを残す。
    posts.splice(idx, 1)
    write(KEYS.posts, posts)
    const entry: HistoryEntry = {
      id: post.id,
      area: post.area,
      resolvedAt: Date.now(),
      elapsedMinutes: Math.max(0, Math.floor((Date.now() - post.createdAt) / 60000)),
      responses: post.responses,
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

  async loadDraft(): Promise<PostInput | null> {
    return read<PostInput | null>(KEYS.draft, null)
  }

  async saveDraft(draft: PostInput): Promise<void> {
    write(KEYS.draft, draft)
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(KEYS.draft)
  }
}

export const repository: Repository = new LocalRepository()
