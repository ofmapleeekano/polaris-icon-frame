# Polaris 応援アイコンメーカー

GitHub Pages向けの静的サイトです。ユーザーが選ぶ写真はブラウザ内で処理し、アップロードしません。外部ライブラリ、解析タグ、SNSログインは使いません。

## ファイル構成

`index.html`、`style.css`、`app.js`、`.nojekyll`、`frames/` をリポジトリのルートに置きます。ZIPや親フォルダそのものをアップロードしないでください。

GitHubで **Settings → Pages → Deploy from a branch → main → /(root) → Save** を選択します。GitHub Freeの場合、Pagesを使うリポジトリはPublicにします。

## 動作確認

ローカルで `python3 -m http.server 8000` を実行し、`http://localhost:8000/` で確認できます。写真選択、5色の切り替え、ドラッグ、ピンチ、拡大スライダー、PNG保存を確認してください。

英字はAvenirを優先し、端末にない場合はMontserratなどにフォールバックします。日本語はNoto Sans JPを優先し、端末にない場合はシステムの日本語ゴシック体になります。Webフォントは外部配信しません。
