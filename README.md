# 금융 이벤트 인텔리전스 (FX + 섹터)

뉴스를 수집하고 LLM으로 이벤트를 정규화한 뒤, FX 방향성과 섹터 영향을 룰 기반으로 점수화해서 대시보드로 보여주는 프로젝트입니다. FastAPI가 백엔드와 정적 UI를 함께 제공합니다.

## 구성 요약

- 백엔드 API: `app/` (FastAPI + Postgres)
- 정적 UI: `app/ui/` (FastAPI에서 `/`로 제공)
- 프런트 프로토타입: `src/` (현재 실행에는 사용되지 않음)

## 요구 사항

- Python 3.11+ 권장
- Postgres

## 설치 및 실행

1) `.env` 생성 (`.env.example` 참고)
2) 의존성 설치:

```bash
pip install -r requirements.txt
```

3) API 실행:

```bash
uvicorn app.main:app --reload
```

브라우저에서 `http://localhost:8000` 접속.

## 환경 변수

필수:
- `FIM_DATABASE_URL` 또는 `DATABASE_URL` (Postgres)
- `LLM_PROVIDER` (`openai` 또는 `local`)

OpenAI 모드:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (기본값: `gpt-4o-mini`)

로컬(OpenAI 호환) 모드:
- `LLM_BASE_URL` (기본값: `http://localhost:8000/v1`)
- `LLM_MODEL` (기본값: `mistral`)

RapidAPI(뉴스 소스):
- `FIM_RAPIDAPI_KEY`
- `FIM_RAPIDAPI_HOST`
- `FIM_RAPIDAPI_BASE_URL`

## 주요 API

- `GET /health` 상태 체크
- `GET /categories` 카테고리 목록
- `GET /news?category=...&limit=10` 뉴스 가져오기
- `POST /ingest/run` 원문 수집
- `POST /events/normalize` LLM 정규화
- `POST /events/score` FX/섹터 점수화
- `POST /pipeline/run` 전체 파이프라인
- `POST /pipeline/run_one?raw_event_id=...` 기사 1건 파이프라인
- `GET /timeline` 스코어된 이벤트 목록
- `GET /heatmap` 섹터 히트맵 점수

## FX/섹터 스코어링

룰 정의:
- `app/rules/weights.py`
- `app/rules/engine.py`

LLM이 `risk_signal`, `rate_signal`, `geo_signal`, `sector_impacts`를 출력하고,
룰 엔진이 이를 FX bias와 섹터 점수로 변환합니다.

## UI

FastAPI가 `app/ui/index.html`과 정적 자산을 서빙합니다.
대시보드는 `/timeline`, `/heatmap`을 조회해 데이터를 표시합니다.

## 자주 쓰는 작업

- 기사 1건만 기준으로 초기화 후 실행: `POST /pipeline/run_one`
- 전체 파이프라인 재실행: `POST /pipeline/run`

## 폴더 구조

```
app/
  ingest/          # 뉴스 수집
  llm/             # LLM 클라이언트/정규화
  rules/           # FX + 섹터 스코어링
  store/           # DB 접근
  ui/              # 정적 대시보드
src/               # 프런트 프로토타입
```
