# フェーズ計画・進捗管理

各Phase完了時に「ディレクトリ構成」「コード」「テスト方法」「次工程」を提示する運用とする。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| Phase1 | 設計（要件定義・アーキテクチャ・データモデル概要・画面設計・セキュリティ方針・開発環境構築） | ✅ 完了 |
| Phase2 | データベース設計（Prismaスキーマ確定・マイグレーション・シード投入） | ✅ 完了（実DB結合確認済み） |
| Phase3 | ログイン機能（Auth.js導入・メール認証・パスワードリセット・権限管理） | ✅ 完了（実DB・ブラウザ動作確認済み） |
| Phase4 | 顧客管理（法人/外国人/在留資格CRUD・検索・CSVダウンロード・Excel取込） | 未着手 |
| Phase5 | CSV生成・PDF管理（テンプレート機構・書類アップロード・不足書類表示） | 未着手 |
| Phase6 | AI補助（OCR・PDF読取・不足項目抽出・誤入力検知・入力候補） | 未着手 |
| Phase7 | 定期届出（前回データコピー・差分入力・面談記録・支援実施状況） | 未着手 |
| Phase8 | 本番公開（Vercelデプロイ・バックアップ運用・復元テスト） | 未着手 |

## Phase1 完了内容

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 のプロジェクト初期化
- ESLint / Prettier / Vitest（+Testing Library）の導入と動作確認
- ダークモード対応のCSS変数基盤（`.dark`クラス戦略）
- ローカル開発用PostgreSQLの `docker-compose.yml`
- `.env.example` によるアプリ設定項目の明文化
- 設計ドキュメント一式（本ディレクトリ `docs/`）

## Phase2 完了内容

- Prisma 7 導入、`prisma/schema.prisma` 確定（[03_data_model.md](./03_data_model.md)の12モデルを実装）
  - Tenant / User / VerificationToken / Client / ForeignNational / ResidenceStatus /
    Document / PeriodicReport / Interview / SupportRecord / CsvExportTemplate / AuditLog / Notification
- マルチテナント（`tenantId`によるスコープ）、監査ログ（追記専用の想定）、
  旅券番号・在留カード番号の暗号化対象カラム＋検索用ハッシュ列を実装
- `src/server/db/encryption.ts`（AES-256-GCM暗号化、HKDFによる鍵分離、HMAC-SHA256の検索用ハッシュ）と
  `src/server/db/pii-fields.ts`（Prisma書き込み/読み取りペイロードの暗号化・復号変換、ユニットテスト付き）
- `src/server/db/client.ts`: Prisma Client Extensionで`foreignNational`モデルへの暗号化・復号を透過化
- `prisma/seed.ts`: テナント・3ロールのユーザー・顧客・外国人・在留資格・CSVテンプレートのサンプルデータ
- 初期マイグレーション（`prisma/migrations/20260705000000_init`）を
  `prisma migrate diff --from-empty --to-schema=... --script` でオフライン生成・レビュー済み

### DB結合確認（実施済み）

Docker Desktop導入後、以下を実行して実DBでの動作を確認した。

```bash
npm run db:up        # PostgreSQLコンテナ起動 → healthy確認
npm run db:deploy     # 初期マイグレーション適用 成功
npm run db:seed        # サンプルデータ投入 成功
```

- DB生データ（`docker exec isc-postgres psql ...`）で `passport_number` 列が暗号文（平文と異なる文字列）で
  保存されていることを確認
- Prisma Client（`src/server/db/client.ts`）経由での読み取りでは `passportNumber` が元の平文
  （`N1234567`）に復号されて返ることを確認（暗号化・復号の往復が実DBで正しく機能）

## Phase3 完了内容

- Auth.js v5(beta.31) 導入。Credentials provider + JWTセッション戦略
  （[src/server/auth/config.ts](../src/server/auth/config.ts), [index.ts](../src/server/auth/index.ts)）
- メール認証必須のログイン（`emailVerified`/`isActive`を`authorize()`で検証）
- `src/proxy.ts`: Next.js16の新規約でルート保護（未認証を`/login`へリダイレクト）
- `src/server/auth/guards.ts`: `requireSession`/`requireRole`によるServer Action側の多層防御
- `src/server/auth/tokens.ts`: メール認証・パスワードリセット用トークン発行/検証（ハッシュ化保存、有効期限、使い捨て）
- `src/server/email/mailer.ts`: メール送信（SMTP未設定時はログ出力にフォールバックする開発用動線）
- 画面: `/login`, `/password-reset`, `/password-reset/[token]`, `/invite/[token]`,
  `/dashboard`, `/settings/users`（管理者によるユーザー招待・権限変更・有効/無効切替）
- 最小限のUIプリミティブ（`src/components/ui/`: button, input, label, alert, field-error）
- Next.js16(`proxy.ts`)・Prisma7に続き、Auth.js v5(beta)固有の型拡張の癖を確認し
  [02_architecture.md](./02_architecture.md)に記録

### ブラウザでの動作確認（実施済み）

Docker上の実DBに対し、開発サーバーで以下を確認した。

- 未ログインで`/dashboard`に直接アクセス→`/login?callbackUrl=...`へリダイレクト（proxy.ts）
- 管理者(`admin@example.com`)でログイン→ダッシュボード表示、「ユーザー管理」リンク表示
- 誤ったパスワードでのログイン→汎用エラーメッセージ表示
- 管理者による新規ユーザー招待→メール送信ログに招待リンク出力→リンクからパスワード設定→
  `emailVerified`が設定されアカウント有効化→新規ユーザーでログイン成功
- STAFFロールでは「ユーザー管理」リンク非表示、`/settings/users`への直接アクセスも
  `/dashboard`へリダイレクト（ページレベルRBAC）
- パスワードリセット申請→メール送信ログにリセットリンク出力→リンクから新パスワード設定→
  新パスワードでログイン成功
- ログアウト→`/login`へリダイレクト

### 既知の未実装事項

- ログイン試行のレート制限（[05_security.md](./05_security.md)参照。Redis等導入後に対応）
- 二段階認証（TOTP）

## Phase4 で着手する内容（次工程）

- 顧客管理: 法人情報（Client）・外国人情報（ForeignNational）・在留資格（ResidenceStatus）のCRUD画面
- 検索（法人名・氏名・在留カード番号・期限範囲・担当者の複合条件）とCSVダウンロード
- Excelアップロードによる一括取込（自動解析・エラー表示）
- `server/repositories`層の導入（`tenantId`スコープを一元的に強制する設計、[05_security.md](./05_security.md)参照）
