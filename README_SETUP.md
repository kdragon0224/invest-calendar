# 투자 일정 캘린더 — Vercel 배포 가이드

## 구조

```
Claude → POST /api/events → Vercel Postgres → Next.js 앱 (Vercel 호스팅)
```

Drive·Apps Script 없이 Claude가 직접 DB를 업데이트합니다.

---

## 1단계: GitHub 저장소 생성

1. https://github.com/new 에서 새 저장소 생성 (예: `invest-calendar`)
2. 이 폴더의 파일들을 모두 push:

```bash
cd "투자 검토"            # 이 폴더
git init                # git 초기화
git add -A               # 전체 파일 추가(숨기 파일 포함)
git commit -m "init"    # 커밋
git remote add origin https://github.com/YOUR_ID/invest-calendar.git
git push -u origin main
```

> ⚠️ `.env.local`은 `.gitignore`에 포함되어 있어 자동으로 제외됩니다.

---

## 2단계: Vercel에 배포

1. https://vercel.com → **Add New Project**
2. GitHub 저장소 `invest-calendar` 선택 → **Deploy**
3. 배포 완료 후 URL 확인 (예: `https://invest-calendar.vercel.app`)

---

## 3단계: Vercel Postgres 생성

1. Vercel 대시보드 → 해당 프로젝트 → **Storage** 탭
2. **Create Database** → **Postgres (Neon)** 선택
3. 이름 입력 (예: `invest-db`) → **Create & Continue**
4. **Connect to Project** → 프로젝트 선택 후 연결
5. 연결하면 `POSTGRES_URL` 등 환경변수가 자동으로 프로젝트에 추가됨

---

## 4단계: 환경변수 추가

Vercel 대시보드 → **Settings** → **Environment Variables**에서 추가:

| 변수명 | 값 |
|--------|-----|
| `POST_SECRET` | `invest2026!` |

> `POSTGRES_*` 변수들은 Postgres 연결 시 자동으로 추가됩니다.

---

## 5단계: 재배포

환경변수 추가 후 **Deployments** → **Redeploy** (또는 git push하면 자동 배포)

---

## 6단계: DB 테이블 초기화 (최초 1회)

브라우저에서 아래 URL 접속:

```
https://your-app.vercel.app/api/setup?secret=invest2026!
```

성공 시 응답:
```json
{ "ok": true, "message": "✅ events 테이블이 준비되었습니다." }
```

---

## 7단계: 초기 데이터 투입

Claude에게 아래 프롬프트로 데이터 업데이트 요청:

```
투자 캘린더 이벤트데이터_초기값.csv 파일을 읽어서
https://your-app.vercel.app/api/events 에 POST로 데이터 투입해줘.
secret은 invest2026! 이야.
```

또는 Claude가 직접 아래 형식으로 POST:

```json
POST https://your-app.vercel.app/api/events
{
  "secret": "invest2026!",
  "events": [
    { "date": "2026-07-16", "category": "chip", "label": "TSMC", "detail": "...", "confirmed": "Y" },
    ...
  ]
}
```

---

## 로컬 개발 (선택사항)

```bash
npm install
cp .env.local.example .env.local
# .env.local에 POSTGRES_URL 등 입력 (Vercel 대시보드에서 복사)
npm run dev
# → http://localhost:3000
```

---

## API 요약

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/events` | GET | 캘린더 이벤트 JSON 반환 |
| `/api/events` | POST | 이벤트 전체 교체 (secret 필요) |
| `/api/setup?secret=...` | GET | DB 테이블 초기화 (최초 1회) |

---

## 이전 Apps Script 버전 백업

`old_googlesheet/` 폴더에 보관:
- `Code.gs` — Apps Script 백엔드
- `index.html` — Apps Script 프론트엔드
