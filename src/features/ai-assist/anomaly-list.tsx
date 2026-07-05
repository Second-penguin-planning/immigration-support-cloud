import { Alert } from '@/components/ui/alert';
import { detectAnomalies, type AnomalyDetectionInput } from '@/lib/anomaly-detection';

export function AnomalyList({ input }: { input: AnomalyDetectionInput }) {
  const anomalies = detectAnomalies(input);

  if (anomalies.length === 0) {
    return <p className="text-muted-foreground text-sm">検出された不整合はありません。</p>;
  }

  return (
    <div className="space-y-2">
      {anomalies.map((anomaly, index) => (
        <Alert key={index} variant={anomaly.level === 'error' ? 'error' : 'warning'}>
          {anomaly.message}
        </Alert>
      ))}
    </div>
  );
}
