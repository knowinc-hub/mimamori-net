# Phase 2 着手前の決定事項

決定日: 2026-07-16（Phase 1 デプロイ完了時にオーナー確認済み）

| # | 判断点 | 決定 |
|---|---|---|
| 1 | Firebase プロジェクトのアカウント | **know-corp のアカウント**（fukatsu@know-corp.jp）で作成。将来の引き継ぎはオーナー権限の移譲で対応。Blaze 化の際は予算アラート（月1,000円）を必ず設定 |
| 2 | 招待コードの配布単位 | **団体ごとに個別コード**。流出時はそのコードのみ無効化、登録経路も把握できるようにする。管理画面から発行・停止できる機能を Phase 2 に含める |
| 3 | エリアマッチングの粒度 | **自治体単位のまま**（練馬区・西東京市・武蔵野市の3択）。細分化・隣接通知は Phase 3 で再検討 |
| 4 | 初期管理者 | **深津さん1名で開始**。管理画面は複数管理者に対応する設計にしておき、運用マニュアル（Phase 4）整備後に団体側へ拡大 |

## この決定による Phase 2 実装への反映

- `users.area` は3自治体の enum のまま（Phase 1 の `AREAS` を踏襲）
- `inviteCodes` コレクション: `{ code, organizationName, active, createdAt }`。登録時にコードを検証し、ユーザーに `organizationName` を記録
- 管理者権限は Custom Claims（`admin: true`）で複数人対応。初期データとして深津さんのアカウントに付与
- 開発は無料の Spark プランで開始し、自動削除のスケジュール関数を入れる段階で Blaze にアップグレード

## オーナー側の作業（Phase 2 着手時に必要）

1. https://console.firebase.google.com で know-corp アカウントにログインし、新規プロジェクト「mimamori-net」を作成（この時点では無料の Spark プランで可）
2. プロジェクトの Web アプリを追加し、表示される firebaseConfig を共有（公開情報なのでチャットに貼って問題ありません）
3. Authentication → Sign-in method で「メールリンク」を有効化
