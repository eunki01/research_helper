# 논문 관계 시각화 앱 프로젝트 구조

## 📁 전체 폴더 구조

```
src/
├── components/           # React 컴포넌트들
│   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── library/         # 라이브러리 관련
│   │   ├── LibraryPanel.tsx
│   │   ├── SeedPaperCard.tsx
│   │   └── PaperUpload.tsx
│   ├── search/          # 검색 관련
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   └── SearchResults.tsx
│   ├── visualization/   # 시각화 관련
│   │   ├── GraphComponent.tsx (기존)
│   │   ├── GraphControls.tsx
│   │   └── NodeInfoPanel.tsx
│   ├── navigation/      # 탐색 관련
│   │   ├── PaperCarousel.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── Breadcrumb.tsx
│   └── common/          # 공통 컴포넌트
│       ├── PaperCard.tsx
│       ├── AuthorCard.tsx
│       └── LoadingSpinner.tsx
├── pages/               # 페이지 컴포넌트들
│   ├── HomePage.tsx
│   ├── LibraryPage.tsx
│   ├── SearchPage.tsx
│   └── VisualizationPage.tsx
├── hooks/               # 커스텀 훅들
│   ├── useSearch.ts
│   ├── useLibrary.ts
│   ├── useVisualization.ts
│   └── useNavigation.ts
├── services/            # API 서비스들
│   ├── api.ts
│   ├── searchService.ts
│   ├── libraryService.ts
│   └── visualizationService.ts
├── types/               # TypeScript 타입 정의
│   ├── api.ts
│   ├── paper.ts
│   ├── search.ts
│   └── visualization.ts
├── utils/               # 유틸리티 함수들
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── styles/              # 스타일 관련
│   ├── cytoscapeStyles.ts (기존)
│   ├── themes.ts
│   └── globals.css
├── context/             # React Context
│   ├── AppContext.tsx
│   ├── SearchContext.tsx
│   └── LibraryContext.tsx
└── data/                # 데이터 관련
    ├── mockData.ts (기존)
    └── samplePapers.ts
```

## 🎨 화면 구성

### 1. 메인 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ Header (검색바, 사용자 메뉴)                              │
├─────────────┬───────────────────────────┬─────────────────┤
│             │                           │                 │
│ Library     │     Main Content          │ Info Panel      │
│ Panel       │   (Graph Visualization)   │ (Seed Paper)    │
│             │                           │                 │
│ - Seed      │   [현재 그래프 화면]        │ - Paper Info    │
│   Papers    │                           │ - Author Info   │
│ - Upload    │   ← → [그래프 네비게이션]    │ - Metadata     │
│ - History   │                           │                 │
│             │                           │                 │
└─────────────┴───────────────────────────┴─────────────────┘
```

### 2. 화면 전환 플로우
```
검색 결과 → 시각화 화면 → 노드 클릭 → 새로운 시각화 화면
    ↓           ↓              ↓              ↓
SearchPage → VisualizationPage → (새로운) VisualizationPage
```

## 🔄 상태 관리

### Context 구조
- **AppContext**: 전역 앱 상태 (현재 seed paper, 검색 모드 등)
- **SearchContext**: 검색 관련 상태 (쿼리, 결과, 로딩 등)
- **LibraryContext**: 라이브러리 상태 (업로드된 papers, 선택된 papers 등)
- **VisualizationContext**: 시각화 상태 (현재 그래프, 히스토리 등)

## 📡 API 연동

### 서비스 구조
```typescript
// services/searchService.ts
export const searchService = {
  externalSearch: (query: string, limit?: number) => Promise<ExternalSearchResponse>,
  internalSearch: (query: string, limit?: number, threshold?: number) => Promise<InternalSearchResponse>
};

// services/libraryService.ts
export const libraryService = {
  uploadPaper: (file: File) => Promise<UploadResponse>,
  getLibraryPapers: () => Promise<Paper[]>,
  deletePaper: (paperId: string) => Promise<void>
};
```

## 🎯 핵심 기능 구현 순서

### Phase 1: 기본 구조
1. 프로젝트 구조 설정
2. 기본 레이아웃 컴포넌트
3. API 서비스 설정
4. 타입 정의

### Phase 2: 라이브러리 기능
1. 라이브러리 패널
2. 파일 업로드 기능
3. Seed 논문 관리

### Phase 3: 검색 기능
1. 검색바 컴포넌트
2. 내부/외부 검색 구분
3. 검색 결과 표시

### Phase 4: 시각화 확장
1. 기존 GraphComponent 개선
2. 노드 정보 패널
3. 그래프 컨트롤

### Phase 5: 탐색 기능
1. 노드 클릭 이벤트
2. 화면 전환 (Carousel)
3. 히스토리 관리

### Phase 6: 고급 기능
1. 필터링/정렬
2. 내보내기 기능
3. 성능 최적화


