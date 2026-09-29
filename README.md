# 피움 Pium

튤립 화분 로봇(Arduino Portenta C33)과 짝을 이루는 연구용 모바일 앱. Expo (React Native), Android/iOS.

앱은 주인공이 아닙니다. 물을 주는 순간에만 앞에 나오고, 알림을 보내지 않으며, 화면에서 꽃을 크게 보여 주지 않습니다.

## 실행

```bash
npm start            # Expo Go로 화면 확인 (블루투스는 가상 화분으로 동작)
npx expo run:android # 실제 블루투스가 필요한 개발 빌드 (Android)
npx expo run:ios     # macOS + Xcode 필요
```

Expo Go에는 BLE 네이티브 모듈이 없어 자동으로 **가상 화분(mock)** 으로 돌아갑니다. 홈 화면 하단에 "Expo Go: 가상 화분으로 동작 중"이 보이면 그 상태입니다. 실제 화분과 연결하려면 개발 빌드가 필요합니다 (`npx expo run:android` 또는 `eas build --profile development`).

검사:

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## 화면

| 경로 | 화면 |
| --- | --- |
| `app/index.tsx` | 스플래시. 등록 여부에 따라 온보딩/홈으로 |
| `app/onboarding/` | 시작 → 사용자 등록(이름·성별·연령대) → 목표 습관 → 권한(동작 센서·블루투스) |
| `app/(tabs)/home.tsx` | 오늘의 행동 한 줄, 화분 연결 상태, 실패 시 가이드 |
| `app/(tabs)/water.tsx` | 물주기. 폰을 옆으로 기울이면 물이 흐르고 찰랑임, 붓는 동안 진동, 가득 차면 로봇에 `RESET` |
| `app/bloom.tsx` | 물주기 직후 확인 화면. 시든 정도(WATER_POS) 표시 |
| `app/(tabs)/diary.tsx` | 오늘 기록: 행동 여부, 시작 시각, 시작 계기, 물 줄 때 꽃의 시든 정도, 메모 |
| `app/(tabs)/calendar.tsx` | 월간 캘린더. 실험 4일 강조, 날짜별 물주기·기록 요약 |
| `app/(tabs)/settings.tsx` | 사용자 정보 수정, CSV 내보내기. 맨 아래 「피움」을 **길게 누르면** 관리자 화면 |
| `app/sos.tsx` | 관리자: 비상 연락, 구글 시트 URL, 화분 테스트 명령(RESET/TEST/MOVEPOS/SETPOS), 기록 초기화 |

## 데이터

- 원본은 폰(AsyncStorage). 물주기·기록마다 `Documents/pium-latest.csv`도 갱신됩니다.
- 설정 또는 관리자 화면에서 **CSV 내보내기**로 4일치 기록을 한 번에 받습니다.
- 구글 시트 실시간 미러: `docs/apps-script.gs`를 시트에 배포하고 `/exec` URL을 관리자 화면에 넣으면, 온라인일 때 자동 전송됩니다. 실패한 행은 큐에 남아 다음에 재전송됩니다.

## 블루투스 (Portenta C33)

`src/ble/constants.ts`에 펌웨어와 맞춘 값이 있습니다.

- 서비스 `60000000-0000-0000-0000-000000000001`
- 상태(Read/Notify) `...0002` — `"STOP POS:1234 SW:0"`, `"WATER_POS:1234"`, `"HOME OK POS:0"`, `"FAULT ..."` 등
- 명령(Write) `...0003` — `RESET`(물주기 완료), `TEST`, `SETPOS:n`, `MOVEPOS:n`
- 위치 0 = 활짝 핌, 9600 = 완전히 시듦. 앱은 이를 0~100% "시든 정도"로 씁니다.

물주기 흐름: 물이 가득 차면 `RESET` 전송 → 로봇이 `WATER_POS:n` 응답 → 기록 저장 → 로봇은 HOME으로 돌아가 꽃이 핍니다.

## 구조

- 색: `src/theme/colors.ts` (노랑 = 강조, 파랑 = 물, 회색 = 나머지)
- 공통 UI: `src/components/`
- 저장/내보내기/시트: `src/data/`
- 블루투스: `src/ble/` (`FlowerClient.ts`에 실제 BLE와 mock 둘 다)
- 물주기 물리·센서: `src/water/`

## 기기에서 맞춰 볼 것

- `src/water/useTilt.ts`의 `TILT_SIGN`: 기울인 방향과 물 표면 방향이 반대로 보이면 뒤집습니다.
- `src/water/usePour.ts`의 `POUR_START_DEG`, `FULL_POUR_MS`: 붓기 시작 각도와 가득 차는 시간.
