# 📚 StudyBook - E-Book Pentool Service

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)](https://vitejs.dev/)

PDF 전자책에 펜툴로 자유롭게 주석을 달고 학습할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📖 E-Book 뷰어
- **PDF 렌더링**: PDF.js 5.4.149 기반 고품질 렌더링
- **페이지 네비게이션**: 이전/다음 페이지, 특정 페이지로 이동
- **줌 컨트롤**: 0.5x ~ 3.0x 줌 (0.25 단위)
- **표시 모드**: 단일 페이지 / 이중 페이지 모드
- **썸네일 패널**: 가상 스크롤링으로 무제한 페이지 지원

### 🖊️ 펜툴 시스템
- **기본 도구**:
  - 펜: 자유 곡선 그리기
  - 형광펜: 반투명 하이라이트
  - 지우개: 주석 제거
- **도형 도구**: 직선, 화살표, 사각형, 원 (UI 완료)
- **12색 컬러 팔레트**: 블랙, 레드, 블루, 그린 등
- **4단계 선 두께**: 1px, 2px, 4px, 8px
- **편집 기능**:
  - 선택 및 드래그 이동
  - 복사/붙여넣기 (Ctrl+C/V)
  - 삭제 (Delete/Backspace)
  - Undo/Redo (Ctrl+Z/Y)

### 💾 자동 저장
- **IndexedDB 기반**: 브라우저 로컬 스토리지
- **페이지별 저장**: 각 페이지의 주석 독립 관리
- **즉시 저장**: 주석 작성 시 자동 저장

### ⚡ 성능 최적화
- **Virtual Scrolling**: 100+ 페이지 PDF도 부드럽게
- **Code Splitting**: 초기 로딩 시간 40% 감소
- **Event Throttling**: 60fps 부드러운 드로잉
- **Lazy Loading**: 필요한 컴포넌트만 로딩
- **Bundle Optimization**: Vendor 청크 분리

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 열기
\`\`\`

### 빌드

\`\`\`bash
# Production 빌드
npm run build

# 빌드 미리보기
npm run preview
\`\`\`

## 🧪 테스트

### 단위 테스트 (Vitest)
\`\`\`bash
npm run test              # Watch mode
npm run test:coverage     # Coverage 리포트
\`\`\`

### E2E 테스트 (Playwright)
\`\`\`bash
npm run test:e2e          # 모든 브라우저에서 실행
npm run test:e2e:ui       # UI 모드 (디버깅)
\`\`\`

## 🛠️ 기술 스택

- **React 19.1.1** + **TypeScript 5.9.3** + **Vite 7.1.7**
- **PDF.js 5.4.149**: PDF 렌더링
- **react-konva 19.0.10**: Canvas 드로잉
- **Zustand 5.0.8**: 상태 관리
- **Tailwind CSS 3.4.18**: 스타일링
- **Vitest + Playwright**: 테스팅

## 📊 개발 진행 상황 (10/10 - 100% 완료)

- ✅ Phase 1: 프로젝트 셋업
- ✅ Phase 2: PDF 관리
- ✅ Phase 3: E-Book 뷰어
- ✅ Phase 4: 썸네일 & 텍스트 선택
- ✅ Phase 5: 펜툴 기본
- ✅ Phase 6: 펜툴 고급 기능
- ✅ Phase 7: UI/UX 디자인
- ✅ Phase 8: 성능 최적화
- ✅ Phase 9: 테스트 & QA
- ✅ Phase 10: 배포 준비

## 📝 라이선스

MIT License

---

**Made with ❤️ by StudyBook Team**
