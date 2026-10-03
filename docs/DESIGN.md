# 디자인 적용 계획 (피그마 → 앱)

> 2026-10-02 작성. 다음 세션(노트북)에서 이 문서를 읽고 바로 시작한다.
> 피그마 파일: https://www.figma.com/design/M8X6II7JtSnIqzB8PrgiW8/ (fileKey `M8X6II7JtSnIqzB8PrgiW8`)
> 전체 캔버스 노드: `215:10646`

## 확정된 결정 (아현, 2026-10-02)

1. 바뀐 모든 것은 **피그마 기준**으로 맞춘다. 기존 구현과 다르면 피그마를 따른다.
2. 온보딩 "FIUM 기기 번호" → BLE 기기 이름 `C33_FLOWER_{번호}` 로 사용.
3. 성별 항목 삭제.
4. 개화 화면 Blooming → Bloomed 전환은 **로봇이 신호를 보낼 때**(`HOME OK` / 위치 0 도달) 전환. 타이머 아님.
5. 설정 화면의 「관리자에게 알리기」 버튼은 **보이게** 둔다 (초기 "숨김" 결정 변경). BLE 디버그용 관리자 메뉴(RESET/TEST/MOVEPOS 등)는 계속 숨김 진입(설정 하단 길게 누르기)으로 유지.
6. 폰트 Pretendard — `assets/fonts/Pretendard-{Regular,Medium,SemiBold,Bold,ExtraBold}.otf` 이미 받아둠 (OFL 라이선스).
7. 홈 상태 카드 배경·Blooming 배경은 PNG 말고 **벡터 컴포넌트** 사용: `Image/BG_Vector_Status Container`(171:10894), `Image/BG_Vector_Blooming`(239:17998).

## 피그마에서 읽어오는 방법 (에이전트용)

- Cursor의 Figma MCP 플러그인이 필요하다. 노트북에 없으면 Cursor 설정 → Plugins/MCP에서 Figma 플러그인 설치 후 로그인.
- 화면/컴포넌트 코드·레이아웃·에셋 URL: `get_design_context(fileKey, nodeId)` — 호출 전 `figma-design-to-code` 스킬을 먼저 읽는다.
- 변수(색·타이포): `get_variable_defs(fileKey, "215:10646")`
- 레이어 구조 훑기: `get_metadata`, 미리보기: `get_screenshot`
- 에셋 URL은 7일 뒤 만료되므로 받자마자 `assets/` 아래에 저장하고 코드에서는 로컬 파일만 참조한다.
- 피그마 응답은 React+Tailwind 형태다. 그대로 쓰지 말고 RN `StyleSheet` + 프로젝트 토큰으로 옮긴다.
- 스크린샷의 안드로이드 상태바·하단 시스템 버튼·카메라 홀은 코드에 넣지 않는다 (기기가 그림).

## 디자인 토큰 (피그마 변수 기준)

색상
- primary/base `#FDFBD4`, 100 `#F9F37B`, 300 `#B0AD62`, 400 `#89864B`, 500 `#646236`, 600 `#414021`, 700 `#21210E`
- secondary/300 `#7680F9`, 400 `#3D52F5`, 700 `#02093E`
- grey/base `#F9F9F6`, Pure White `#FFFFFF`, light grey `#D9D9D9`, 200 `#D0D0CD`, 300 `#A9A9A6`, 400 `#848481`, 500 `#60605E`, 600 `#3F3F3D`, 700 `#20201F`

타이포 (Pretendard)
- 2. Heading: Bold 24 / lh 100%
- 2-1. Heading_Light: Regular 24 / lh 100%
- 3. Title: SemiBold 20 / lh 28
- 3-1. Title: Medium 20 / lh 28
- 4. Sub Title: SemiBold 18 / lh 26
- 5. Body Large: Medium 16 / lh 21
- 6. Body Small: Regular 14 / lh 18
- 7. Label: SemiBold 14 / lh 16
- 8. Caption: Regular 12 / lh 100%
- Water Percent: ExtraBold 100 / lh 1 / letterSpacing -3

기타: 바텀 내비 높이 56 + 하단 inset, 좌우 여백 20, 카드 radius 16, 알약 버튼 radius 28, 디자인 기준 폭 360~412.

## 화면 노드 ID

| 화면 | 노드 | 메모 |
|---|---|---|
| Splash | `358:11310` | grey/base 배경, 가운데 로고 150×34. 로고 원본 `358:11408` |
| Onboarding_User | `339:51553` | 한 장 폼: 이름, 연령대(드롭다운), 목표습관, FIUM 기기 번호. 「다음」 비활성→활성 |
| Permission | `339:51569` | 블루투스 / 신체 활동(동작 센서) / 저장소. 「설정하기」 |
| Home | `339:51656` | 상단 로고+`DAY 02 / 04`, 상태 카드(Today's Habit + Current FIUM), Watering 카드, 바텀 내비 3탭 |
| Home 연결 상태 7종 | `209:1453` | 연결하기 / 연결 중 / 연결 실패 / 연결됨×(활짝·조금 시듦·많이 시듦) |
| 상태 카드 배경 벡터 | `171:10894` | SVG 2 path |
| Water (기울이기) | `339:51707` | 다크 배경, "Water NN%", 파란 물 차오름, 기울기 일러스트 `Image/Tilt` |
| Water_Done | `339:51740` | 완료 문구 + 파란 「오늘 기록 남기기」 |
| Blooming | `339:51729` | 대기 상태, 큰 꽃, 버튼 비활성. 배경 벡터 `239:17998` |
| Bloomed | `339:51755` | 축하 그래픽, Today's Habit + DAY, 버튼 활성 |
| GoDiary (다이어리 인트로) | `339:51842` | "8개의 질문", 「시작하기」 |
| Diary (목록) | `339:51854` | 왼쪽 소개 카드 + DAY 01~04 카드(완료됨 / 미완료 / 잠김) |
| Survey1 (Q1~Q3) | `339:51826` | Q3는 1~5 척도 + "기억나지 않음" |
| Survey2_Yes (Q4~Q7) | `339:51809` | Q4=예 분기: Q5 다중선택+기타, Q6/Q7 바로·나중에 |
| Survey2_No (Q4~Q5) | `339:51768` | Q4=아니오 분기: 미수행 이유 |
| Survey3 (Q8) | `339:51783` | 자유 서술, 「저장하기」 |
| Survey_Review / Edit | `339:51874` 등 | 읽기 전용 + 우상단 「수정」/「저장」 |
| Setting | `339:51601` | 프로필 정보, 활동 데이터 내보내기(저장), 관리자에게 알리기 |
| 컴포넌트 | 바텀 내비 `171:10445`, 탑 내비 `227:11909`, 로고 `171:10758`, 버튼 Large `239:18999`, 연결 버튼 `206:708`, 칩 `204:519`, 인풋 `261:38522`, 설문 버튼류 `324:44214` `324:44318` `324:44364` | |

## 구조 변경 요약 (현재 코드 → 피그마)

- 탭 5개(홈/물주기/오늘/월간/설정) → **3개(다이어리/홈/설정)**. `app/(tabs)/water.tsx`, `diary.tsx`, `calendar.tsx`는 탭에서 빠짐.
- 물주기: 홈 Watering 카드 → 전체 화면 스택 플로우 `water` → `water-done` → `blooming` → `bloomed`. 기존 `src/water/`(센서·찰랑임·붓기 로직)는 재사용, 비주얼만 교체.
- 다이어리: 4일 카드 그리드 → 인트로 → 설문 3페이지 → 리뷰/수정.
- 온보딩: `onboarding/index`(시작) 제거, `register`+`habit` 통합, `permissions` 유지(문구·아이콘 교체).
- 설정: 피그마 레이아웃으로 교체, 「관리자에게 알리기」 노출.

## 데이터 모델 변경 (설문)

`DiaryEntry`를 아래 8문항으로 교체. CSV·시트(`docs/apps-script.gs`) 컬럼도 함께 갱신.

| 키 | 문항 | 타입 |
|---|---|---|
| q1_noticedPetal | 오늘 FIUM의 꽃잎 상태 변화를 알아차린 적 | yes/no |
| q2_recalledHabit | FIUM을 보면서 목표 행동이 떠오른 적 | yes/no |
| q3_petalStateWhenRecalled | 떠올랐을 때 꽃잎 상태 | 1~5 또는 `unknown` |
| q4_didHabit | 오늘 목표 행동 수행 | yes/no |
| q5_influences | (예) 시작에 영향 준 것 | 다중: pium, routine, alarm, others, self, other(텍스트) |
| q5_reasons | (아니오) 미수행 이유 | 다중: forgot, noTime, schedule, hard, tired, unnecessary, other(텍스트) |
| q6_startDelay | 떠오른 후 시작까지 | immediately / later |
| q7_waterDelay | 완료 후 물주기까지 | immediately / later |
| q8_freeText | 자유 서술 | string |

기존 `wiltAtWater`(물 줄 때 시든 정도)는 물주기 이벤트 쪽(`WaterEvent`)에 그대로 남긴다.

## 아현이 전달할 에셋 (아직 안 받음)

- 꽃 일러스트 PNG **3x**: 홈 상태 이미지(연결 전 흩어진 꽃잎, 연결 중, 활짝, 조금 시듦, 많이 시듦), Blooming 큰 꽃, GoDiary 꽃, Diary 소개 카드 꽃, 설문 Q3 양끝 꽃 2장
  - 없으면 피그마에서 받아지는 2x로 먼저 깔고 나중에 교체
- 로고 심볼 SVG (현재 FIUM 옆 24×24 회색 placeholder)
- 전달 위치: `assets/figma/` 에 넣어두면 에이전트가 `assets/images/`, `assets/icons/`로 정리

## 작업 순서 (제안)

1. 토큰·폰트: `src/theme/colors.ts` 재정의, `src/theme/typography.ts` 추가, `expo-font` 로 Pretendard 로드(런타임 `useFonts` 또는 `expo-font` config plugin — plugin은 네이티브 재빌드 필요)
2. 공통 컴포넌트: Button(Large/알약/설문), Chip, Input(드롭다운 포함), TopNav(로고+DAY / 뒤로가기+제목), BottomNav(3탭, SVG 아이콘), Card 배경 벡터
3. 온보딩 2화면 → 홈 → 물주기 플로우 4화면 → 다이어리(목록·인트로·설문·리뷰) → 설정
4. 데이터 모델·CSV·Apps Script 갱신
5. `tsc`, `expo lint`, 폰에서 확인(Expo Go로 화면 확인 가능, BLE는 개발 빌드)
