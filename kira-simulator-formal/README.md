# kirA 外構費用シミュレーター v13

## 更新内容

v13 は、お客さま用概算シミュレーターと将来の自分用概算アプリで、計算方式・公開用概算レンジを共通化するための土台版です。

- 公開用の概算レンジ・項目設定を `publicPriceMaster.js` に分離
- `app.js` は `publicPriceMaster.js` を読み込んで計算する形へ変更
- 原価・人工原価・利益率などの内部情報は一切入れていません
- v12.1 の入力不足防止は維持
- v12 の追加項目・小規模概算レンジは維持

## 重要ルール

`publicPriceMaster.js` は、お客さまに見えても問題ない公開用の概算マスターです。

以下の情報は絶対に入れないでください。

- 材料原価
- 人工原価
- 利益率
- 社内最低人工
- リース原価
- 処分原価
- 外注原価

将来の自分用概算アプリでは、この公開用マスターを読み込んだうえで、自分用アプリ側だけに原価・利益・人工メモを持たせます。

## 上書き対象

GitHub の `kira-simulator-formal / kira-simulator-formal` に以下を上書き・追加してください。

- app.js
- publicPriceMaster.js
- index.html
- README.md

## 触らなくていいもの

- styles.css
- notify-result.js
- notify-event.js
- notify-start.js
- line-webhook.js
- _line.js
- notify-test.js
- netlify.toml

## テスト項目

更新後は、以下を確認してください。

1. シミュレーターが正常に開く
2. 工事項目が今まで通り表示される
3. タイルデッキ・アプローチ・土留めなどの追加項目が計算できる
4. 入力不足時に結果へ進めない
5. LINE通知が今まで通り届く
6. ブラウザのエラーが出ない

## 今後の予定

次の段階で、自分用概算アプリを作る場合は、この `publicPriceMaster.js` を共通で使うことで、お客さま用と自分用の概算計算方式を揃えます。
