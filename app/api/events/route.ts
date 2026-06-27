import { NextRequest, NextResponse } from 'next/server';
import { getEventsGrouped, replaceAllEvents } from '@/lib/db';

// ── GET /api/events ─────────────────────────────────────────
// 캘린더 페이지가 이 엔드포인트를 호출해 이벤트 데이터를 받아옴
export async function GET() {
  try {
    const grouped = await getEventsGrouped();
    return NextResponse.json(grouped);
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
  }
}

// ── POST /api/events ────────────────────────────────────────
// Claude가 이벤트 데이터를 업데이트할 때 사용
//
// 요청 형식 (JSON):
// {
//   "secret": "invest2026!",
//   "events": [
//     { "date": "2026-07-16", "category": "chip", "label": "TSMC",
//       "detail": "...", "confirmed": "Y" },
//     ...
//   ]
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 보안: POST_SECRET 확인
    const secret = process.env.POST_SECRET;
    if (!secret || body.secret !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 데이터 검증
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ ok: false, error: 'events 배열이 비어있습니다.' }, { status: 400 });
    }

    const count = await replaceAllEvents(body.events);
    const updatedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    console.log(`✅ POST /api/events: ${count}건 갱신 (${updatedAt})`);
    return NextResponse.json({ ok: true, count, updatedAt });

  } catch (err) {
    console.error('POST /api/events error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
