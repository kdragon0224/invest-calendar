import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'events.json'), 'utf-8');
    const events = JSON.parse(raw) as {
      date: string;
      category: string;
      label: string;
      detail: string;
      confirmed: string;
    }[];

    const grouped: Record<string, { t: string; l: string; d: string; confirmed: string }[]> = {};
    for (const ev of events) {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push({ t: ev.category, l: ev.label, d: ev.detail, confirmed: ev.confirmed });
    }

    return NextResponse.json(grouped);
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
  }
}
