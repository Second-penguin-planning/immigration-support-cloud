import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ホームディレクトリ直下の無関係な package-lock.json を誤ってワークスペースルートと
  // 誤認識しないよう、プロジェクトルートを明示する。
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
