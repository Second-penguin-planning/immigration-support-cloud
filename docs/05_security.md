# セキュリティ設計方針

対象データには氏名・国籍・旅券番号・在留カード番号等の要配慮個人情報に近い情報が含まれるため、
以下の方針を全Phase共通のベースラインとする。

## 1. 個人情報の暗号化

- 通信経路: TLS必須（Vercel/HTTPS）。ローカル開発でもDBは信頼できるネットワーク内のみで公開する
- 保存時: 旅券番号・在留カード番号はアプリケーション層でAES-256-GCM暗号化して保存する。
  Prisma Client Extension（`src/server/db/client.ts`）で `foreignNational` モデルへの
  書き込み・読み取りに対して暗号化・復号を透過的に適用し、アプリケーションコード（features/server層）は
  常に平文として扱える（実装: [src/server/db/encryption.ts](../src/server/db/encryption.ts),
  [src/server/db/pii-fields.ts](../src/server/db/pii-fields.ts)）
- 暗号化は非決定的（IVがランダム）なため暗号文のまま検索・重複チェックができない。
  そのため完全一致検索用に別カラム（`passportNumberHash`等）へHMAC-SHA256の一方向ハッシュを保持する
  （ブラインドインデックス方式）
- 暗号化用の鍵とハッシュ用の鍵は同一のマスターキーからHKDFで用途別に導出し、鍵を使い回さない
- 暗号鍵（`ENCRYPTION_MASTER_KEY`）はコード・リポジトリに含めず、環境変数（Vercelの場合は
  Environment Variables）で管理する。鍵を紛失すると既存の暗号化データは復号不能になるため、
  鍵のバックアップ・ローテーション手順を本番運用開始（Phase8）までに整備する

## 2. 認証・認可

- メール認証必須（未認証ユーザーはログイン不可）
- パスワードはハッシュ化（bcrypt/argon2、Auth.js標準に準拠）して保存し、平文を扱わない
- 二段階認証（TOTP）に対応できる設計とする
- ロールベースアクセス制御（admin/staff/viewer）をUIだけでなくServer Action/Route Handler側でも必ず検証する
  （Next.js 16のProxy＝旧Middlewareのみに依存しない。詳細は[02_architecture.md](./02_architecture.md)参照）
- テナント（行政書士事務所単位）をまたいだデータアクセスをアプリケーション層で必ず遮断する

## 3. Web脆弱性対策

| 脅威 | 対策 |
| --- | --- |
| SQLインジェクション | Prismaのパラメータ化クエリを利用し、生SQL文字列結合を禁止する |
| XSS | Reactの自動エスケープを前提とし、`dangerouslySetInnerHTML`は原則使用しない |
| CSRF | Auth.jsのCSRFトークン機構、およびServer ActionのOrigin検証を利用する |
| ファイルアップロード | 許可する拡張子・MIMEタイプ・サイズ上限を検証し、保存先パスにユーザー入力を直接使わない |
| 総当たり攻撃 | ログイン試行・パスワードリセットにレート制限を設ける |

## 4. 監査ログ

- 個人情報の「作成・更新・削除・閲覧・ダウンロード」操作を `AuditLog` に記録する
  （実行者・日時・対象種別・対象ID・操作種別）
- 監査ログ自体は改ざん防止のため、アプリケーションからの更新・削除操作を許可しない（追記のみ）
- 管理者ロールのみ監査ログを閲覧できる

## 5. バックアップ

- PostgreSQLの日次バックアップを取得し、一定期間保持する
- リストア手順をドキュメント化し、定期的に復元テストを行う（本番公開前のPhase8で整備）

## 6. 運用上の注意

- 本番環境の環境変数・シークレットはVercelのEnvironment Variables等で管理し、`.env`をコミットしない
- 依存パッケージの脆弱性は `npm audit` 等で定期確認する
