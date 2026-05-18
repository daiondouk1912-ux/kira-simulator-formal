# kirA 外構費用シミュレーター v9

## 更新内容

v9 は、現行版を壊さない前提で以下を改善した版です。

- 施工予定地エリアの任意入力を追加
- 長いセッションIDの代わりに、通知上は短い受付番号を表示
- 開始通知に受付番号・エリアを追加
- 結果通知に受付番号・エリアを追加
- 面積系項目に「㎡で入力 / 縦×横で入力 / 目安から選ぶ」を追加
- 相談ボタンは LINE トークへ戻る仕様を維持
- line-webhook は自動返信しない仕様

## 上書き対象

GitHub の `kira-simulator-formal / kira-simulator-formal` に以下を上書きしてください。

- app.js
- styles.css
- README.md
- netlify/functions/notify-start.js
- netlify/functions/notify-result.js
- netlify/functions/line-webhook.js

`_line.js` と `notify-test.js` は変更なしです。

## 注意

Netlify の環境変数は既存のまま使います。

- LINE_CHANNEL_ACCESS_TOKEN
- LINE_CHANNEL_SECRET
- LINE_TARGET_USER_ID

更新後は Netlify の最新デプロイが Published になってから、実機で以下を確認してください。

1. シミュレーター開始通知が届く
2. 開始通知に受付番号とエリアが出る
3. 縦×横入力で面積が自動計算される
4. 結果通知に受付番号・エリア・条件が出る
5. 「この内容で相談する」で LINE トークに戻る
