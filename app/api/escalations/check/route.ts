import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { runEscalationAgent } from '@/lib/services/agents/escalation';
import { Report, SystemConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Fetch system configuration
    const configSnap = await adminDb.collection('config').doc('system_config').get();
    const config = configSnap.exists
      ? (configSnap.data() as SystemConfig)
      : {
          categories: [],
          severityLevels: [],
          slaHoursByPriority: { LOW: 48, MODERATE: 24, HIGH: 12, SEVERE: 8 }
        };

    // 2. Fetch all reports with status 'routed' or 'in_progress'
    const snapshot = await adminDb.collection('reports')
      .where('status', 'in', ['routed', 'in_progress'])
      .get();

    let escalatedCount = 0;

    // 3. Evaluate each report
    for (const docSnap of snapshot.docs) {
      const report = docSnap.data() as Report;
      const originalStatus = report.status;

      const processedReport = await runEscalationAgent(report, config);

      if (processedReport.status === 'escalated' && originalStatus !== 'escalated') {
        escalatedCount++;
        await adminDb.collection('reports').doc(report.id).set(processedReport);
      }
    }

    return NextResponse.json({
      success: true,
      escalatedCount,
      message: `${escalatedCount} report${escalatedCount === 1 ? '' : 's'} escalated`
    });
  } catch (error: any) {
    console.error('[POST /api/escalations/check Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check escalations' },
      { status: 500 }
    );
  }
}
