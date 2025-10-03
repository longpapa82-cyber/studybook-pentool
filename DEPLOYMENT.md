# 🚀 StudyBook Deployment Guide

StudyBook을 프로덕션 환경에 배포하는 방법을 안내합니다.

## 📋 목차
1. [사전 준비](#사전-준비)
2. [Vercel 배포](#vercel-배포)
3. [Netlify 배포](#netlify-배포)
4. [GitHub Pages 배포](#github-pages-배포)
5. [환경 변수 설정](#환경-변수-설정)
6. [CI/CD 파이프라인](#cicd-파이프라인)
7. [트러블슈팅](#트러블슈팅)

---

## 사전 준비

### 1. Production 빌드 테스트
```bash
# 빌드 실행
npm run build

# 빌드 미리보기
npm run preview

# 테스트 실행
npm run test
npm run test:e2e
```

### 2. 환경 변수 확인
`.env.example` 파일을 참고하여 필요한 환경 변수를 설정합니다.

```bash
# .env.example를 .env로 복사
cp .env.example .env

# 필요한 값 수정
nano .env
```

### 3. 의존성 최종 확인
```bash
# 의존성 재설치 (clean install)
rm -rf node_modules package-lock.json
npm install

# 보안 취약점 확인
npm audit

# 고위험 취약점 수정
npm audit fix
```

---

## Vercel 배포

### 방법 1: Vercel CLI 사용

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. 로그인
```bash
vercel login
```

#### 3. 프로젝트 배포
```bash
# 첫 배포 (설정 대화형)
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동 (권장)

#### 1. GitHub Repository에 Push
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Vercel Dashboard에서 Import
1. https://vercel.com 접속
2. "Add New Project" 클릭
3. GitHub repository 선택
4. Framework Preset: **Vite** 자동 감지
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. "Deploy" 클릭

#### 3. 환경 변수 설정
Vercel Dashboard > Project Settings > Environment Variables에서 추가:
- `VITE_APP_NAME=StudyBook`
- `VITE_APP_VERSION=1.0.0`
- 기타 필요한 환경 변수

#### 4. 자동 배포 설정
- `main` 브랜치 push 시 자동 배포
- Preview 배포: Pull Request마다 자동 생성

### Vercel 설정 파일 (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

---

## Netlify 배포

### 방법 1: Netlify CLI 사용

#### 1. Netlify CLI 설치
```bash
npm install -g netlify-cli
```

#### 2. 로그인
```bash
netlify login
```

#### 3. 프로젝트 초기화 및 배포
```bash
# 초기화
netlify init

# 빌드 및 배포
netlify deploy --prod
```

### 방법 2: GitHub 연동

#### 1. Netlify Dashboard에서 Import
1. https://app.netlify.com 접속
2. "Add new site" > "Import an existing project" 클릭
3. GitHub repository 선택
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. "Deploy site" 클릭

#### 2. 환경 변수 설정
Site settings > Build & deploy > Environment variables에서 추가

### Netlify 설정 파일 (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## GitHub Pages 배포

### 1. `vite.config.ts` 수정
```typescript
export default defineConfig({
  base: '/studybook-pentool/', // repository 이름
  // ... 나머지 설정
});
```

### 2. GitHub Actions Workflow 생성
`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v1
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v1
```

### 3. GitHub Pages 설정
Repository Settings > Pages:
- Source: GitHub Actions 선택

---

## 환경 변수 설정

### Development (.env.development)
```env
VITE_APP_NAME=StudyBook (Dev)
VITE_ENABLE_DEBUG_MODE=true
```

### Production (.env.production)
```env
VITE_APP_NAME=StudyBook
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
```

### 중요: .env 파일 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 포함되어 있는지 확인
- 배포 플랫폼에서 환경 변수를 직접 설정

---

## CI/CD 파이프라인

### GitHub Actions (권장)
`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm run test run

      - name: Build
        run: npm run build

      - name: E2E tests
        run: |
          npx playwright install --with-deps
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### 배포 자동화
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build

      # Vercel 배포 예시
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 성능 최적화 체크리스트

### 빌드 최적화
- [x] Code splitting 적용
- [x] Vendor chunk 분리
- [x] Tree shaking 활성화
- [x] Minification (terser)
- [x] Production 모드에서 console.log 제거

### 런타임 최적화
- [x] Virtual scrolling (react-window)
- [x] Lazy loading (React.lazy)
- [x] Event throttling (60fps)
- [x] Canvas 최적화
- [x] IndexedDB 비동기 처리

### CDN 활용
```html
<!-- PDF.js Worker는 CDN 사용 권장 -->
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs"></script>
```

---

## 모니터링 및 분석

### 성능 모니터링
- **Lighthouse CI**: 배포 시 자동 성능 측정
- **Web Vitals**: Core Web Vitals 추적
- **Vercel Analytics**: 실시간 사용자 경험 추적

### 에러 트래킹 (Optional)
- **Sentry**: 런타임 에러 모니터링
- **LogRocket**: 세션 리플레이

---

## 트러블슈팅

### 1. 빌드 실패
```bash
# 캐시 삭제 후 재시도
rm -rf node_modules .vite dist
npm install
npm run build
```

### 2. PDF.js Worker 오류
환경 변수 확인:
```env
VITE_PDFJS_WORKER_SRC=https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs
```

### 3. SPA Routing 404 오류
**Vercel**: 자동 처리됨
**Netlify**: `netlify.toml` 리다이렉트 규칙 추가 필요
**GitHub Pages**: `404.html` → `index.html` 복사 필요

### 4. 메모리 부족 (대용량 PDF)
`vite.config.ts`에서 chunk 크기 조정:
```typescript
build: {
  chunkSizeWarningLimit: 1000,
}
```

### 5. IndexedDB Quota 초과
브라우저 저장소 한계:
- Chrome: ~6GB (디스크의 60%)
- Firefox: ~10GB
- Safari: ~1GB

사용자에게 저장 공간 정리 안내

---

## 보안 체크리스트

- [ ] HTTPS 강제 사용
- [ ] CSP (Content Security Policy) 설정
- [ ] XSS 방지 (React가 기본 제공)
- [ ] 의존성 취약점 정기 점검 (`npm audit`)
- [ ] 환경 변수 안전하게 관리
- [ ] API 키는 서버 사이드에서만 사용

---

## 배포 후 확인사항

### 기능 테스트
1. PDF 업로드 → 정상 렌더링
2. 펜툴 그리기 → 저장 → 새로고침 → 복원
3. 썸네일 패널 → 페이지 이동
4. 줌 인/아웃 → 부드러운 동작
5. 반응형 디자인 → 모바일 테스트

### 성능 측정
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --url=https://your-domain.com
```

**목표 지표**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## 롤백 전략

### Vercel
- Deployments 탭에서 이전 배포 선택 → "Promote to Production"

### Netlify
- Deploys 탭에서 이전 배포 선택 → "Publish deploy"

### GitHub Pages
```bash
git revert HEAD
git push origin main
```

---

## 추가 리소스

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

**배포 성공을 기원합니다! 🚀**
