📊 Financial Event–Driven Market Impact System
News → FX Transmission → Sector Heatmap Prediction
1. 프로젝트 개요 (Overview)

본 프로젝트는 뉴스 이벤트를 기반으로 금융시장(특히 FX 및 섹터)의 방향성 변화를 분석하고, 이를 시각적 히트맵으로 표현하는 시스템이다.

이 시스템의 핵심 목표는 “가격 예측”이 아니라,

왜 시장이 움직일 수 있는지를 구조적으로 설명하는 것이다.

이를 위해 본 프로젝트는 다음 원칙을 따른다:

❌ 단일 기사로 수치를 예측하지 않는다

❌ LLM에게 가격·수익률·퍼센트를 예측하게 하지 않는다

✅ 뉴스 → FX 전파 채널 → 섹터 영향이라는 인과 구조(causal structure) 를 모델링한다

✅ 모든 예측 결과는 설명 가능(explainable) 해야 한다

2. 문제 정의 (Problem Definition)
기존 뉴스 기반 시장 분석의 한계

기존 시스템들은 보통 다음과 같은 문제를 가진다:

문제	설명
뉴스 해석이 주관적	“호재/악재” 수준에 머무름
FX와 섹터 연결이 불명확	왜 이 섹터가 영향을 받는지 설명 불가
LLM 환각(hallucination)	수치 예측이 근거 없이 생성됨
시장 국면 미반영	같은 뉴스라도 시장 상황에 따라 반응이 달라짐
본 프로젝트의 접근 방식

본 시스템은 이를 다음과 같이 해결한다:

LLM은 ‘해석’을 담당하고,
규칙 엔진은 ‘결정’을 담당한다.

3. 시스템 전체 구조 (Architecture)
[Market Data API]
   ↓
Baseline Sector Heatmap (현재 시장 상태)

[News Article URL]
   ↓
Article Text Extraction
   ↓
LLM (GPT-4-mini)
   ↓
Event Interpretation
   ↓
FX Transmission Channels
   ↓
Rule Engine (FX → Sector)
   ↓
Sector Delta (변화 압력)

Baseline + Delta
   ↓
Predicted Sector Heatmap

4. 핵심 개념 정의 (Core Concepts)
4.1 Baseline (기준선)

**Baseline은 “현재 시장이 이미 반영하고 있는 상태”**를 의미한다.

실시간 혹은 최근 시장 데이터 기반

섹터별 상대 강도

예시:

{
  "Energy": 1.0,
  "Defense": 1.0,
  "Financials": -1.0,
  "Technology": -1.0
}


👉 Baseline은 사실(fact) 이며, LLM의 영향을 받지 않는다.

4.2 Delta (변화 압력)

**Delta는 뉴스 이벤트로 인해 “추가로 발생할 수 있는 방향성 압력”**이다.

예측값이 아님

가격 변화량이 아님

상대적 방향성(relative directional pressure)

예:

+0.5 → 기존 흐름을 강화

-0.7 → 기존 흐름을 약화

4.3 FX Transmission Channel (FX 전파 채널)

FX는 단순히 “USD 상승/하락”으로 해석되지 않는다.
같은 USD 상승이라도 전파 경로에 따라 시장 반응은 완전히 달라진다.

본 시스템은 FX 영향을 채널(channel) 로 분리한다.

주요 전파 채널 예시
채널	의미
interest_rate_differential	금리 차이, 통화정책
risk_off	글로벌 위험 회피
risk_on	위험 선호
growth_expectation	성장 기대
liquidity_stress	유동성 경색
geopolitical_risk	지정학적 리스크

👉 LLM은 채널을 “선택”만 한다.
채널의 영향력은 룰 엔진이 결정한다.

5. FX → Sector Rule Engine
5.1 왜 룰 엔진인가?

LLM은 일관된 수치 판단에 약함

금융 시장은 반복되는 구조적 패턴이 존재

따라서 사람이 정의한 룰 + LLM 보조가 가장 안정적

5.2 FX → Sector 매트릭스 예시
FX_SECTOR_MATRIX = {
  "risk_off": {
    "Technology": -0.7,
    "Financials": -0.5,
    "Defense": +0.6,
    "Energy": +0.2
  },
  "interest_rate_differential": {
    "Financials": +0.7,
    "Technology": -0.6,
    "RealEstate": -0.8
  }
}


👉 이 매트릭스는 **“시장 경험을 코드화한 것”**이다.

6. LLM의 역할과 제한 (LLM Design Philosophy)
6.1 LLM이 하는 일

뉴스 이벤트 요약

이벤트 유형 분류

FX 전파 채널 선택

불확실성(confidence) 표현

6.2 LLM이 하지 않는 일

❌ 가격 예측

❌ 수익률 예측

❌ 섹터 점수 생성

❌ 히트맵 생성

6.3 LLM 출력 스키마 (고정)
{
  "event_type": "string",
  "summary": "string",
  "confidence": 0.0,
  "primary_fx": ["USD", "EUR"],
  "fx_direction": {
    "USD": "bullish|bearish|neutral"
  },
  "transmission_channels": [
    "risk_off"
  ],
  "time_horizon": "short_term",
  "key_risks": ["string"]
}

7. 시장 국면 (Market Regime)

같은 뉴스라도 시장 국면에 따라 반응은 달라진다.

본 시스템은 LLM에게 시장 분위기를 추측시키지 않고,
외부 지표를 통해 명시적으로 주입한다.

사용 지표
지표	의미
VIX	변동성
DXY	달러 강도
US10Y	금리/유동성
예시 입력
{
  "risk_sentiment": "risk_off",
  "volatility": "elevated",
  "liquidity": "tight"
}

8. Baseline + Delta 합성 로직

최종 예측 히트맵은 다음과 같이 계산된다:

Predicted Score = Baseline + (Delta × Confidence × Regime Multiplier)

설계 이유

Confidence: 뉴스의 신뢰도 반영

Regime Multiplier: 시장 국면 증폭/감쇠

Clamp: 과도한 변화 방지

9. 시각화 (Visualization)
제공되는 뷰

Timeline: 분석된 이벤트 흐름

Baseline Heatmap: 현재 시장

Predicted Heatmap: 뉴스 반영 후 예상

Causal Graph: Event → FX → Sector

히트맵은 다음을 의미한다

색상: 방향성

진하기: 강도

예측 히트맵은 “가능한 시나리오 중 하나”

10. 이 프로젝트가 “예측 시스템이 아닌 이유”

❗ 이 시스템은 트레이딩 봇이 아니다.
❗ 투자 자문 시스템이 아니다.

이 시스템은 다음을 목표로 한다:

시장 반응의 구조적 이해

뉴스 해석의 일관성

FX와 섹터 간 인과 관계 시각화

11. 향후 확장 방향 (Roadmap)

여러 뉴스 이벤트 누적 + 시간 감쇠(decay)

국가별 FX → 섹터 민감도 분리

백테스트용 이벤트 로그

멀티 시나리오 히트맵

정책/기업 이벤트 분리 분석