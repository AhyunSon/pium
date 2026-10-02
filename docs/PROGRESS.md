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

## 2026-09-30 (2일차)

### 완료
- 폰에서 앱 재실행 확인 (Metro dev-client + `adb reverse`)
- 하단 탭바가 안드로이드 시스템 바(제스처/3버튼)와 겹치던 문제 수정: `app/(tabs)/_layout.tsx`에서 `useSafeAreaInsets()`로 기기별 하단 여백을 읽어 탭바 높이에 더함
- 탭 없는 화면(온보딩·개화·관리자)에 `Screen`의 `safeBottom` 옵션 추가 → 하단 버튼이 시스템 바에 안 가려짐
- 작은 화면 대비: 홈을 스크롤 가능하게, 물주기 물 영역 최소 높이 260→160

### 아이콘 적용 방식(결정 대기)
- 피그마 M3 키트 아이콘은 SVG로 내보내 `react-native-svg`로 그대로 렌더링(권장) 또는 Material Icons 이름으로 불러오기

## 2026-10-02 (3일차)

### 완료
- 9/30 수정분 커밋·push
- 피그마 디자인 전체 검토(16개 화면 + 컴포넌트), 적용 계획과 결정 사항을 **`docs/DESIGN.md`** 에 정리
- Pretendard OTF 5종 `assets/fonts/`에 추가 (아직 코드에 로드하진 않음)

### 다음 세션에서 할 일 (노트북)
- `docs/DESIGN.md` 를 읽고 "작업 순서" 1번(토큰·폰트)부터 진행
- Cursor에 Figma MCP 플러그인이 있어야 피그마에서 직접 읽어올 수 있음
- 아현이 꽃 PNG 3x·로고 SVG를 `assets/figma/`에 넣어주면 반영

## 다른 컴퓨터(노트북)에서 이어서 작업하기

### 1. 필수 설치
- Git, Node.js LTS(20 이상), GitHub 로그인(`gh auth login` 또는 Git 자격 증명)
- Cursor(또는 VS Code)

### 2. 프로젝트 받기
```powershell
git clone https://github.com/AhyunSon/pium.git
cd pium
npm install --legacy-peer-deps     # react-dom 피어 충돌 때문에 이 옵션 필요
npx expo-doctor                    # 21/21 나오면 정상
```

### 3. 화면만 볼 때 (가장 빠름, BLE는 가상 화분)
```powershell
npx expo start
```
폰에 Expo Go 설치 후 QR 스캔. 같은 Wi-Fi여야 함.

### 4. 실제 BLE까지 테스트할 때
개발 빌드 APK(`com.pium.app`)가 폰에 이미 설치돼 있으므로 **노트북에 Android SDK를 깔지 않아도 됨**.
```powershell
adb reverse tcp:8081 tcp:8081      # adb는 platform-tools만 받으면 됨
npx expo start --dev-client
```
그 다음 폰에서 「피움」 앱 실행. 네이티브 의존성을 바꿔서 APK를 다시 만들어야 할 때만 JDK 17 + Android SDK가 필요(위 1일차 메모 참고)하거나, 그 대신 클라우드 빌드 `npx eas-cli@latest build --profile development --platform android`를 쓰면 됨.

### 5. 작업 끝낼 때
```powershell
git add -A; git commit -m "메시지"; git push
```
다른 컴퓨터에서 시작할 때는 먼저 `git pull`.

### 알려진 사항
- Expo Go에서는 BLE가 없어 가상 화분으로 동작 (홈 카드에 문구 표시). 실제 연결은 개발 빌드에서만
- 첫 Gradle 빌드에서 `--build-cache` 쓰기 오류(AccessDenied)가 한 번 났고, `--no-build-cache`로 성공
- `android/` 폴더는 생성물(gitignore). 설정은 `app.json`으로만
