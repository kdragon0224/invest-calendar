import { sql } from '@vercel/postgres';

export { sql };

export interface CalEvent {
  id: number;
  date: string;        // 'YYYY-MM-DD'
  category: string;    // 'rate' | 'chip' | 'big' | 'ipo'
  label: string;
  detail: string;
  confirmed: string;   // 'Y' | 'N' | '예상'
}

/** 모든 이벤트를 날짜순으로 반환 */
export async function getAllEvents(): Promise<CalEvent[]> {
  const { rows } = await sql<CalEvent>`
    SELECT id, to_char(date, 'YYYY-MM-DD') AS date, category, label, detail, confirmed
    FROM events
    ORDER BY date ASC
  `;
  return rows;
}

/** 날짜별로 그룹핑된 이벤트 객체 반환 (캘린더 렌더용) */
export async function getEventsGrouped(): Promise<Record<string, { t: string; l: string; d: string; confirmed: string }[]>> {
  const rows = await getAllEvents();
  const grouped: Record<string, { t: string; l: string; d: string; confirmed: string }[]> = {};
  for (const row of rows) {
    const key = row.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ t: row.category, l: row.label, d: row.detail, confirmed: row.confirmed });
  }
  return grouped;
}

/** 전체 이벤트 교체 */
export async function replaceAllEvents(events: Omit<CalEvent, 'id'>[]): Promise<number> {
  await sql`DELETE FROM events`;
  for (const ev of events) {
    await sql`
      INSERT INTO events (date, category, label, detail, confirmed)
      VALUES (${ev.date}, ${ev.category}, ${ev.label}, ${ev.detail}, ${ev.confirmed})
    `;
  }
  return events.length;
}
