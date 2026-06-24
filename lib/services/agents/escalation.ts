import { Report } from '@/lib/types';
import { STATUS_LIFECYCLE } from '@/lib/constants';

export async function runEscalationAgent(report: Report): Promise<Report> {
  const now = new Date().toISOString();

  try {
    let shouldEscalate = false;
    let reason = '';

    // Condition 1: If report has SEVERE severity and is not yet resolved, escalate it
    if (report.severity === 'SEVERE' && report.status !== STATUS_LIFECYCLE.RESOLVED && report.status !== STATUS_LIFECYCLE.ESCALATED) {
      shouldEscalate = true;
      reason = 'Immediate escalation triggered due to SEVERE severity rating.';
    }

    if (shouldEscalate) {
      report.status = STATUS_LIFECYCLE.ESCALATED;
      report.history.push({
        status: STATUS_LIFECYCLE.ESCALATED,
        timestamp: now,
        note: `Escalation Agent: ${reason}`,
      });
      report.updatedAt = now;
    }
  } catch (error: any) {
    console.error('[EscalationAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Escalation evaluation failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
    report.updatedAt = now;
  }

  return report;
}
