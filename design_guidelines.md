# EVE Online SRP Management System - Design Guidelines

## Design Approach
**System Selected:** Material Design + Linear-inspired Dashboard Aesthetics
**Rationale:** Data-heavy administrative interface requiring efficiency, clarity, and professional presentation for managing SRP requests and approvals.

## Language
**UI Language:** Korean (한국어)
- All user-facing text, labels, buttons, and messages are in Korean
- Error messages and validation feedback in Korean
- Date/time formatting follows Korean conventions where appropriate

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts) - clean, modern, excellent for data display and Korean text support
- **Hierarchy:**
  - H1: text-3xl font-bold (페이지 제목)
  - H2: text-xl font-semibold (섹션 헤더)
  - H3: text-lg font-medium (카드 제목)
  - Body: text-base (일반 콘텐츠)
  - Small: text-sm (메타데이터, 타임스탬프)
  - Mono: font-mono text-sm (ISK 금액, 함선명, ID)

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: mx-8, my-6

**Container Structure:**
- Sidebar: w-64 fixed
- Main content: max-w-7xl with responsive padding
- Cards: rounded-lg with defined boundaries

### Component Library

**Navigation:**
- Fixed sidebar (left) with alliance branding at top
- Main sections: 대시보드, 새 요청, 내 요청, 전체 요청 (관리자), 승인/거부 (관리자), 설정
- User profile dropdown in top-right corner
- 로그아웃 and role indicator

**Dashboard Cards:**
- Stat cards: Grid layout showing 대기 중인 요청, 오늘 승인된 요청, 총 지급 ISK, 평균 처리 시간
- Recent activity feed (최근 활동)
- Quick action buttons (SRP 요청 제출, 대기열 보기)

**Request Forms:**
- Clean vertical forms with clear labels above inputs
- Required field indicators (asterisk)
- 킬메일 URL 입력 with validation
- 함선 유형 dropdown with search
- ISK 금액 field with formatting
- 증빙 자료 upload area (drag-and-drop zone)
- 손실 설명 textarea
- 제출/취소 buttons (primary/secondary)

**Request Tables:**
- Sortable columns: 날짜, 파일럿명, 함선 유형, ISK 금액, 상태
- Status badges: 대기 중 (neutral), 승인됨 (success), 거부됨 (danger), 처리 중 (info)
- Row hover states for interactivity
- Action buttons per row (상세 보기, 승인/거부 for admins)
- Pagination controls at bottom

**Request Detail View:**
- Two-column layout: Left (request info), Right (admin actions/notes)
- Killmail embed or link preview
- 파일럿 정보 card
- 손실 상세 section
- 관리자 메모/코멘트 area
- 승인/거부 form (admin only)
- Status timeline showing request lifecycle

**Modals:**
- Confirmation dialogs for approve/deny actions
- Backdrop with subtle blur
- Centered, max-w-lg containers
- Clear 확인/취소 action buttons

### Icons
**Library:** Lucide React
- Consistent outline style throughout
- Size: h-5 w-5 for inline, h-6 w-6 for buttons
- Usage: status indicators, navigation items, action buttons

### Animations
**Minimal approach:**
- Subtle fade-in for page transitions
- Smooth hover states on interactive elements
- Loading spinners for async operations
- No elaborate scroll or decorative animations

### Forms & Inputs
- Consistent border styling with focus states
- Clear error messaging below fields (Korean)
- Disabled states visually distinct
- Autocomplete for pilot names (if applicable)
- Number formatting for ISK values (commas)

### Data Display
- Consistent table styling across all views
- Responsive breakpoints: stack table on mobile
- Clear visual hierarchy in status badges
- Monospace font for numeric ISK values
- Timestamp formatting: relative time ("2시간 전") with tooltip showing exact datetime

### Security Indicators
- Role badges visible in header (관리자, FC, 멤버)
- Session timeout warnings
- Secure connection indicator
- Activity logs visible to admins

### Landing Page Theme
**EVE Online Dark Space Theme:**
- Dark space background with gradient overlays
- Official EVE SSO login button
- Nisuwa Cartel alliance logo from EVE API
- Centered hero content with Korean text

### Images
**No hero images needed** - this is a dashboard application focused on data and functionality. All visual elements should serve utility purposes (icons, status indicators, alliance logo in sidebar).

---

**Design Principle:** Prioritize clarity, speed, and trustworthiness. Every element should facilitate efficient SRP request management with minimal cognitive load. Clean, professional aesthetic that reflects the seriousness of managing alliance resources.
