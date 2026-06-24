import { runIntakeAgent } from './intake';
import { runDedupAgent } from './dedup';
import { runRoutingAgent } from './routing';
import { runEscalationAgent } from './escalation';
import { Report } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function processReportLifecycle(
  partialReport: Omit<Report, 'id' | 'status' | 'history' | 'createdAt' | 'updatedAt' | 'duplicateOf' | 'department' | 'priority'>
): Promise<Report> {
  // Step 1: Run Intake Agent
  let report = await runIntakeAgent(partialReport);

  // Step 2: Run Dedup Agent (only if not already marked for review)
  if (report.status !== 'needs_review') {
    report = await runDedupAgent(report);
  }

  // Step 3: Run Routing Agent (only if not marked for review)
  if (report.status !== 'needs_review') {
    report = await runRoutingAgent(report);
  }

  // Step 4: Run Escalation Agent (only if not marked for review)
  if (report.status !== 'needs_review') {
    report = await runEscalationAgent(report);
  }

  // Save the final report document to Firestore
  try {
    const reportRef = doc(db, 'reports', report.id);
    await setDoc(reportRef, report);
  } catch (error) {
    console.error('Failed to write report to database:', error);
  }

  return report;
}
