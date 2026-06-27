import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { replaceAllEvents } from '@/lib/db';

// ── POST /api/ai-update ─────────────────────────────────────
// 웹앱 "AI 갱신" 버튼 → Gemini가 최신 투자 일정 검색 → DB 저장
export async function POST(_req: NextRequest) {
  try {
    // ── 날짜 범위 계산 (오늘 ~ 4개월 후) ──────────────────
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 4);

    const fmt = (d: Date) =>
      `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    const fmtYM = (d: Date) =>
      `${d.getFullYear()}년 ${d.getMonth() + 1}월`;

    const todayStr  = fmt(now);
    const endStr    = fmtYM(endDate);

    // ── Gemini 호출 ────────────────────────────────────────
    const model = getGeminiModel();

    const prompt = `
오늘 날짜: ${todayStr} (KST)
갱신 대상 기간: ${todayStr} ~ ${endStr}까지 (약 4개월)

아래 투자 카테고리별로 이 기간 내 주요 일정을 웹 검색해서 정확한 날짜와 함께 JSON 배열로 반환해주세요.

[카테고리별 수집 대상]
- rate: FOMC 금리 결정, 미국 CPI 발표, 미국 PCE 발표, 한국은행 금통위, 미국 옵션 만기일(월별 3번째 금요일), 분기 트리플위칭
- chip: NVIDIA·AMD·TSMC·마이크론·SK하이닉스·삼성전자·인텔·샌디스크(SanDisk) 실적 발표
- big: Microsoft·Alphabet(Google)·Meta·Amazon·Apple 실적 발표
- ipo: SK하이닉스 나스닥 ADR 상장, MSCI 분기/연간 리뷰, 주요 AI 기업 IPO

[규칙]
- date는 KST 기준 실제 발표/이벤트 날짜
- 미국 AMC(장 마감 후) 실적은 다음날 새벽 KST이므로 그 다음날 날짜로 기록
- label은 20자 이내 한국어, 영어 기업명은 그대로 사용 가능
- detail은 100자 이내 한국어로 핵심 포인트만
- confirmed: 날짜 확정이면 "Y", 추정이면 "예상"
- 날짜가 불확실한 것은 제외하고 확실한 것만 포함

[반환 형식 - JSON 배열만, 다른 설명 없이]
[
  {
    "date": "YYYY-MM-DD",
    "category": "rate 또는 chip 또는 big 또는 ipo",
    "label": "짧은 레이블",
    "detail": "상세 설명",
    "confirmed": "Y 또는 예상"
  }
]
`.trim();

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    // ── JSON 파싱 ──────────────────────────────────────────
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('Gemini 응답에서 JSON을 찾지 못했습니다:\n', text);
      return NextResponse.json({ ok: false, error: 'AI 응답 파싱 실패. 다시 시도해주세요.' }, { status: 500 });
    }

    const events = JSON.parse(match[0]) as {
      date: string; category: string; label: string; detail: string; confirmed: string;
    }[];

    // 유효성 검사: date·category·label 필드 필수
    const valid = events.filter(e => e.date && e.category && e.label);
    if (valid.length === 0) {
      return NextResponse.json({ ok: false, error: '유효한 이벤트가 없습니다.' }, { status: 500 });
    }

    // ── DB 저장 ────────────────────────────────────────────
    const count = await replaceAllEvents(valid);
    const updatedAt = now.toLocaleString('ko-KR', { hour12: false }).slice(0, 16);

    console.log(`✅ AI 갱신 완료: ${count}건 (${updatedAt})`);
    return NextResponse.json({ ok: true, count, updatedAt });

  } catch (err) {
    console.error('POST /api/ai-update error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
