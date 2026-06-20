# KirA 外構概算シミュレーター アカウント防御チェックリスト

コードだけでなく、管理アカウント側も確認してください。

## GitHub

- 2段階認証をONにする
- 不要な共同編集者がいないか確認
- リポジトリに秘密情報が直書きされていないか検索
  - LINE_CHANNEL_ACCESS_TOKEN
  - LINE_CHANNEL_SECRET
  - LINE_TARGET_USER_ID
  - privateEstimateMaster
  - privateUnitPriceMaster
- secret scanning / push protection が使える場合は有効化

## Netlify

- 2段階認証をONにする
- 不要なメンバーがいないか確認
- 環境変数を確認
  - LINE_CHANNEL_ACCESS_TOKEN
  - LINE_CHANNEL_SECRET
  - LINE_TARGET_USER_ID
  - KIRA_ALLOWED_ORIGINS
- Deploy log にトークンや内部情報が出ていないか確認

## LINE Developers

- Channel access token を確認
- 漏えい疑いがあれば再発行
- 不要な管理者・権限者がいないか確認
- Webhook署名検証が有効な構成になっているか確認

## Google / GA4

- Googleアカウントの2段階認証をONにする
- GA4に知らないユーザーがいないか確認
- GA4へ名前・電話番号・メール・住所・感想全文・質問全文を送らない

## 公開側

- publicPriceMaster.js に原価・人工・利益率・危険度・内部メモがないか確認
- お客さん用アプリが private 系ファイルを読み込んでいないか確認
- index.html / app.js にLINEトークンがないか確認
