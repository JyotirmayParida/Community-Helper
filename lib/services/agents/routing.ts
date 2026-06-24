import { Report, Department, SystemConfig } from '@/lib/types';
import { STATUS_LIFECYCLE } from '@/lib/constants';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function runRoutingAgent(report: Report): Promise<Report> {
  const now = new Date().toISOString();

  if (report.status === STATUS_LIFECYCLE.NEEDS_REVIEW) {
    return report;
  }

  try {
    // 1. Fetch department for the report's category
    const deptsRef = collection(db, 'departments');
    const q = query(deptsRef, where('category', '==', report.category));
    const querySnapshot = await getDocs(q);

    let assignedDept: Department | null = null;
    querySnapshot.forEach((docSnap) => {
      assignedDept = docSnap.data() as Department;
    });

    // If no specific department is found, assign general services
    if (assignedDept) {
      report.department = (assignedDept as Department).name;
    } else {
      report.department = 'General Services';
    }

    // 2. Read config for SLA hours
    const configRef = doc(db, 'config', 'system_config');
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
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
      note: `Report routed to department [${report.department}]. Priority: ${report.priority}. SLA: ${slaHours} hours.`,
    });

    report.updatedAt = now;
  } catch (error: any) {
    console.error('[RoutingAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Routing failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
    report.updatedAt = now;
  }

  return report;
}
