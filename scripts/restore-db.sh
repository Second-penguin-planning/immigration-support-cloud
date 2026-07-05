#!/usr/bin/env bash
# バックアップファイル(pg_dumpのカスタム形式)からPostgreSQLへ復元する。
# 対象データベースの既存データは--clean --if-existsにより上書きされるため、
# 実行前に確認プロンプトを表示する(第2引数に--yesを渡すと確認を省略できる)。
set -euo pipefail

FILE="${1:-}"
SKIP_CONFIRM="${2:-}"

if [ -z "${FILE}" ]; then
  echo "使い方: npm run db:restore -- backups/backup_YYYYMMDD_HHMMSS.dump [--yes]" >&2
  exit 1
fi
if [ ! -f "${FILE}" ]; then
  echo "指定したバックアップファイルが見つかりません: ${FILE}" >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ "${SKIP_CONFIRM}" != "--yes" ]; then
  echo "警告: この操作は対象データベースの既存データを上書きします。"
  read -r -p "本当に復元しますか？ (yes/NO): " CONFIRM
  if [ "${CONFIRM}" != "yes" ]; then
    echo "中止しました。"
    exit 1
  fi
fi

if timeout 5 docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^isc-postgres$'; then
  echo "ローカルのisc-postgresコンテナへ復元します: ${FILE}"
  docker exec -i isc-postgres pg_restore -U postgres -d immigration_support_dev --clean --if-exists < "${FILE}"
else
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URLが設定されていません(.envを確認してください)。" >&2
    exit 1
  fi
  echo "DATABASE_URL接続先へ復元します: ${FILE}"
  pg_restore -d "${DATABASE_URL}" --clean --if-exists "${FILE}"
fi

echo "復元完了。"
