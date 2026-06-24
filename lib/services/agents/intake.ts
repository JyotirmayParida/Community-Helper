import { Report, SystemConfig } from '@/lib/types';
import { STATUS_LIFECYCLE, SeverityLevel } from '@/lib/constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function runIntakeAgent(
  partialReport: Omit<Report, 'id' | 'status' | 'history' | 'createdAt' | 'updatedAt' | 'duplicateOf' | 'department' | 'priority'>
): Promise<Report> {
  const now = new Date().toISOString();
  
  // Create a base report structure
  const reportId = 'rep_' + Math.random().toString(36).substring(2, 15);
  const report: Report = {
    ...partialReport,
    id: reportId,
    status: STATUS_LIFECYCLE.SUBMITTED,
    duplicateOf: null,
    department: null,
    priority: null,
    history: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Log the initial status
    report.history.push({
      status: STATUS_LIFECYCLE.SUBMITTED,
      timestamp: now,
      note: 'Report successfully submitted by citizen.',
    });

    // Read config from Firestore
    const configRef = doc(db, 'config', 'system_config');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      throw new Error('Config collection is missing.');
    }
    
    const config = configSnap.data() as SystemConfig;

    // Validate category
    if (!config.categories.includes(report.category)) {
      throw new Error(`Invalid category: ${report.category}`);
    }

    // Validate severity
    if (!config.severityLevels.includes(report.severity)) {
      throw new Error(`Invalid severity: ${report.severity}`);
    }

    // Validate coordinates
    if (
      typeof report.geo?.lat !== 'number' || 
      typeof report.geo?.lng !== 'number' ||
      isNaN(report.geo.lat) || 
      isNaN(report.geo.lng)
    ) {
      throw new Error('Invalid geographical coordinates.');
    }

  } catch (error: any) {
    console.error('[IntakeAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Intake check failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
  }

  return report;
}
