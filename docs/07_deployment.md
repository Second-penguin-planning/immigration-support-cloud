# 本番デプロイ・バックアップ運用（Phase8）

本ドキュメントはVercelへの本番デプロイ手順と、PostgreSQLのバックアップ・リストア運用をまとめる。
実際のデプロイ実行（Vercelアカウントでの操作、本番DB・本番S3バケットの契約等）はユーザー自身の
環境・認証情報が必要なため、本Phaseでは手順・スクリプト・設定の整備までを行い、実際の本番環境への
デプロイ実行はユーザーが行う。

## 1. 事前準備（本番用の外部サービス）

| 項目 | 選択肢の例 | 備考 |
| --- | --- | --- |
| ホスティング | Vercel | Next.js公式ホスティング。本プロジェクトの前提 |
| PostgreSQL | Vercel Postgres / Neon / Supabase 等のマネージドPostgres | サーバーレス関数からの大量同時接続に備え、**コネクションプーリング対応の接続文字列**を`DATABASE_URL`に設定すること（各サービスの「Pooled connection」等の名称の接続文字列） |
| ファイルストレージ | Amazon S3 等のS3互換オブジェクトストレージ | Vercelはサーバーレスのためローカルディスクがインスタンス間・デプロイ間で永続化されない。`FILE_STORAGE_DRIVER=local`のまま本番運用しないこと（詳細は3節） |
| メール送信 | 契約中のSMTPサービス | `.env.example`の`EMAIL_SERVER_*`を参照 |

## 2. Vercelへのデプロイ

1. GitHubリポジトリをVercelにインポートする（Next.jsは自動検出されるため`vercel.json`は不要）
2. Vercelプロジェクトの Environment Variables に、`.env.example` に列挙された全項目を設定する
   （`NODE_ENV`はVercelが自動設定するため不要。`APP_BASE_URL`と`AUTH_URL`は本番ドメイン、
   例: `https://your-domain.example.com` に設定する）
3. `package.json`の`engines.node`（`>=20.9.0`）に合わせて、Vercelプロジェクト設定の
   Node.jsバージョンを確認する
4. ビルドコマンドは標準の`next build`のままでよい（`postinstall`で`prisma generate`が
   自動実行される。ライブDB接続は不要、スキーマからのコード生成のみのため）
5. **マイグレーションはビルド時に自動実行しない**（サーバーレスの複数ビルドが同時に
   本番DBへ`migrate deploy`を走らせるレースコンディションを避けるため）。
   デプロイ前後の適切なタイミングで手動、またはCI/CDの専用ステップで以下を実行する。
   ```bash
   DATABASE_URL="<本番のDB接続文字列>" npm run db:deploy
   ```
6. 初回デプロイ後、実際にログイン・顧客管理・CSV生成等の主要導線をブラウザで確認する
   （本セッションではローカルDocker環境の不具合により未実施。[06_roadmap.md](./06_roadmap.md)参照）

## 3. ファイルストレージをS3へ切り替える

ローカル開発では`FILE_STORAGE_DRIVER=local`（ディスク直書き、[src/server/storage/local-storage.ts](../src/server/storage/local-storage.ts)）を使うが、
本番（Vercel）では以下の設定でS3互換ストレージ（[src/server/storage/s3-storage.ts](../src/server/storage/s3-storage.ts)）に切り替える。

```
FILE_STORAGE_DRIVER="s3"
S3_BUCKET="<バケット名>"
S3_ACCESS_KEY_ID="<アクセスキー>"
S3_SECRET_ACCESS_KEY="<シークレットキー>"
S3_REGION="ap-northeast-1"
# AWS S3本体ではなくMinIO等のS3互換ストレージを使う場合のみ設定する
S3_ENDPOINT=""
```

切り替えは`src/server/storage/index.ts`のfacadeが環境変数を見て自動的に行うため、
アプリケーションコード側の変更は不要（[src/features/documents/actions.ts](../src/features/documents/actions.ts)等の呼び出し元は
すでに`@/server/storage`のfacade経由に統一済み）。バケットは非公開設定とし、
ダウンロードは`/api/documents/[documentId]`（認証・RBAC・監査対象）を経由させる。

## 4. 暗号鍵（ENCRYPTION_MASTER_KEY）の管理

- 旅券番号・在留カード番号の暗号化に使う`ENCRYPTION_MASTER_KEY`は、紛失すると
  既存の暗号化データが復号不能になる（[05_security.md](./05_security.md)参照）
- Vercelの Environment Variables に設定するのとは別に、鍵そのものをパスワードマネージャー等
  オフラインの安全な場所にもバックアップしておくこと（Vercel側の設定削除・誤操作に備える）
- ローテーション（鍵の更新）を行う場合は、旧鍵で全件復号→新鍵で再暗号化するマイグレーション
  スクリプトが別途必要になる（本プロジェクトの範囲では未実装。鍵は初回設定後は
  基本的に変更しない運用を前提とする）

## 5. データベースのバックアップ運用

[scripts/backup-db.sh](../scripts/backup-db.sh) / [scripts/restore-db.sh](../scripts/restore-db.sh) で
`pg_dump`のカスタム形式によるバックアップ・リストアを行う。ローカルのdocker-composeコンテナ
（`isc-postgres`）が起動していればコンテナ内のクライアントを使い、起動していなければ
`DATABASE_URL`宛てにホストの`pg_dump`/`pg_restore`を使う（本番DBを直接指定する場合に対応）。

```bash
# バックアップ（backups/backup_YYYYMMDD_HHMMSS.dump が作成される。.gitignore対象）
npm run db:backup

# リストア（対象DBの既存データを上書きするため確認プロンプトが出る。--yesで省略可）
npm run db:restore -- backups/backup_20260705_120000.dump
```

- マネージドPostgres（Vercel Postgres/Neon/Supabase等）を使う場合は、多くのサービスが
  自動日次バックアップ・Point-in-Time Recoveryを標準提供している。まずそちらを一次的な
  復元手段とし、`db:backup`はマイグレーション実行前後の任意タイミングでのスナップショットや、
  サービス側バックアップとは別の保管場所への二重化用途として使う
- 本番でのバックアップは日次で自動実行されるようスケジューリングする（例: GitHub Actionsの
  スケジュール実行や外部Cron→`npm run db:backup`を呼ぶジョブを別途構築する。本Phaseでは
  スクリプトの提供までとし、スケジューラの構築はユーザー環境（CI/CD）に依存するため対象外とする）
- バックアップファイルは個人情報を含む（旅券番号・在留カード番号は暗号化されているが、
  氏名・連絡先等は平文で含まれる）ため、`.gitignore`で`/backups`を除外済み。
  保管する場合は暗号化ストレージ・アクセス制御された場所に置くこと

### 復元テスト

- 定期的に（例: 月次で）バックアップからの復元テストを別環境（本番と隔離したステージング等）で
  実施し、`db:restore`が実際に機能することを確認する運用を推奨する
- **本セッションでは復元テストを実施できていない**: ローカルDocker Desktopの環境不具合により
  `isc-postgres`コンテナを起動できず、`npm run db:backup` / `npm run db:restore`の
  実データに対する動作確認（スクリプトの分岐ロジック自体はDocker停止時のフォールバック経路を
  手動実行して確認済み）ができていない。Docker環境復旧後、または本番相当のステージングDBが
  用意でき次第、実データでのバックアップ→リストアの往復確認を行うこと

## 6. デプロイ前チェックリスト

- [ ] `.env.example`の全項目をVercel Environment Variablesに設定した（プレースホルダのまま残していない）
- [ ] `DATABASE_URL`はコネクションプーリング対応の接続文字列である
- [ ] `FILE_STORAGE_DRIVER=s3`に設定し、S3関連の環境変数を設定した
- [ ] `AUTH_URL` / `APP_BASE_URL`を本番ドメインに設定した
- [ ] `npm run db:deploy`で本番DBにマイグレーションを適用した
- [ ] `npm run db:seed`は本番では実行しない（サンプルデータのため。実データ投入は別途行う）
- [ ] 管理者アカウントを1件作成し、ログイン・主要導線を確認した
- [ ] バックアップの自動実行（日次）をCI/CD等でスケジューリングした
- [ ] `ENCRYPTION_MASTER_KEY`をオフラインの安全な場所にもバックアップした
