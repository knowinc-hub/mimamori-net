/** 対象エリア（特別支援学校の学区に対応する3自治体） */
export const AREAS = ['練馬区', '西東京市', '武蔵野市'] as const
export type Area = (typeof AREAS)[number]

/**
 * 捜索依頼に寄せられる更新情報の種類。
 * 発見報告・情報提供は独立した投稿ではなく、必ず捜索依頼にひも付く。
 */
export type UpdateKind = 'sighting' | 'info' | 'found'

export const UPDATE_KIND_LABEL: Record<UpdateKind, string> = {
  sighting: '目撃情報',
  info: '情報提供',
  found: '発見報告',
}

/** 捜索依頼への更新情報（目撃・情報提供・発見報告） */
export interface RequestUpdate {
  id: string
  kind: UpdateKind
  /** 見かけた場所（目撃情報では必須） */
  location?: string
  /** いつ頃（自由記述） */
  whenText?: string
  /** 様子・内容 */
  comment?: string
  createdAt: number
}

/**
 * 捜索依頼。
 * personName / detail / contact / photoDataUrl / updates は「解決時に消える」対象。
 * Phase 2 では requests/{id}/private サブコレクションに隔離する。
 */
export interface SearchRequest {
  id: string
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
  /** 写真（DataURL） */
  photoDataUrl?: string
  /** 警察届出済み確認（必須） */
  policeReported: boolean
  /** 警察受理番号（任意） */
  policeReportNumber?: string
  /** 寄せられた目撃情報・情報提供・発見報告 */
  updates: RequestUpdate[]
}

/**
 * 解決済み履歴。設計原則:「日時・エリア・解決した事実」のみを残す。
 * 氏名・写真・詳細な場所・連絡先・更新情報の内容は持たない。
 */
export interface HistoryEntry {
  id: string
  area: Area
  resolvedAt: number
  /** 依頼から解決までの分数 */
  elapsedMinutes: number
  /** 寄せられた情報の件数（内容は残さない） */
  updateCount: number
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

/** 捜索依頼ウィザードの入力値（下書き保存の単位） */
export interface RequestInput {
  area: Area
  location: string
  personName: string
  detail: string
  contact: string
  photoDataUrl: string | null
  policeReported: boolean
  policeReportNumber: string
}

export const EMPTY_REQUEST_INPUT: RequestInput = {
  area: '武蔵野市',
  location: '',
  personName: '',
  detail: '',
  contact: '',
  photoDataUrl: null,
  policeReported: false,
  policeReportNumber: '',
}

/** 更新情報フォームの入力値 */
export interface UpdateInput {
  kind: UpdateKind
  location: string
  whenText: string
  comment: string
}
