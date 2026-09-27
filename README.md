# Polaris Icon Maker

GitHub Pagesでそのまま公開できる静的アイコンフレームメーカーです。

## 公開方法
1. GitHubで新しいPublic repositoryを作成します。
2. このフォルダ内の `index.html`, `style.css`, `app.js`, `.nojekyll`, `frames` フォルダをリポジトリ直下へアップロードします。
3. Repository の **Settings → Pages** を開きます。
4. **Build and deployment → Source** を `Deploy from a branch` にします。
5. Branchを `main`、フォルダを `/(root)` にして保存します。
6. 数分後、Settings → Pages に表示されるURLからアクセスできます。

## プライバシー設計
ユーザーが選択した画像はJavaScriptの `URL.createObjectURL()` でブラウザ内から読み込み、Canvas APIでブラウザ内合成します。画像を外部サーバーへ送信するコード、Analytics、Cookie、SNS認証は含めていません。

※ GitHub Pages自体のアクセスログ等についてはGitHubのポリシーが適用されます。
