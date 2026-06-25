import { Report, Department, SystemConfig } from '@/lib/types';
import { STATUS_LIFECYCLE } from '@/lib/constants';
import { adminDb } from '@/lib/firebase-admin';

export async function runRoutingAgent(report: Report): Promise<Report> {
  const now = new Date().toISOString();

  if (report.status === STATUS_LIFECYCLE.NEEDS_REVIEW) {
    return report;
  }

  try {
    // 1. Fetch department for the report's category using adminDb
    const deptsSnap = await adminDb
      .collection('departments')
      .where('category', '==', report.category)
      .get();

    let assignedDept: Department | null = null;
    deptsSnap.forEach((docSnap) => {
      assignedDept = docSnap.data() as Department;
    });

    if (assignedDept) {
      report.department = (assignedDept as Department).name;
    } else {
      report.department = 'General Services';
    }

    // 2. Read config for SLA hours using adminDb
    const configSnap = await adminDb.collection('config').doc('system_config').get();
    if (!configSnap.exists) {
      throw new Error('Config collection is missing.');
    }
    const config = configSnap.data() as SystemConfig;

    // Use severity as the priority level
    report.priority = report.severity;

    // Get SLA hours from config
    const slaHours = config.slaHoursByPriority[report.priority] || 48;

    report.status = STATUS_LIFECYCLE.ROUTED;
    report.history.push({
      status: STATUS_LIFECYCLE.ROUTED,
      timestamp: now,
      note: `Routing Agent: Report routed to department [${report.department}]. Priority: ${report.priority}. SLA: ${slaHours} hours.`,
    });

  } catch (error: any) {
    console.error('[RoutingAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Routing failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
  }

  report.updatedAt = now;
  return report;
}
