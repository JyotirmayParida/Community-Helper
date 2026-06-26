import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { reportId, userId } = await req.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'Missing reportId or userId.' },
        { status: 400 }
      );
    }

    const reportRef = adminDb.collection('reports').doc(reportId);
    const docSnap = await reportRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Report not found.' },
        { status: 404 }
      );
    }

    const reportData = docSnap.data();
    if (!reportData) {
      return NextResponse.json(
        { error: 'Report is empty.' },
        { status: 500 }
      );
    }

    if (reportData.citizenId === userId) {
      return NextResponse.json(
        { error: 'You cannot confirm your own report.' },
        { status: 400 }
      );
    }

    const confirmations = reportData.confirmations || [];
    if (confirmations.includes(userId)) {
      return NextResponse.json(
        { error: 'You have already confirmed this report.' },
        { status: 400 }
      );
    }

    const updatedConfirmations = [...confirmations, userId];
    await reportRef.update({
      confirmations: updatedConfirmations,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      confirmations: updatedConfirmations,
    });
  } catch (error: any) {
    console.error('[POST /api/reports/confirm Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to confirm report.' },
      { status: 500 }
    );
  }
}
