import type {
  HistoryEntry,
  Profile,
  RequestInput,
  SearchRequest,
  UpdateInput,
} from '../types'

/**
 * データアクセスのリポジトリ層。
 * Phase 1 はローカル実装（localRepository）、Phase 2 で Firestore 実装に差し替える。
 * UI 側はこのインターフェースにのみ依存すること。
 */
export interface Repository {
  listRequests(): Promise<SearchRequest[]>
  createRequest(input: RequestInput): Promise<SearchRequest>
  /** 依頼に目撃情報・情報提供・発見報告を追加する */
  addUpdate(requestId: string, input: UpdateInput): Promise<SearchRequest>
  /**
   * 依頼を解決済みにする。設計原則どおり、写真・氏名・詳細・連絡先・
   * 更新情報の内容をこの時点で削除し、履歴には日時・エリア・件数のみを残す。
   */
  resolveRequest(id: string): Promise<HistoryEntry>
  listHistory(): Promise<HistoryEntry[]>

  getProfile(): Promise<Profile>
  updateProfile(profile: Profile): Promise<Profile>

  /** 捜索依頼ウィザードの下書き */
  loadDraft(): Promise<RequestInput | null>
  saveDraft(draft: RequestInput): Promise<void>
  clearDraft(): Promise<void>
}
