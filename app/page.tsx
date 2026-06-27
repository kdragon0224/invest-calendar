'use client';

import { useState, useEffect, useCallback } from 'react';

// ── 타입 ────────────────────────────────────────────────────
interface CalEventItem {
  t: string;       // category: rate | chip | big | ipo
  l: string;       // label
  d: string;       // detail
  confirmed: string; // Y | N | 예상
}
type EventsMap = Record<string, CalEventItem[]>;

// ── 상수 ────────────────────────────────────────────────────
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DOW_KO      = ['일','월','화','수','목','금','토'];
const DOW_COLORS  = ['#E24B4A','#555','#555','#555','#555','#555','#378ADD'];

const CAT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  rate: { bg: '#FCEBEB', color: '#A32D2D', label: '금리 결정' },
  chip: { bg: '#E6F1FB', color: '#185FA5', label: '반도체' },
  big:  { bg: '#EEEDFE', color: '#534AB7', label: '빅테크 AI' },
  ipo:  { bg: '#FAEEDA', color: '#854F0B', label: 'IPO·상장' },
};

function pad(n: number) { return String(n).padStart(2, '0'); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export default function CalendarPage() {
  const today      = new Date();
  const [cur, setCur]           = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [events, setEvents]     = useState<EventsMap>({});
  const [activeKey, setActive]  = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  const loadEvents = useCallback(() => {
    return fetch('/api/events', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: EventsMap) => setEvents(data));
  }, []);

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  function prevMonth() {
    setCur(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
    setActive(null);
  }
  function nextMonth() {
    setCur(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
    setActive(null);
  }

  function pick(key: string) {
    setActive(prev => prev === key ? null : key);
  }

  // ── 캘린더 셀 계산 ──────────────────────────────────────
  const { y, m } = cur;
  const firstDow = new Date(y, m, 1).getDay();
  const lastDay  = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = todayStr();
  const activeRow = activeKey
    ? (() => {
        const [, km, kd] = activeKey.split('-');
        return parseInt(km) === m + 1
          ? Math.floor((firstDow + parseInt(kd) - 1) / 7)
          : -1;
      })()
    : -1;

  const numRows = cells.length / 7;

  // ── 렌더 ────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 32px' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 16, padding: '0 2px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
          📈 투자 일정 캘린더
        </div>
      </div>

      {/* 월 내비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <button onClick={prevMonth} aria-label="이전 달" style={{
          width: 40, height: 40, border: '0.5px solid var(--border2)',
          borderRadius: 'var(--radius)', background: 'var(--bg)',
          color: 'var(--text)', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
          {y}년 {MONTH_NAMES[m]}
        </span>
        <button onClick={nextMonth} aria-label="다음 달" style={{
          width: 40, height: 40, border: '0.5px solid var(--border2)',
          borderRadius: 'var(--radius)', background: 'var(--bg)',
          color: 'var(--text)', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>›</button>
      </div>

      {/* 범례 */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        padding: '9px 12px', background: 'var(--bg2)',
        borderRadius: 'var(--radius)', marginBottom: 14,
      }}>
        {Object.entries(CAT_STYLE).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
            {v.label}
          </div>
        ))}
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'flex', padding: '0 1px', marginBottom: 4 }}>
        {DOW_KO.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontSize: 11,
            fontWeight: 500, padding: '2px 0 6px',
            color: DOW_COLORS[i],
          }}>{d}</div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 14 }}>
          이벤트 불러오는 중…
        </div>
      ) : (
        Array.from({ length: numRows }, (_, row) => (
          <div key={row}>
            {/* 날짜 행 */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
              {Array.from({ length: 7 }, (_, col) => {
                const d = cells[row * 7 + col];
                if (d === null) {
                  return <div key={col} style={{ flex: 1, minHeight: 62 }} />;
                }
                const key     = `${y}-${pad(m + 1)}-${pad(d)}`;
                const evs     = events[key] || [];
                const isToday = key === todayKey;
                const isActive= key === activeKey;
                const dow     = new Date(y, m, d).getDay();
                const nc      = dow === 0 ? '#E24B4A' : dow === 6 ? '#378ADD' : 'var(--text2)';

                return (
                  <div
                    key={col}
                    onClick={() => evs.length ? pick(key) : undefined}
                    style={{
                      flex: 1, minHeight: 62, padding: '4px 3px 3px',
                      borderRadius: isActive ? '7px 7px 0 0' : 7,
                      border: isActive
                        ? '0.5px solid var(--blue)'
                        : isToday
                        ? '0.5px solid var(--border2)'
                        : '0.5px solid transparent',
                      borderBottom: isActive ? '0.5px solid transparent' : undefined,
                      background: isToday && !isActive ? 'var(--bg2)' : 'transparent',
                      cursor: evs.length ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      fontSize: 11.5, fontWeight: (isToday || isActive) ? 600 : 400,
                      marginBottom: 3, lineHeight: 1.2,
                      color: (isToday || isActive) ? 'var(--blue)' : nc,
                    }}>{d}</div>
                    {evs.map((e, i) => (
                      <div key={i} className={`ev-${e.t}`} style={{
                        fontSize: 8.5, padding: '2px 3px', borderRadius: 3,
                        marginBottom: 2, lineHeight: 1.4,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis', fontWeight: 500,
                      }}>{e.l}</div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* 상세 패널 — 선택된 날짜 행 아래 삽입 */}
            {row === activeRow && activeKey && events[activeKey] && (
              <DetailPanel dateKey={activeKey} evs={events[activeKey]} />
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── 상세 패널 컴포넌트 ──────────────────────────────────────
function DetailPanel({ dateKey, evs }: { dateKey: string; evs: CalEventItem[] }) {
  const [ky, km, kd] = dateKey.split('-');
  const dateStr = `${parseInt(ky)}년 ${parseInt(km)}월 ${parseInt(kd)}일 (KST 기준)`;

  return (
    <div className="animate-slidedown" style={{
      width: '100%', marginBottom: 2,
      border: '0.5px solid var(--blue)', borderTop: 'none',
      borderRadius: '0 0 9px 9px', background: 'var(--bg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px', fontSize: 12, fontWeight: 500,
        color: 'var(--text2)', background: 'var(--bg2)',
        borderBottom: '0.5px solid var(--border)',
      }}>
        {dateStr} &nbsp;·&nbsp; {evs.length}개 이벤트
      </div>
      <div style={{ padding: '12px 14px' }}>
        {evs.map((e, i) => {
          const s = CAT_STYLE[e.t] || { bg: '#eee', color: '#333', label: e.t };
          const cfm = e.confirmed === 'Y'
            ? null
            : e.confirmed === '예상'
            ? <span style={{ display: 'inline-block', fontSize: 10, padding: '1px 5px', borderRadius: 3, marginLeft: 5, background: '#FAEEDA', color: '#854F0B', verticalAlign: 'middle' }}>예상</span>
            : <span style={{ display: 'inline-block', fontSize: 10, padding: '1px 5px', borderRadius: 3, marginLeft: 5, background: 'var(--bg3)', color: 'var(--text3)', verticalAlign: 'middle' }}>미확정</span>;

          return (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: i < evs.length - 1 ? 10 : 0 }}>
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 500,
                padding: '3px 8px', borderRadius: 4, marginTop: 1,
                whiteSpace: 'nowrap', background: s.bg, color: s.color,
              }}>{e.l}</span>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                {e.d}{cfm}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
