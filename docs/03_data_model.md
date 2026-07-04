# 概念データモデル（ER図）

> 本ドキュメントは概念設計であり、Prismaスキーマとしての詳細な型・制約・インデックス設計は
> Phase2（データベース設計）で確定する。

## 1. マルチテナント方針

本サービスは行政書士事務所・登録支援機関ごとにデータを分離するマルチテナントSaaSとする。

- **Tenant**: サービス契約単位（1つの行政書士事務所/登録支援機関/受入企業）
- **User**: Tenantに所属するログインユーザー（管理者・スタッフ・閲覧のみ）
- **Client**: そのTenantが管理する「顧客」（受入企業の法人情報）
  ※ Tenant自身が受入企業として利用するケースでは、Tenant = Client 相当のデータを1件持つ運用とする

同一Tenant内のデータのみを参照・操作できるよう、DBアクセス層（`server/repositories`）で
必ず `tenantId` によるスコープ制御を行う（Phase2で詳細設計）。

## 2. 主要エンティティ

| エンティティ | 概要 |
| --- | --- |
| Tenant | サービス契約単位（行政書士事務所等） |
| User | ログインユーザー。ロール（admin/staff/viewer）を持つ |
| Client | 受入企業の法人情報 |
| ForeignNational | 外国人情報（氏名・国籍・旅券番号・在留カード番号等） |
| ResidenceStatus | 在留資格の履歴（資格種類・許可年月日・在留期限） |
| Document | 添付書類（PDF/画像。ファイル名・書類種別・アップロード日時） |
| PeriodicReport | 特定技能定期届出のドラフト・提出履歴 |
| Interview | 定期届出に紐づく面談記録 |
| SupportRecord | 支援実施状況（生活オリエンテーション等の実施記録） |
| CsvExportTemplate | 入管オンライン提出用CSVの列定義（バージョン管理） |
| AuditLog | 個人情報の作成・更新・削除・閲覧・ダウンロードの記録 |
| Notification | 期限通知等のアプリ内通知 |

## 3. ER図

```mermaid
erDiagram
    TENANT ||--o{ USER : "所属"
    TENANT ||--o{ CLIENT : "管理する"
    CLIENT ||--o{ FOREIGN_NATIONAL : "雇用する"
    FOREIGN_NATIONAL ||--o{ RESIDENCE_STATUS : "在留資格履歴"
    FOREIGN_NATIONAL ||--o{ DOCUMENT : "添付書類"
    FOREIGN_NATIONAL ||--o{ PERIODIC_REPORT : "定期届出"
    PERIODIC_REPORT ||--o{ INTERVIEW : "面談記録"
    PERIODIC_REPORT ||--o{ SUPPORT_RECORD : "支援実施状況"
    USER ||--o{ CLIENT : "担当する"
    TENANT ||--o{ CSV_EXPORT_TEMPLATE : "保有する"
    TENANT ||--o{ AUDIT_LOG : "記録する"
    USER ||--o{ AUDIT_LOG : "実行者"
    USER ||--o{ NOTIFICATION : "受信する"

    TENANT {
        uuid id PK
        string name
        string plan
        datetime createdAt
    }
    USER {
        uuid id PK
        uuid tenantId FK
        string email
        string name
        enum role "admin/staff/viewer"
        boolean emailVerified
        datetime createdAt
    }
    CLIENT {
        uuid id PK
        uuid tenantId FK
        string companyName
        string address
        string contactName
        string contactEmail
        uuid assignedUserId FK
    }
    FOREIGN_NATIONAL {
        uuid id PK
        uuid clientId FK
        string fullName
        string nationality
        date birthDate
        string passportNumber
        string residenceCardNumber
    }
    RESIDENCE_STATUS {
        uuid id PK
        uuid foreignNationalId FK
        string statusType
        date grantedAt
        date expiresAt
    }
    DOCUMENT {
        uuid id PK
        uuid foreignNationalId FK
        string documentType
        string fileName
        string storagePath
        datetime uploadedAt
    }
    PERIODIC_REPORT {
        uuid id PK
        uuid foreignNationalId FK
        string reportPeriod
        enum status "draft/submitted"
        uuid basedOnReportId FK "前回データのコピー元"
    }
    INTERVIEW {
        uuid id PK
        uuid periodicReportId FK
        date conductedAt
        string conductedBy
        text notes
    }
    SUPPORT_RECORD {
        uuid id PK
        uuid periodicReportId FK
        string supportType
        boolean implemented
        date implementedAt
    }
    CSV_EXPORT_TEMPLATE {
        uuid id PK
        uuid tenantId FK
        string name
        int version
        json columnDefinition
    }
    AUDIT_LOG {
        uuid id PK
        uuid tenantId FK
        uuid userId FK
        string action
        string targetType
        uuid targetId
        datetime createdAt
    }
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string type
        string message
        boolean read
        datetime createdAt
    }
```

## 4. 期限管理の考え方

`ResidenceStatus.expiresAt` および `PeriodicReport` の提出期限を基準に、
ダッシュボードで「30日前/14日前/7日前/当日」の4区分に分類する（Phase4で実装）。
判定はバッチ処理ではなく、クエリ側で `expiresAt - now()` の日数から動的に算出する方針とし、
通知（Notification）生成のみ日次バッチで行う想定とする（Phase2以降で確定）。
