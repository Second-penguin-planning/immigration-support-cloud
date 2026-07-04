# フェーズ計画・進捗管理

各Phase完了時に「ディレクトリ構成」「コード」「テスト方法」「次工程」を提示する運用とする。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| Phase1 | 設計（要件定義・アーキテクチャ・データモデル概要・画面設計・セキュリティ方針・開発環境構築） | ✅ 完了 |
| Phase2 | データベース設計（Prismaスキーマ確定・マイグレーション・シード投入） | 未着手 |
| Phase3 | ログイン機能（Auth.js導入・メール認証・パスワードリセット・権限管理） | 未着手 |
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

## Phase2 で着手する内容（次工程）

- `prisma` 導入、`schema.prisma` の作成（[03_data_model.md](./03_data_model.md)を具体化）
- マルチテナント・監査ログ・暗号化対象カラムの実装方針確定
- マイグレーション実行とシードデータ投入
- `src/server/db` にPrisma Clientシングルトンを実装
- リポジトリ層のユニットテスト方針策定
