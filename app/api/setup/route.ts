import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// ── GET /api/setup ──────────────────────────────────────────
// DB 테이블 초기화 (최초 1회만 실행)
// 브라우저에서 https://your-app.vercel.app/api/setup 접속하면 실행됨
export async function GET(req: NextRequest) {
  // 간단한 보안: ?secret=... 쿼리 파라미터 확인
  const { searchParams } = new URL(req.url);
  const secret = process.env.POST_SECRET;
  if (!secret || searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized — ?secret=... 를 URL에 추가하세요.' }, { status: 401 });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id         SERIAL PRIMARY KEY,
        date       DATE         NOT NULL,
        category   VARCHAR(10)  NOT NULL,
        label      VARCHAR(200) NOT NULL,
        detail     TEXT         DEFAULT '',
        confirmed  VARCHAR(10)  DEFAULT 'Y',
        created_at TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON events (date)`;

    return NextResponse.json({ ok: true, message: '✅ events 테이블이 준비되었습니다.' });
  } catch (err) {
    console.error('setup error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
