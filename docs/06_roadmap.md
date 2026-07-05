# フェーズ計画・進捗管理

各Phase完了時に「ディレクトリ構成」「コード」「テスト方法」「次工程」を提示する運用とする。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| Phase1 | 設計（要件定義・アーキテクチャ・データモデル概要・画面設計・セキュリティ方針・開発環境構築） | ✅ 完了 |
| Phase2 | データベース設計（Prismaスキーマ確定・マイグレーション・シード投入） | ✅ 完了（実DB結合確認済み） |
| Phase3 | ログイン機能（Auth.js導入・メール認証・パスワードリセット・権限管理） | ✅ 完了（実DB・ブラウザ動作確認済み） |
| Phase4 | 顧客管理（法人/外国人/在留資格CRUD・検索・CSVダウンロード・Excel取込） | ✅ 完了（実DB・ブラウザ動作確認済み） |
| Phase5 | CSV生成・PDF管理（テンプレート機構・書類アップロード・不足書類表示） | ✅ 完了（実DB・ブラウザ動作確認済み） |
| Phase6 | AI補助（OCR・PDF読取・不足項目抽出・誤入力検知・入力候補） | ✅ 完了（コード・単体テスト済み。ブラウザ動作確認は環境要因により未実施、下記参照） |
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

## Phase4 完了内容

- `server/repositories`層を導入し、`tenantId`（ForeignNational/ResidenceStatusは`client.tenantId`経由）を
  全関数で強制（[client-repository.ts](../src/server/repositories/client-repository.ts),
  [foreign-national-repository.ts](../src/server/repositories/foreign-national-repository.ts),
  [residence-status-repository.ts](../src/server/repositories/residence-status-repository.ts)）
- 法人情報（Client）・外国人情報（ForeignNational）・在留資格（ResidenceStatus）のCRUD画面
  （`/clients`, `/clients/new`, `/clients/[clientId]`,
  `/clients/[clientId]/foreign-nationals/new`, `/clients/[clientId]/foreign-nationals/[id]`）
- 検索（法人名・外国人氏名・在留カード番号・担当者・在留期限範囲の複合条件、`/clients`）。
  在留カード番号は暗号化のため完全一致（検索用ハッシュ照合）のみ対応
- CSVダウンロード（`/api/clients/export`、UTF-8 BOM付き、`src/lib/csv.ts`）。viewerロールは403で拒否
- Excel一括取込（`/clients/import`）: `exceljs`でシート解析→zodバリデーション→プレビュー表示→
  確認後にDB保存の2段階フロー（法人名が未登録の場合は自動作成）
  - `xlsx`(SheetJS)のnpm公開版は既知の脆弱性を含む古いバージョンで止まっているため`exceljs`を採用
- ロールベースアクセス制御を一覧・詳細・Server Action全てで一貫させる
  （viewerは作成・更新・削除・ダウンロード・取込が一切できない、docs/01_requirements.md 1.1）

### ブラウザ・実DBでの動作確認（実施済み）

- 顧客の新規作成→詳細ページへ遷移→外国人情報追加→在留資格追加、の一連の登録フローが実DBで成功
- 在留カード番号を小文字・別表記で検索しても、ハッシュの正規化により完全一致で検索できることを確認
- CSVダウンロードが暗号化前の平文情報を含む正しい内容で出力されることを確認
- Excel取込の解析・バリデーション・DB書き込みロジックを実DBに対して直接検証
  （ブラウザのファイル入力はテスト自動化ツールの制約上直接操作できないが、取込の中核ロジックは検証済み）
- viewerロールでは「CSVダウンロード」「Excel一括取込」「新規登録」ボタンが表示されないこと、
  詳細画面が読み取り専用であること、`/clients/new`への直接アクセスが`/clients`へリダイレクトされること、
  CSV APIへの直接アクセスが403になることを確認
  - 検証中に、viewerロールでも「新規登録」ボタンが誤表示されるUIバグを発見し修正
    （Server Action側の権限チェックにより実際の作成は元々ブロックされていたが、UI上の表示崩れがあった）

### 既知の未実装事項

- 監査ログ（`AuditLog`モデルは存在するが、作成・更新・削除・ダウンロード操作の記録はまだ配線していない。
  ログイン・招待等の認証イベントも含めて横断的な対応が必要なため、専用タスクとして別途実施する）
- ダッシュボードの期限管理（30日/14日/7日/当日の分類・通知表示）はプレースホルダのまま
  （Phase4のスコープでは着手せず、後続Phaseで実装予定）

## Phase5 完了内容

- ファイルストレージ抽象化（[src/server/storage/local-storage.ts](../src/server/storage/local-storage.ts)）。
  IDはpathセグメントとして厳格に検証し、表示用ファイル名はパス区切り文字を除去してパストラバーサルを防止
- 添付書類（Document）機能: 書類種別マスタ（必須4種+その他）、PDF/JPEG/PNG・10MB上限のアップロード検証、
  `{氏名}_{書類種別}_{年月日}.拡張子` 形式の自動リネーム、不足必須書類の一覧表示、
  `/api/documents/[documentId]` でのダウンロード（viewerは403）
  - 外国人詳細画面（`/clients/[clientId]/foreign-nationals/[id]`）に統合（画面設計上は
    `/clients/[clientId]/documents` も候補だったが、書類は外国人に紐づくため詳細画面内に統合した）
- CSVテンプレート機構: `CsvExportTemplate`のバージョニング管理画面（`/settings/csv-templates`、管理者限定）。
  保存の都度新バージョンを作成し旧バージョンを無効化(過去分の再現性を確保)
- 入管提出用CSV生成（`/clients/csv-generate` + `/api/clients/csv-generate`）:
  アクティブなテンプレートの必須列に対して外国人ごとに事前検証し、不備があれば生成をブロックして
  不足項目を表示。Shift_JIS/UTF-8のエンコーディングを選択可能（`iconv-lite`使用）
  - `src/lib/csv-template.ts`: テンプレート列定義に基づく行構築・必須項目バリデーション（純粋関数、単体テスト付き）
- CSVダウンロード・書類ダウンロードともviewerロールは403（docs/01_requirements.md 1.1）

### ブラウザ・実DBでの動作確認（実施済み）

- 書類アップロードのロジック（ファイル名自動生成・保存・DB登録）を実DB・実ファイルシステムに対してスクリプトで検証
  （ブラウザのファイル入力は自動化ツールの制約で直接操作できないため、Excel取込と同じ方針で検証）
- アップロード後、不足必須書類のアラートが再計算されて表示件数が減ること、一覧・ダウンロード・削除が
  ブラウザから正しく動作することを確認
- CSVテンプレートの新規バージョン作成→旧バージョンが自動的に無効化されることを確認（v1 UTF-8→v2 Shift_JIS）
- CSV生成画面で対象外国人の必須項目（在留カード番号）を意図的に空にし、「不足: 在留カード番号」の表示と
  ダウンロードリンクの非表示（生成ブロック）を確認。API直接アクセスでも400で拒否されることを確認
- 生成成功時のダウンロードファイルがShift_JIS（CP932）のバイト列で正しくエンコードされていることを確認
- viewerロールで `/clients/csv-generate` への直接アクセスが`/clients`へリダイレクトされること、
  `/settings/csv-templates`への直接アクセスが`/dashboard`へリダイレクトされること、
  CSV生成APIおよび書類ダウンロードAPIが403を返すことを確認

### 既知の未実装事項・制約

- 監査ログの配線は未着手（Phase4から継続の既知事項）
- CSVテンプレートの列の並び替え・出力ラベルのカスタマイズ機能は無く、標準フィールドの固定順・固定ラベルのみ
  （admin向けにチェックボックスで項目選択のみ提供。将来ドラッグ&ドロップ等での並び替えは拡張余地）
- 本番運用時のファイルストレージはS3等への切り替えを想定しているが、Phase5ではローカルディスク実装のみ
  （`FILE_STORAGE_DRIVER=s3`は`.env.example`に項目のみ用意、実装は本番公開準備(Phase8)までに対応）
- ローカルファイルストレージの動的パス解決について、Next.jsのビルド時ファイルトレーサーから
  advisory警告が出るが、ビルド自体は成功する（[02_architecture.md](./02_architecture.md)に記録）

## Phase6 完了内容

- Anthropicクライアント（[src/server/ai/client.ts](../src/server/ai/client.ts)）: `ANTHROPIC_API_KEY`未設定
  （プレースホルダのまま）の場合は`isAiConfigured()`がfalseを返し、AI機能呼び出し時に日本語の
  設定案内エラーを投げる（本番運用時はキー設定が必須）
- 書類画像/PDFからの項目抽出（[src/server/ai/extract-document.ts](../src/server/ai/extract-document.ts)）:
  Claude（`claude-sonnet-5`）に書類のbase64を渡し、氏名・フリガナ・国籍・生年月日・旅券番号・
  在留カード番号・在留資格・在留期限をJSONで抽出させ、zodスキーマ
  （[src/features/ai-assist/schema.ts](../src/features/ai-assist/schema.ts)）で検証してから返す
  （AIの出力はそのまま信用せず必ず構造検証する方針、[05_security.md](./05_security.md)参照）
- 抽出結果の取込Server Action（[src/features/ai-assist/actions.ts](../src/features/ai-assist/actions.ts)）:
  抽出結果は即DB保存せず、ユーザーがチェックボックスで取り込む項目を選択・確認したうえで
  外国人情報（および在留資格が両方揃っていれば新規在留資格）に反映する2段階フロー
- 外国人詳細画面にAI補助セクションを統合（`canEdit`ロールのみ表示、viewerには非表示）
- ルールベースの誤入力検知（[src/lib/anomaly-detection.ts](../src/lib/anomaly-detection.ts)）:
  生年月日が未来、在留資格の許可年月日が在留期限より後/生年月日より前、在留期限切れ、
  旅券番号・在留カード番号の桁数不足を検出。AIを使わない決定的なルールのため、
  全ロール（viewer含む）に「入力内容のチェック」として常時表示

### テスト・動作確認

- 単体テスト: `extractedFieldsSchema`のバリデーション、`detectAnomalies`の全分岐
  （生年月日未来・順序矛盾・期限切れ・桁数不足・null項目のスキップ等）を追加し、
  プロジェクト全体で70件のテストが全て成功（`npm run test`）
- `npm run typecheck` / `npm run lint` / `npm run build` は全て成功
- ブラウザ・実DBでの動作確認は**未実施**（下記「既知の制約」参照）。設計上の妥当性は
  単体テストとコードレビューで担保しているが、実際のログイン→画面遷移→AI補助UIの
  表示確認は次回Docker環境が復旧した際に実施する

### 既知の制約

- **ローカルDocker Desktop環境の不具合によりブラウザ動作確認が未実施**:
  このマシンのDocker Desktopで、起動時に内部サービス（Inference manager / Secrets Engine）が
  自身のUnixソケットブリッジ用シンボリックリンク（例:
  `C:\Users\<user>\AppData\Local\Docker\run\dockerInference`）を削除できず
  （`The file cannot be accessed by the system`）起動に失敗する現象が再現する。
  プロセスの再起動・WSL再起動・該当フォルダの退避（一時的にのみ有効）・
  設定ファイル（`EnableDockerAI`）の変更・PC再起動・Docker Desktop自体の
  「Reset to factory defaults」を試みたが解消せず、同一エラーが再発するため
  このマシン固有のDocker Desktop不具合と判断し、これ以上の対症療法は行わないこととした。
  Phase4/5で確立した「実DBに対する直接スクリプト検証」の方針をPhase6でも継続する予定だったが、
  今回はDBコンテナ自体が起動できないため単体テストのみで代替した
- 実際のAnthropic APIキーが未設定のため、AI抽出機能の実際の呼び出し（Claudeへのリクエスト・
  レスポンス）は本セッションでは検証できていない。`isAiConfigured()`によるフォールバック
  （未設定時のエラーメッセージ表示）のロジックは単体テスト・コードレビューで確認済み
- 抽出結果の自動反映は「氏名・フリガナ・国籍・生年月日・旅券番号・在留カード番号」と
  「在留資格・在留期限」の2グループに分かれており、在留資格側は両方揃った場合のみ
  新規`ResidenceStatus`レコードを作成する（片方のみの取込では在留資格は更新されない）

## Phase7 で着手する内容（次工程）

- 定期届出: 前回データのコピー・差分入力、面談記録、支援実施状況の管理
- Docker環境が復旧した場合は、Phase6のブラウザ動作確認（管理者ログイン→外国人詳細で
  AI補助セクション表示・APIキー未設定エラー表示・誤入力検知表示→viewerロールでAI補助非表示）
  を先行して実施し、本ドキュメントの「既知の制約」を更新する
