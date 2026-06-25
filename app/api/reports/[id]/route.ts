import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Report } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportSnap = await adminDb.collection('reports').doc(id).get();

    if (!reportSnap.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(reportSnap.data() as Report);
  } catch (error: any) {
    console.error('[GET /api/reports/:id Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch report' }, { status: 500 });
  }
}
