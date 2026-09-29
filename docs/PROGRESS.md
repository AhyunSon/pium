# 진행 기록

## 2026-09-29 (1일차)

### 결정
- 스택: Expo SDK 57 (React Native 0.86), Expo Router, TypeScript
- 저장: 폰 로컬(AsyncStorage)이 원본, 매 기록마다 로컬 CSV 갱신, 구글 시트는 온라인일 때 미러
- 물주기 효과: 동작 센서 + Skia + Reanimated (물주기 화면에만)
- BLE 라이브러리: `@sfourdrinier/react-native-ble-plx` (SDK 57 지원 포크). Expo Go에서는 자동으로 가상 화분(mock)
- 관리자 SOS는 설정 맨 아래 「피움 · P…」 길게 누르기로 숨김

### 완료
- 전체 화면: 스플래시 → 온보딩(시작·등록·습관·권한) → 홈 / 물주기 / 오늘 / 월간 / 설정 → 개화 확인 → 관리자
- 데이터 층: 프로필, 물주기 이벤트, 일일 기록, 설정, 시트 전송 큐 (`src/data/`)
- CSV 내보내기(공유 시트), 구글 Apps Script 수신 코드 (`docs/apps-script.gs`)
- BLE 클라이언트: Portenta C33 UUID/명령/상태 문자열 해석, 스캔→연결→notify, `RESET` 후 `WATER_POS` 대기 (`src/ble/`)
- 물주기: 기울기(roll) → 붓기 세기 → 수위 상승, 스프링 기반 찰랑임, 진동 틱, 완료 시 RESET·기록·개화 화면 (`src/water/`)
- 검증: `tsc`, `expo lint`, `expo-doctor` 21/21, Android 번들 export 통과
- GitHub 비공개 레포 생성·push: https://github.com/AhyunSon/pium
- 개발 환경(PC): GitHub CLI, JDK 17 (`C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot`), Android SDK (`%LOCALAPPDATA%\Android\Sdk`, platform 36, build-tools 36/35, NDK 27.1). `ANDROID_HOME`, `JAVA_HOME`, Path 사용자 환경변수 설정됨
- 폰(Samsung, `R3CY1062BVB`)에 **개발 빌드 APK 설치 완료** (`com.pium.app`). 실제 BLE 모듈 포함

### 다음에 폰 테스트 시작하는 법
```powershell
cd C:\Users\sah74\pium
adb reverse tcp:8081 tcp:8081     # USB로 Metro 연결
npx expo start --dev-client       # 그 다음 폰에서 「피움」 앱 실행
```
- 새 터미널이면 환경변수는 이미 등록돼 있어 바로 `adb` 사용 가능
- 네이티브 의존성(BLE, Skia 등)을 바꾸지 않았다면 APK 재빌드 불필요. JS만 바뀌면 Metro가 바로 반영
- 네이티브를 바꿨을 때만: `npx expo run:android` (Gradle 캐시 오류가 나면 `cd android; .\gradlew.bat app:assembleDebug --no-build-cache` 후 `adb install -r app\build\outputs\apk\debug\app-debug.apk`)

### 확인 대기 (폰에서 볼 것)
- [ ] 첫 실행 시 블루투스(근처 기기) 권한 허용 → 홈 「연결」로 `C33_FLOWER_1` 연결되는지
- [ ] 물주기 화면에서 물 표면이 기울인 방향과 맞는지 (반대면 `src/water/useTilt.ts`의 `TILT_SIGN` 뒤집기)
- [ ] 붓기 시작 각도·가득 차는 시간 감각 (`src/water/usePour.ts` 상단 상수)
- [ ] 가득 차면 화분이 실제로 개화하는지, 관리자 화면에 `WATER_POS:n`이 찍히는지
- [ ] 오늘 기록 저장 → 월간 캘린더 표시 → 설정에서 CSV 내보내기
- [ ] iOS는 아직 미확인 (Mac 필요)

### 알려진 사항
- Expo Go에서는 BLE가 없어 가상 화분으로 동작 (홈 카드에 문구 표시). 실제 연결은 개발 빌드에서만
- 첫 Gradle 빌드에서 `--build-cache` 쓰기 오류(AccessDenied)가 한 번 났고, `--no-build-cache`로 성공
- `android/` 폴더는 생성물(gitignore). 설정은 `app.json`으로만
