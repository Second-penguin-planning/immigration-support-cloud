import { Button } from '@/components/ui/button';
import type { Interview } from '@/generated/prisma/client';
import { deleteInterviewAction } from './actions';

export function InterviewList({
  interviews,
  reportId,
}: {
  interviews: Interview[];
  reportId: string;
}) {
  if (interviews.length === 0) {
    return <p className="text-muted-foreground text-sm">面談記録はまだありません。</p>;
  }

  return (
    <ul className="space-y-2">
      {interviews.map((interview) => (
        <li key={interview.id} className="border-border rounded-md border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {interview.conductedAt.toLocaleDateString('ja-JP')} — {interview.conductedBy}
              </p>
              {interview.notes && <p className="text-muted-foreground mt-1">{interview.notes}</p>}
            </div>
            <form action={deleteInterviewAction}>
              <input type="hidden" name="reportId" value={reportId} />
              <input type="hidden" name="interviewId" value={interview.id} />
              <Button type="submit" variant="danger" className="h-8 px-2 text-xs">
                削除
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
