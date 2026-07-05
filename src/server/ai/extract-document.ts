import type { Base64ImageSource } from '@anthropic-ai/sdk/resources/messages';
import { extractedFieldsSchema, type ExtractedFields } from '@/features/ai-assist/schema';
import { AI_MODEL, createAnthropicClient } from './client';

const EXTRACTION_PROMPT = `あなたは日本の行政書士業務を支援するアシスタントです。
添付された画像・PDFは、外国人の在留カード・パスポート・雇用契約書等の書類です。
書類から読み取れる情報を、以下のJSON形式で1つだけ出力してください。

- 読み取れない項目は null にしてください（推測で埋めないでください）
- 日付は必ず YYYY-MM-DD 形式にしてください（和暦は西暦に変換してください）
- JSON以外の説明文は一切出力しないでください

{
  "fullName": "氏名（漢字またはローマ字表記のまま）",
  "fullNameKana": "フリガナ（分かる場合のみ）",
  "nationality": "国籍",
  "birthDate": "生年月日(YYYY-MM-DD)",
  "passportNumber": "旅券番号",
  "residenceCardNumber": "在留カード番号",
  "statusType": "在留資格の種類",
  "expiresAt": "在留期限(YYYY-MM-DD)"
}`;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function buildDocumentContentBlock(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString('base64');

  if (mimeType === 'application/pdf') {
    return {
      type: 'document' as const,
      source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
    };
  }

  if (SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mimeType as Base64ImageSource['media_type'],
        data: base64,
      },
    };
  }

  throw new Error(`AI補助が対応していないファイル形式です: ${mimeType}`);
}

function extractJsonObject(text: string): unknown {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) {
    throw new Error('AIの応答からJSONを取り出せませんでした。');
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error('AIの応答が不正なJSON形式でした。');
  }
}

/**
 * アップロード済み書類(画像/PDF)からAIで情報を抽出する。
 * 抽出結果は必ず {@link extractedFieldsSchema} で検証してから返す(AIの出力を無条件に信用しない)。
 */
export async function extractDocumentFields(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedFields> {
  const client = createAnthropicClient();
  const documentBlock = buildDocumentContentBlock(buffer, mimeType);

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [documentBlock, { type: 'text', text: EXTRACTION_PROMPT }],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AIから有効なテキスト応答が得られませんでした。');
  }

  const parsedJson = extractJsonObject(textBlock.text);
  const result = extractedFieldsSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error('AIの応答が期待した形式と一致しませんでした。');
  }

  return result.data;
}
