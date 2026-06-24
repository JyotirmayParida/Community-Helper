import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportRef = doc(db, 'reports', id);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(reportSnap.data() as Report);
  } catch (error: any) {
    console.error('[GET /api/reports/:id Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch report' }, { status: 500 });
  }
}
