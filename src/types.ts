/** 対象エリア（特別支援学校の学区に対応する3自治体） */
export const AREAS = ['練馬区', '西東京市', '武蔵野市'] as const
export type Area = (typeof AREAS)[number]

/** 投稿の種類 */
export type PostType = 'searching' | 'found' | 'info'

export const POST_TYPE_LABEL: Record<PostType, string> = {
  searching: '捜索依頼',
  found: '発見報告',
  info: '情報提供',
}

/**
 * 捜索依頼・発見報告・情報提供の投稿。
 * personName / detail / contact / photoDataUrl は「解決時に消える」対象。
 * Phase 2 では requests/{id}/private サブコレクションに隔離する。
 */
export interface Post {
  id: string
  type: PostType
  status: 'active' | 'resolved'
  area: Area
  /** 最後に見かけた場所（自由記述） */
  location: string
  createdAt: number
  updatedAt: number
  /** 名前・特徴（任意） */
  personName?: string
  /** 詳細・服装など */
  detail?: string
  /** 連絡先（警察受理番号 or 電話） */
  contact?: string
  /** 写真（捜索依頼のみ・DataURL） */
  photoDataUrl?: string
  /** 警察届出済み確認（捜索依頼は必須） */
  policeReported?: boolean
  /** 警察受理番号（任意） */
  policeReportNumber?: string
  /** 反応数 */
  responses: number
}

/**
 * 解決済み履歴。設計原則:「日時・エリア・解決した事実」のみを残す。
 * 氏名・写真・詳細な場所・連絡先は持たない。
 */
export interface HistoryEntry {
  id: string
  area: Area
  resolvedAt: number
  /** 投稿から解決までの分数 */
  elapsedMinutes: number
  responses: number
}

/** 利用者プロフィール（Phase 1 はローカルのダミー） */
export interface Profile {
  nickname: string
  area: Area
  district: string
  joinedAt: string
  contributions: number
  notify: {
    newRequest: boolean
    resolved: boolean
    night: boolean
  }
}

/** 投稿ウィザードの入力値（下書き保存の単位） */
export interface PostInput {
  type: PostType
  area: Area
  location: string
  personName: string
  detail: string
  contact: string
  photoDataUrl: string | null
  policeReported: boolean
  policeReportNumber: string
}

export const EMPTY_POST_INPUT: PostInput = {
  type: 'searching',
  area: '武蔵野市',
  location: '',
  personName: '',
  detail: '',
  contact: '',
  photoDataUrl: null,
  policeReported: false,
  policeReportNumber: '',
}
