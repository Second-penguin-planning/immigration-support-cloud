# Immigration Support Cloud（仮称）

行政書士・登録支援機関・受入企業向けの、入管オンライン申請・特定技能定期届出業務効率化クラウドサービス。

プロジェクトの背景・要件・設計の詳細は [`docs/`](./docs/00_overview.md) を参照。

## 開発方法（Phase1時点）

前提: Node.js 24系、Docker（PostgreSQLをローカルで動かす場合）

```bash
# 依存パッケージのインストール
npm install

# 環境変数ファイルを作成（値は適宜書き換える）
cp .env.example .env.local

# 開発サーバー起動
npm run dev
```

http://localhost:3000 を開いて表示を確認する。

## よく使うコマンド

| コマンド                | 内容                             |
| ----------------------- | -------------------------------- |
| `npm run dev`           | 開発サーバー起動                 |
| `npm run build`         | 本番ビルド                       |
| `npm run lint`          | ESLint実行                       |
| `npm run typecheck`     | TypeScript型チェック             |
| `npm run format`        | Prettierで整形                   |
| `npm run format:check`  | Prettierの整形チェックのみ       |
| `npm run test`          | Vitestでユニットテスト実行       |
| `npm run test:watch`    | Vitestをwatchモードで実行        |
| `npm run test:coverage` | カバレッジ付きでテスト実行       |
| `npm run db:up`         | ローカルPostgreSQL(Docker)を起動 |
| `npm run db:down`       | ローカルPostgreSQL(Docker)を停止 |

## 開発フェーズ

Phase1（設計）〜Phase8（本番公開）まで段階的に開発する。
進捗と各フェーズの内容は [`docs/06_roadmap.md`](./docs/06_roadmap.md) を参照。
