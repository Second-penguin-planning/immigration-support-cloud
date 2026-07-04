# システム構成・技術選定

## 1. 技術スタック

| 領域 | 採用技術 | 理由 |
| --- | --- | --- |
| 言語 | TypeScript (strict) | 型安全性を担保し、行政手続きデータの取り違えを防ぐ |
| フレームワーク | Next.js 16 (App Router) | フロント/バックエンドを1リポジトリに統合でき、Vercelとの親和性が高い |
| UI | React 19 / Tailwind CSS v4 | 学習コストが低く、シンプルなUIを素早く構築できる |
| DB | PostgreSQL | リレーショナルなデータ（法人-外国人-在留資格-書類）の整合性をDB側で担保できる |
| ORM | Prisma | スキーマ駆動でマイグレーション・型生成を自動化できる（Phase2で導入） |
| 認証 | Auth.js (next-auth) | メール認証・パスワードリセット・複数ロールをカバーできる（Phase3で導入） |
| コンテナ | Docker / docker-compose | ローカルのPostgreSQLをOSに依存せず再現できる |
| ホスティング | Vercel | Next.jsとの統合が最も簡単で、プレビューデプロイが標準機能 |
| CI/VCS | GitHub / GitHub Actions | Lint・型チェック・テストをPR時に自動実行する |

### Next.js 16 における主要な破壊的変更（実装時の注意）

- `middleware.ts` は廃止され `proxy.ts` に名称変更された（`middleware()` → `proxy()`）。
  Phase3のログイン・認可ガードはこの新しい規約で実装する。
- Proxy(旧Middleware)は「保険」であり、各Server Action/Route Handler内でも
  必ず認可チェックを行う（Proxyのmatcher変更で意図せず保護が外れるリスクへの対策）。
- Turbopackがデフォルトビルドツールになっている。

### Prisma 7 における主要な破壊的変更（実装時の注意、Phase2で確認）

- `schema.prisma` の `datasource` に `url` を直接書く方式は廃止。接続文字列は
  プロジェクトルートの `prisma.config.ts` から読み込む（`dotenv/config` で `.env` を読み込み）。
- `PrismaClient` は `@prisma/adapter-pg` 等のドライバアダプタを明示的に渡して生成する
  （`new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`）。詳細は
  [src/server/db/client.ts](../src/server/db/client.ts)。
- `generator client` の `provider` は `prisma-client-js` ではなく `prisma-client` を使い、
  `output` （本プロジェクトでは `src/generated/prisma`）を明示する。生成物はコミットせず
  `npm install` 後の `postinstall`（`prisma generate`）で都度生成する。
- `prisma migrate diff --from-empty --to-schema=... --script` を使うと、生きたDB接続なしに
  マイグレーションSQLを生成できる（本プロジェクトの初期マイグレーションもこの方法で作成した）。

### Auth.js v5(beta) 利用時の注意（実装時の注意、Phase3で確認）

- 2026年7月時点でも next-auth の npm `latest` タグは v4系であり、v5は `beta` タグのまま
  （`5.0.0-beta.31`）。ただしApp Router専用の `auth()`/`signIn()`/`signOut()`/`handlers` を
  提供するのはv5のみのため、本プロジェクトはv5(beta)を採用している。
- `next-auth/jwt` の `JWT` 型は内部で `@auth/core/jwt` からの `export *` 再エクスポートに
  なっており、`declare module 'next-auth/jwt' { interface JWT {...} }` による型拡張が
  マージされない（`next-auth`本体への`Session`/`User`拡張は正常にマージされる）。
  そのため `token.role`/`token.tenantId` は [src/server/auth/config.ts](../src/server/auth/config.ts)
  の `session` コールバック内でキャストして扱っている。
- Credentials providerはDBセッション戦略と相性が悪いため、`session: { strategy: 'jwt' }` を
  明示している。`@auth/prisma-adapter` はOAuth向けの機能が中心のため導入せず、
  ユーザー検索・パスワード照合は自前で実装している。
- `next-auth`は`nodemailer@^7`を任意のpeer依存として持つが（未使用の組み込みEmailプロバイダ用）、
  本プロジェクトは脆弱性修正のため`nodemailer@^9`を直接使用する。この差分による`npm install`時の
  ERESOLVEエラーを避けるため、`package.json`の`overrides`で`nodemailer`のバージョンを固定している。

### Excel解析ライブラリの選定（実装時の注意、Phase4で確認）

- `xlsx`(SheetJS)のnpm公開版は`0.18.5`で止まっており、既知の脆弱性(プロトタイプ汚染等)が
  修正されたバージョンはSheetJS独自CDN配布のみでnpmに公開されていない。そのため本プロジェクトでは
  Excel読み取りに`exceljs`を採用した（[src/lib/excel-import.ts](../src/lib/excel-import.ts)）。

## 2. ディレクトリ構成（完成形の設計。各Phaseで段階的に実体を作成する）

```
immigration-support-cloud/
├── docs/                        # 設計ドキュメント（本ディレクトリ）
├── prisma/                      # [Phase2] Prisma schema・migration・seed
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── prisma.config.ts             # [Phase2] Prisma CLI設定（接続文字列はここから読む。Prisma7方式）
├── public/                      # 静的アセット
├── src/
│   ├── proxy.ts                 # [Phase3] Next.js16のルート保護(旧middleware.ts)
│   ├── app/                     # Next.js App Router（ルーティングは薄く保つ）
│   │   ├── (auth)/              # [Phase3] login, password-reset, invite の未認証ルートグループ
│   │   ├── (dashboard)/         # [Phase3〜] 認証必須の画面群
│   │   │   ├── dashboard/       # [Phase3] ダッシュボード（期限管理等はPhase4以降で拡張）
│   │   │   ├── settings/users/  # [Phase3] ユーザー・権限管理（管理者のみ）
│   │   │   ├── clients/         # [Phase4] 顧客管理（一覧/検索/新規/詳細/外国人/在留資格/Excel取込）
│   │   │   ├── reports/         # 定期届出（Phase7）
│   │   │   └── documents/       # PDF/書類管理（Phase5）
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # [Phase3] Auth.jsのRoute Handler
│   │   │   └── clients/export/route.ts       # [Phase4] 顧客CSVダウンロード
│   │   ├── layout.tsx
│   │   └── page.tsx             # 認証状態に応じて /dashboard へredirect
│   ├── components/
│   │   ├── ui/                  # [Phase3/4] button/input/label/select/textarea/alert等の共通UIプリミティブ
│   │   └── layout/              # ヘッダー・サイドバー等のアプリシェル
│   ├── features/                # 機能単位の実装（コンポーネント・hooks・Server Action・validationを同居）
│   │   ├── auth/                # [Phase3] ログイン・パスワードリセット
│   │   ├── users/                # [Phase3] ユーザー招待・権限管理
│   │   ├── clients/              # [Phase4] 法人/外国人/在留資格CRUD・検索・Excel取込
│   │   ├── csv-export/
│   │   ├── pdf-documents/
│   │   ├── periodic-reports/
│   │   ├── ai-assist/
│   │   └── dashboard/
│   ├── server/
│   │   ├── db/                  # [Phase2] Prisma Clientのシングルトン・暗号化拡張（client.ts, encryption.ts, pii-fields.ts）
│   │   ├── auth/                 # [Phase3] Auth.js設定・検証トークン・RBACガード（config.ts, index.ts, tokens.ts, guards.ts）
│   │   ├── email/                # [Phase3] メール送信（mailer.ts、SMTP未設定時はログ出力にフォールバック）
│   │   ├── repositories/        # [Phase4] tenantIdスコープを強制するデータアクセス層
│   │   │   ├── client-repository.ts
│   │   │   ├── foreign-national-repository.ts
│   │   │   └── residence-status-repository.ts
│   │   └── services/            # 複数repositoryを組み合わせるドメインロジック
│   ├── generated/prisma/        # [Phase2] `prisma generate` の出力。gitignore対象・コミットしない
│   ├── lib/                     # 汎用ユーティリティ（cn, logger, csv.ts, excel-import.ts等）
│   ├── types/                   # プロジェクト共通の型定義
│   └── config/                  # サイト定数・ナビゲーション定義・feature flag
├── docker-compose.yml            # ローカル開発用PostgreSQL
├── .env.example
├── vitest.config.ts
└── package.json
```

設計方針:

- `app/` はルーティングと画面合成のみを担当し、ロジックは `features/` と `server/` に置く
  （テスト容易性とNext.jsのバージョンアップ耐性のため）。
- `features/*` は機能ごとに完結させ（コロケーション）、機能削除・差し替えが容易な構成にする。
- `server/repositories` でPrisma呼び出しを一箇所に集約し、`services` 層でトランザクションや
  監査ログ記録などの横断的関心事を扱う。これによりDBアクセスのテスト・差し替えが容易になる。
- 各ディレクトリは、対応するPhaseで実際にコードが追加されるタイミングで作成する
  （空ディレクトリを先行して作らず、YAGNI原則に従う）。

## 3. CSV生成テンプレートの構造化方針（Phase5で詳細設計）

入管オンライン提出フォーマットは将来変更され得るため、以下の方針とする。

- 出力列定義（列名・出力順・必須/任意・文字種制約・エンコーディング）をコードではなく
  設定データ（DBまたはJSON定義）として持つ
- テンプレートのバージョニングを行い、過去分の再出力時にも当時のテンプレートを再現できるようにする
- テンプレート適用ロジックと画面表示ロジックを分離する

## 4. AI補助の構成方針（Phase6で詳細設計）

- OCR/PDF読取はサーバーサイドのService層に隔離し、UIからは「結果」のみを受け取る構成にする
- AIモデルは Anthropic Claude を既定とし、プロバイダを差し替え可能なインターフェースにする
- AIの提案（不足項目・入力候補・誤入力検知）は必ず人間が確認・確定するステップを挟み、
  AIの出力をそのままDBに保存しない

## 5. テスト方針

- ユニットテスト: Vitest + Testing Library（`src/**/*.test.ts(x)` にコロケーション）
- 型チェック: `tsc --noEmit` をCIで実行
- Lint: ESLint（`eslint-config-next` + Prettier整合）
- 将来的にPlaywrightによるE2Eテストを主要導線（ログイン、顧客登録、CSV生成）に追加予定
