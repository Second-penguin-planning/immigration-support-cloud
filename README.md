# Immigration Support Cloud（仮称）

行政書士・登録支援機関・受入企業向けの、入管オンライン申請・特定技能定期届出業務効率化クラウドサービス。

プロジェクトの背景・要件・設計の詳細は [`docs/`](./docs/00_overview.md) を参照。

## 開発方法（Phase2時点）

前提: Node.js 24系、Docker（PostgreSQLをローカルで動かす場合）

```bash
# 依存パッケージのインストール（postinstallでPrisma Clientも生成される）
npm install

# 環境変数ファイルを作成（値は適宜書き換える。ENCRYPTION_MASTER_KEYは`openssl rand -base64 32`等で生成）
cp .env.example .env.local

# ローカルPostgreSQLを起動
npm run db:up

# マイグレーション適用（初回は prisma/migrations の履歴を適用）
npm run db:deploy

# 動作確認用のサンプルデータ投入
npm run db:seed

# 開発サーバー起動
npm run dev
```

http://localhost:3000 を開いて表示を確認する。
DBの中身は `npm run db:studio` でGUI確認できる。

> Prisma 7からは接続文字列を `prisma.config.ts` から読み込み、`PrismaClient`には
> `@prisma/adapter-pg` のドライバアダプタを渡す方式に変更されている
> （`prisma/schema.prisma` の `datasource` に `url` は書かない）。

## よく使うコマンド

| コマンド                | 内容                                                 |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | 開発サーバー起動                                     |
| `npm run build`         | 本番ビルド                                           |
| `npm run lint`          | ESLint実行                                           |
| `npm run typecheck`     | TypeScript型チェック                                 |
| `npm run format`        | Prettierで整形                                       |
| `npm run format:check`  | Prettierの整形チェックのみ                           |
| `npm run test`          | Vitestでユニットテスト実行                           |
| `npm run test:watch`    | Vitestをwatchモードで実行                            |
| `npm run test:coverage` | カバレッジ付きでテスト実行                           |
| `npm run db:up`         | ローカルPostgreSQL(Docker)を起動                     |
| `npm run db:down`       | ローカルPostgreSQL(Docker)を停止                     |
| `npm run db:migrate`    | スキーマ変更から開発用マイグレーションを作成・適用   |
| `npm run db:deploy`     | 既存のマイグレーション履歴をDBに適用（本番・CI向け） |
| `npm run db:seed`       | サンプルデータを投入                                 |
| `npm run db:studio`     | Prisma StudioでDBの中身をGUI確認                     |

## 開発フェーズ

Phase1（設計）〜Phase8（本番公開）まで段階的に開発する。
進捗と各フェーズの内容は [`docs/06_roadmap.md`](./docs/06_roadmap.md) を参照。
