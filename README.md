# 📊 금융 이벤트 인텔리전스 (FX + 섹터)
### Financial Event Intelligence System  
**News → FX Signal → Sector Impact → Heatmap**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![LLM](https://img.shields.io/badge/LLM-Event%20Interpretation-purple?style=for-the-badge)
![RuleEngine](https://img.shields.io/badge/Rule--Based-Scoring-critical?style=for-the-badge)
![Explainable](https://img.shields.io/badge/Explainable-Design-success?style=for-the-badge)

---

## 📌 프로젝트 개요

본 프로젝트는 **금융 뉴스 이벤트를 구조적으로 해석**하여  
**FX 방향성(FX bias)** 과 **섹터 영향(Sector pressure)** 을  
**룰 기반 점수(rule-based scoring)** 로 계산하고,  
이를 **대시보드(타임라인 + 히트맵)** 로 시각화하는 시스템이다.

이 프로젝트의 목적은 **가격 예측이 아니라** 다음에 있다.

> **“왜 이 뉴스가, 이 통화와 이 섹터에 영향을 줄 수 있는가?”**

### 핵심 설계 원칙

- ❌ LLM에게 가격·수익률·퍼센트 예측을 맡기지 않음
- ❌ 단일 기사 기반의 정량 예측 금지
- ✅ LLM은 **이벤트 해석과 분류만 담당**
- ✅ 실제 결정은 **룰 엔진이 담당**
- ✅ 모든 결과는 **설명 가능(Explainable)** 해야 함

---

## 🧠 시스템 접근 방식

이 시스템은 다음과 같은 역할 분리를 따른다.

| 구성 요소 | 역할 |
|---|---|
| 뉴스 수집 | 원문 데이터 확보 |
| LLM | 이벤트 요약 및 신호 정규화 |
| Rule Engine | FX bias / 섹터 점수 결정 |
| DB | 이벤트·스코어 로그 저장 |
| UI | 타임라인 / 히트맵 시각화 |

> **LLM은 “해석”을 담당하고,  
Rule Engine은 “결정”을 담당한다.**

---

## 🧩 전체 파이프라인 개요

News Article  
↓  
Raw Event Ingest  
↓  
LLM Event Normalization  
↓  
FX / Risk / Rate / Geo Signals  
↓  
Rule Engine Scoring  
↓  
FX Bias + Sector Scores  
↓  
Timeline & Heatmap Dashboard


---

## 📦 구성 요약

- **백엔드 API**: `app/`  
  - FastAPI
  - Postgres 연동
- **정적 UI**: `app/ui/`  
  - FastAPI에서 `/` 경로로 직접 서빙
- **프런트 프로토타입**: `src/`  
  - 현재 실행에는 사용되지 않음 (실험용)

---

## ⚙️ 기술 스택 (Tech Stack)

### Backend
- **Python 3.11+**
- **FastAPI**
- **Uvicorn**
- **PostgreSQL**

### LLM
- OpenAI API (`gpt-4o-mini`)
- OpenAI-compatible Local LLM (Mistral 등)

### Data / Infra
- RapidAPI (뉴스 수집)
- 환경 변수 기반 설정 (`.env`)

### Architecture
- Rule-based Scoring Engine
- Event-driven Pipeline
- Explainable Market Intelligence Design

---

## 📋 요구 사항

- Python **3.11+** (권장)
- PostgreSQL

---

## 🚀 설치 및 실행

### 1️⃣ `.env` 생성
`.env.example` 파일 참고

### 2️⃣ 의존성 설치

```bash
pip install -r requirements.txt


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
