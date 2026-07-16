import type { SearchRequest } from '../types'

/** デモ用ダミーデータ（旧プロトタイプの文言を踏襲） */
export function seedRequests(): SearchRequest[] {
  const now = Date.now()
  return [
    {
      id: 'demo-1',
      status: 'active',
      area: '武蔵野市',
      location: '武蔵野市 吉祥寺北町2丁目付近',
      personName: '山田さん（仮）男性・60代',
      detail: '青いジャンパー着用、グレーのズボン。午前10時頃から行方不明。',
      contact: '警察受理番号 2025-0412、または家族 090-XXXX-XXXX',
      policeReported: true,
      policeReportNumber: '2025-0412',
      createdAt: now - 25 * 60 * 1000,
      updatedAt: now - 10 * 60 * 1000,
      updates: [
        {
          id: 'demo-1-u1',
          kind: 'sighting',
          location: '西東京市 田無駅北口',
          whenText: '11時頃',
          comment: '青いジャンパーの方が駅のベンチで休んでいました。警察に通報済みです。',
          createdAt: now - 10 * 60 * 1000,
        },
      ],
    },
  ]
}
