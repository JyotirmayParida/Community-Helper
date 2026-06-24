import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedDatabase } from '@/lib/services/seed';
import { processReportLifecycle } from '@/lib/services/agents/manager';
import { Report } from '@/lib/types';

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

export async function GET(req: NextRequest) {
  try {
    // Ensure configuration is seeded
    await seedDatabase();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius'); // in km

    const reportsRef = collection(db, 'reports');
    let q = query(reportsRef);

    if (statusParam) {
      q = query(reportsRef, where('status', '==', statusParam));
    }

    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];

    querySnapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as Report);
    });

    // Apply geo-radius filtering in memory if parameters are provided
    if (latParam && lngParam && radiusParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      const radius = parseFloat(radiusParam);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        const filtered = reports.filter((report) => {
          if (!report.geo) return false;
          const dist = calculateDistance(lat, lng, report.geo.lat, report.geo.lng);
          return dist <= radius;
        });
        return NextResponse.json(filtered);
      }
    }

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('[GET /api/reports Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to list reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure configuration is seeded
    await seedDatabase();

    const body = await req.json();
    const { citizenId, mediaUrl, geo, category, severity, confidence } = body;

    if (!citizenId || !category || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: citizenId, category, severity are mandatory.' },
        { status: 400 }
      );
    }

    // Run the full multi-agent pipeline
    const processedReport = await processReportLifecycle({
      citizenId,
      mediaUrl: mediaUrl || '',
      geo: geo || { lat: 37.7749, lng: -122.4194 }, // default coordinates if none provided
      category,
      severity,
      confidence: typeof confidence === 'number' ? confidence : 1.0,
    });

    return NextResponse.json(processedReport, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/reports Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to create report' }, { status: 500 });
  }
}
