export interface Anomaly {
  level: 'error' | 'warning';
  message: string;
}

export interface AnomalyResidenceStatus {
  statusType: string;
  grantedAt: Date | null;
  expiresAt: Date;
}

export interface AnomalyDetectionInput {
  birthDate: Date | null;
  passportNumber: string | null;
  residenceCardNumber: string | null;
  residenceStatuses: AnomalyResidenceStatus[];
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * 日付の前後関係・桁数等をルールベースで検証し、誤入力の可能性がある箇所を検出する。
 * DBに保存された値の妥当性チェックであり、AIは使わない(誰でも同じ結果になる決定的なルール)。
 */
export function detectAnomalies(input: AnomalyDetectionInput, now: Date = new Date()): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (input.birthDate && input.birthDate > now) {
    anomalies.push({ level: 'error', message: '生年月日が未来の日付になっています。' });
  }

  for (const status of input.residenceStatuses) {
    if (status.grantedAt && status.grantedAt > status.expiresAt) {
      anomalies.push({
        level: 'error',
        message: `「${status.statusType}」の許可年月日が在留期限より後になっています。`,
      });
    }
    if (input.birthDate && status.grantedAt && status.grantedAt < input.birthDate) {
      anomalies.push({
        level: 'error',
        message: `「${status.statusType}」の許可年月日が生年月日より前になっています。`,
      });
    }
    if (status.expiresAt < now) {
      anomalies.push({
        level: 'warning',
        message: `「${status.statusType}」の在留期限が既に過ぎています（${formatDate(status.expiresAt)}）。`,
      });
    }
  }

  if (input.passportNumber && input.passportNumber.trim().length < 6) {
    anomalies.push({ level: 'warning', message: '旅券番号の桁数が短すぎる可能性があります。' });
  }
  if (input.residenceCardNumber && input.residenceCardNumber.trim().length < 10) {
    anomalies.push({
      level: 'warning',
      message: '在留カード番号の桁数が短すぎる可能性があります。',
    });
  }

  return anomalies;
}
