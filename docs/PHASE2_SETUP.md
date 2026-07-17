# Phase 2 セットアップ手順（Firebase コンソール作業）

Phase 2 のコードを本番で動かすために必要な、コンソールでの一度きりの作業です。
すべて https://console.firebase.google.com の「mimamori-net」プロジェクトで行います。

## 1. Firestore データベースの作成

1. 左メニュー「Firestore Database」→「データベースを作成」
2. ロケーション: **asia-northeast1（東京）** を選択（後から変更できません）
3. 「本番環境モード」で作成（ルールはこの後デプロイするのでどちらでも可）

## 2. Authentication の設定

1. 左メニュー「Authentication」→「始める」
2. 「Sign-in method」→「メール / パスワード」を選び、**「メールリンク（パスワードなしでログイン）」を有効化**して保存
3. 「Settings」→「承認済みドメイン」に **`knowinc-hub.github.io`** を追加
   （localhost と firebaseapp.com は最初から入っています）

## 3. セキュリティルールのデプロイ

ターミナルから（リポジトリのルートで）:

```bash
npx firebase login          # know-corp アカウントでログイン（初回のみ）
npx firebase deploy --only firestore:rules
```

## 4. 初期データの投入（Firestore コンソールの「データ」タブから手動で）

### 招待コード（最初の1つ）

- コレクション: `inviteCodes`
- ドキュメントID: 配布したいコード文字列（例: `SHAKUJII-2026`。英数字とハイフン推奨）
- フィールド:
  - `organizationName` (string): 配布先団体名（例: `石神井特別支援学校PTA`）
  - `active` (boolean): `true`

### 最初の管理者（自分）の承認 — ブートストラップ

1. アプリ（本番URL）を開き、自分のメールアドレスでログイン → 上の招待コードで会員登録（→承認待ち画面になる）
2. Firestore コンソールの `users` コレクションに自分のドキュメントができているので、
   ドキュメントID（= 自分のUID）をコピーし、フィールド `status` を `pending` → **`approved`** に変更
3. コレクション `admins` を作成し、**ドキュメントID = 自分のUID**、フィールド `createdAt` (number): 0 で追加
   - **重要**: UID は必ず Firestore コンソールの `users` ドキュメントID からコピー&ペーストすること。目視での書き写しは厳禁（小文字の l と大文字の I はコンソール上で区別がつかず、1文字違うと管理者と認識されない）
4. アプリに戻ると（リロード不要で）ホーム画面が表示されます

以降のメンバーの承認は、Phase 2 後半で実装する管理画面から行えるようになります。
それまでは同様に Firestore コンソールの `users` の `status` 変更で承認できます。

## 5. 動作確認のポイント

- 未ログインで本番URLを開く → ログイン画面のみ表示される（依頼情報が見えないこと）
- 承認前のアカウント → 「承認をお待ちください」で止まること
- 依頼を投稿→解決 → Firestore コンソールで `requests` からドキュメントが消え、`history` に日時・エリアのみ残ること

## 開発メモ

- ローカル開発（エミュレータ）: `npm run emulators` を起動したうえで `VITE_EMULATOR=1 npm run dev`
- UIだけ触る（Firebase不要のモック）: `VITE_REPOSITORY=local npm run dev`
- ルールのテスト: `npm run test:rules`（Java が必要: `brew install openjdk`）
