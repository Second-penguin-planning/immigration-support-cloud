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

## 2. ディレクトリ構成（完成形の設計。各Phaseで段階的に実体を作成する）

```
immigration-support-cloud/
├── docs/                        # 設計ドキュメント（本ディレクトリ）
├── prisma/                      # Prisma schema・migration（Phase2で作成）
│   ├── schema.prisma
│   └── migrations/
├── public/                      # 静的アセット
├── src/
│   ├── app/                     # Next.js App Router（ルーティングは薄く保つ）
│   │   ├── (auth)/              # login, password-reset 等の未認証ルートグループ（Phase3）
│   │   ├── (dashboard)/         # 認証必須の画面群（Phase4〜）
│   │   │   ├── clients/         # 顧客管理
│   │   │   ├── reports/         # 定期届出
│   │   │   ├── documents/       # PDF/書類管理
│   │   │   └── settings/        # ユーザー・権限設定
│   │   ├── api/                 # Route Handlers（CSV生成・Webhook等）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                  # ボタン・入力欄等の共通UIプリミティブ
│   │   └── layout/              # ヘッダー・サイドバー等のアプリシェル
│   ├── features/                # 機能単位の実装（コンポーネント・hooks・Server Action・validationを同居）
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── csv-export/
│   │   ├── pdf-documents/
│   │   ├── periodic-reports/
│   │   ├── ai-assist/
│   │   └── dashboard/
│   ├── server/
│   │   ├── db/                  # Prisma Clientのシングルトン
│   │   ├── auth/                # Auth.js設定
│   │   ├── repositories/        # Prismaを直接叩くデータアクセス層
│   │   └── services/            # 複数repositoryを組み合わせるドメインロジック
│   ├── lib/                     # 汎用ユーティリティ（cn, logger, date, csv, file-naming等）
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
