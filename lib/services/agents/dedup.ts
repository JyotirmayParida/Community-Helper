import { Report } from '@/lib/types';
import { STATUS_LIFECYCLE } from '@/lib/constants';
import { adminDb } from '@/lib/firebase-admin';

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function runDedupAgent(report: Report): Promise<Report> {
  const now = new Date().toISOString();

  // If the report was already flagged as needs_review, skip this step
  if (report.status === STATUS_LIFECYCLE.NEEDS_REVIEW) {
    return report;
  }

  try {
    // Query active reports of the same category using adminDb
    const querySnapshot = await adminDb
      .collection('reports')
      .where('category', '==', report.category)
      .get();

    let foundDuplicate: Report | null = null;

    querySnapshot.forEach((docSnap) => {
      const existing = docSnap.data() as Report;
      if (
        existing.id !== report.id &&
        !existing.duplicateOf &&
        existing.status !== STATUS_LIFECYCLE.RESOLVED
      ) {
        const dist = calculateDistance(
          report.geo.lat,
          report.geo.lng,
          existing.geo.lat,
          existing.geo.lng
        );
        // If within 200 meters (0.2 km), consider it a duplicate
        if (dist <= 0.2) {
          foundDuplicate = existing;
        }
      }
    });

    if (foundDuplicate) {
      report.duplicateOf = (foundDuplicate as Report).id;
      report.history.push({
        status: report.status, // Do not change status!
        timestamp: now,
        note: `Dedup Agent: Flagged as duplicate of report ID: ${report.duplicateOf}.`,
      });
    } else {
      report.history.push({
        status: report.status, // Do not change status!
        timestamp: now,
        note: 'Dedup Agent: Completed. No near-duplicates found.',
      });
    }

  } catch (error: any) {
    console.error('[DedupAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Deduplication check failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
  }

  report.updatedAt = now;
  return report;
}
