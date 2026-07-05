import { PeriodicReportStatus } from '@/generated/prisma/enums';

export const PERIODIC_REPORT_STATUS_LABEL: Record<PeriodicReportStatus, string> = {
  [PeriodicReportStatus.DRAFT]: '下書き',
  [PeriodicReportStatus.SUBMITTED]: '提出済み',
};

/** 特定技能所属機関が実施する標準的な支援10項目のマスタ。 */
export const SUPPORT_TYPES = [
  { key: 'pre_guidance', label: '事前ガイダンス' },
  { key: 'arrival_departure_support', label: '出入国の際の送迎' },
  { key: 'housing_contract_support', label: '住居確保・生活に必要な契約支援' },
  { key: 'life_orientation', label: '生活オリエンテーション' },
  { key: 'public_procedure_accompaniment', label: '公的手続等への同行' },
  { key: 'japanese_language_support', label: '日本語学習の機会の提供' },
  { key: 'consultation_and_complaints', label: '相談・苦情への対応' },
  { key: 'exchange_promotion', label: '日本人との交流促進' },
  { key: 'transfer_support', label: '転職支援（人員整理等の場合）' },
  { key: 'periodic_interview', label: '定期的な面談・行政機関への通報' },
] as const;

export type SupportTypeKey = (typeof SUPPORT_TYPES)[number]['key'];

export function getSupportTypeLabel(key: string): string {
  return SUPPORT_TYPES.find((type) => type.key === key)?.label ?? key;
}
