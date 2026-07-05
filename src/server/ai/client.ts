import Anthropic from '@anthropic-ai/sdk';

/** AI補助機能で使用する既定モデル。 */
export const AI_MODEL = 'claude-sonnet-5';

const PLACEHOLDER_KEY = 'replace-with-anthropic-api-key';

/** ANTHROPIC_API_KEYが実際に設定されている(プレースホルダのままでない)かどうか。 */
export function isAiConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key) && key !== PLACEHOLDER_KEY;
}

/**
 * Anthropicクライアントを生成する。APIキー未設定時は分かりやすいメッセージで例外を投げる
 * （メール送信のようなログ出力フォールバックは、OCR結果はユーザーが能動的に要求する操作のため採用せず、
 * 明示的にエラーとして伝える）。
 */
export function createAnthropicClient(): Anthropic {
  if (!isAiConfigured()) {
    throw new Error(
      'AI補助機能を使うには ANTHROPIC_API_KEY を設定してください（.env.local、管理者による設定が必要です）。',
    );
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
