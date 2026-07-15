import type { HistoryEntry, Post, PostInput, Profile } from '../types'

/**
 * データアクセスのリポジトリ層。
 * Phase 1 はローカル実装（localRepository）、Phase 2 で Firestore 実装に差し替える。
 * UI 側はこのインターフェースにのみ依存すること。
 */
export interface Repository {
  listPosts(): Promise<Post[]>
  createPost(input: PostInput): Promise<Post>
  /** 反応（見かけた・情報追加）を1件加算 */
  addResponse(id: string): Promise<Post>
  /**
   * 依頼を解決済みにする。設計原則どおり、写真・氏名・詳細・連絡先を
   * この時点で削除し、履歴には日時・エリアのみを残す。
   */
  resolvePost(id: string): Promise<HistoryEntry>
  listHistory(): Promise<HistoryEntry[]>

  getProfile(): Promise<Profile>
  updateProfile(profile: Profile): Promise<Profile>

  /** 投稿ウィザードの下書き */
  loadDraft(): Promise<PostInput | null>
  saveDraft(draft: PostInput): Promise<void>
  clearDraft(): Promise<void>
}
