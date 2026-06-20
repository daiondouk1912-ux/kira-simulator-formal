# KirA 外構概算シミュレーター v13.9 セキュリティ強化版

作成日：2026-06-20
目的：HPからの流入増加に備え、LINE通知・質問送信・感想送信・通知API周りを安全にする。

## 今回入れた内容

- Netlify Functions側の共通セキュリティ helper 追加
  - `netlify/functions/_security.js`
- 通知APIの入力チェック強化
  - `notify-start.js`
  - `notify-event.js`
  - `notify-result.js`
- POST以外の拒否
- JSONサイズ制限
- Origin / Sec-Fetch-Site の確認
- ハニーポット項目の拒否
- 受付番号・エリア・文字列・数値の安全化
- 感想・質問系の空欄・記号のみ・URL連投対策
- 同一内容の短時間重複通知防止
- LINE通知エラー時に内部情報を画面へ返さない
- クライアント側の軽い連打・重複送信防止
  - `security-client.js`
- セキュリティヘッダー追加
  - `_headers`

## 今回入れていない内容

- GA4測定ID設定
- 感想の選択式化
- 検討状況ボタン
- LIFF化
- AI受付メモ
- 自分用概算アプリ連動
- HP側の変更

## 上書き・追加するファイル

GitHub直下：

- `_headers` 追加
- `security-client.js` 追加
- `README_v13_9_SECURITY.md` 追加
- `INDEX_HTML_ADD_THIS_ONE_LINE.txt` 参考用
- `SECURITY_ACCOUNT_CHECKLIST.md` 参考用
- `DEPLOY_CHECKLIST_v13_9.md` 参考用

Netlify Functions：

- `netlify/functions/_security.js` 追加
- `netlify/functions/notify-start.js` 上書き
- `netlify/functions/notify-event.js` 上書きまたは追加
- `netlify/functions/notify-result.js` 上書き

## 触らないファイル

- `netlify/functions/_line.js`
- `netlify/functions/line-webhook.js`
- `netlify/functions/notify-test.js`
- `netlify.toml`
- `publicPriceMaster.js`
- `app.js` は今回は直接上書きしない

## index.html の追加作業

`security-client.js` を動かすため、`index.html` の `app.js` より前に以下を1行追加してください。

```html
<script src="./security-client.js"></script>
```

例：

```html
<script src="./publicPriceMaster.js"></script>
<script src="./security-client.js"></script>
<script src="./app.js"></script>
```

## Netlify環境変数

既存のまま必要：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `LINE_TARGET_USER_ID`

追加推奨：

- `KIRA_ALLOWED_ORIGINS`
  - 例：`https://kira-simulator-formal.netlify.app,https://独自ドメイン`
- `KIRA_STRICT_ORIGIN`
  - 最初は未設定でOK
  - 安定確認後に `1` にすると、Originなしの直接POSTもより厳しく拒否できます

## デプロイ後の確認

- トップ画面が開く
- 工事項目が選べる
- 数量入力できる
- 結果画面が出る
- LINE保存ボタンが動く
- 質問ボタンが動く
- 感想送信が動く
- 開始通知が届く
- 結果通知が届く
- 行動通知が届く
- 入力項目数・滞在時間が崩れない
- 空欄やscriptタグが通知に出ない
- 連打しても通知が大量送信されない
- Netlify deploy が緑チェック

## 不具合時に見る場所

1. Netlify Deploy log
2. Netlify Functions log
3. ブラウザのConsole
4. LINE Developersのアクセストークン状態
5. Netlify環境変数

## 注意

v13.9はセキュリティ強化のみを目的とします。GA4や感想選択式は次回以降に分けます。
