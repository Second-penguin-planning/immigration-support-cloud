#!/usr/bin/env bash
# PostgreSQLの論理バックアップを取得する(pg_dumpのカスタム形式、pg_restoreで復元可能)。
# ローカル開発(docker-compose)ではコンテナ内のpg_dumpを使い、クライアントのバージョン差異を避ける。
# 本番等、対象がリモートの管理DBの場合はホストのpg_dump(DATABASE_URL接続)を使う。
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT="backups/backup_${TIMESTAMP}.dump"

if timeout 5 docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^isc-postgres$'; then
  echo "ローカルのisc-postgresコンテナからバックアップを取得します: ${OUT}"
  docker exec isc-postgres pg_dump -U postgres -F c immigration_support_dev > "${OUT}"
else
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URLが設定されていません(.envを確認してください)。" >&2
    exit 1
  fi
  echo "DATABASE_URL接続先からバックアップを取得します: ${OUT}"
  pg_dump "${DATABASE_URL}" -F c -f "${OUT}"
fi

echo "バックアップ完了: ${OUT}"
