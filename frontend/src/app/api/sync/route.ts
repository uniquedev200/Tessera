import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ ok: true, status: 'synced' });
}

export async function GET() {
  return NextResponse.json({ ok: true, status: 'synced' });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
