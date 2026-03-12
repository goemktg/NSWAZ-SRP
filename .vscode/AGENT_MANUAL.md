# AI Agent 운영 매뉴얼

이 문서는 AI 에이전트(VS Code Copilot 등)가 이 프로젝트에서 **자율적으로 작업**할 때
따라야 할 절차와 규칙을 정의합니다.

> **중요**: 이 매뉴얼은 `.github/copilot-instructions.md`와 함께 사용됩니다.
>
> - **코딩 가이드라인**: `.github/copilot-instructions.md`
> - **프로젝트 운영 절차**: 이 문서 (AGENT_MANUAL.md)
> - **프로젝트별 세부사항**: `PROJECT.md`

---

## 1. 에이전트 도구 개요

### 1.1 도구 우선순위

| 우선순위 | 방법 | 사용 시기 |
| --------- | ------ | ---------- |
| 1 | **MCP Tools** | 기본 - 실시간 통합 |
| 2 | **Direct Actions** | 파일 생성/수정 등 기본 작업 |
| 3 | **User Consultation** | 불명확한 요구사항 확인 |

### 1.2 필수 MCP 도구

| 도구 | 용도 | 사용 예시 |
| ------ | ------ | ---------- |
| `mcp_memory_store_memory` | 관찰/메모 저장 | 작업 진행 상황, 에러 기록 |
| `mcp_memory_search` | 이전 컨텍스트 조회 | 유사한 과거 작업 참고 |
| `mcp_memory_list` | 저장된 메모리 목록 | 전체 작업 히스토리 확인 |
| `mcp_context7_*` | 라이브러리 문서 조회 | 외부 API 사용법 확인 |
| `mcp_sequentialthinking` | 복잡한 추론 | 다단계 문제 해결 |

### 1.3 표준 VS Code 도구

- `semantic_search`: 코드베이스 검색
- `read_file`: 파일 읽기
- `create_file`: 파일 생성
- `replace_string_in_file`: 파일 수정
- `run_in_terminal`: 명령 실행
- `runSubagent`: 전문 에이전트 호출

---

## 2. 작업 절차 (General Workflow)

### 2.1 표준 개발 루틴

```text
1. 컨텍스트 수집
   ↓
2. 작업 계획
   ↓
3. 구현
   ↓
4. 검증
   ↓
5. 문서화
   ↓
6. 메모리 저장
```

### 2.2 단계별 상세 절차

#### Step 1: 컨텍스트 수집 (필수)

**모든 작업 전에 반드시 프로젝트 상태를 확인합니다.**

1. **프로젝트 문서 확인**:
   - `documents/PROJECT.md` - 프로젝트 개요 및 현재 상태
   - `AGENTS.md` - 사용 가능한 에이전트 목록
   - `.github/copilot-instructions.md` - 코딩 가이드라인

2. **Memory MCP 조회**:

   ```python
   # 프로젝트 관련 이전 작업 검색
   mcp_memory_search(query="relevant keyword")
   
   # 특정 태그로 필터링
   mcp_memory_list(tags=["issue", "note"])
   ```

3. **관련 파일 검색**:

   ```python
   # 의미론적 검색
   semantic_search(query="similar functionality")
   
   # 파일 패턴 검색
   file_search(query="**/*.xml")
   ```

#### Step 2: 작업 계획

복잡한 작업의 경우 `manage_todo_list` 사용:

```python
manage_todo_list(todoList=[
    {"id": 1, "title": "Research phase", "status": "in-progress"},
    {"id": 2, "title": "Implementation", "status": "not-started"},
    {"id": 3, "title": "Validation", "status": "not-started"},
    {"id": 4, "title": "Documentation", "status": "not-started"}
])
```

#### Step 3: 구현

**프로젝트별 구현 가이드는 `PROJECT.md` 참조**

일반 원칙:

- 템플릿 활용 (`documents/templates/`)
- 기존 코드 패턴 따르기
- 점진적 변경 (작은 단위로 커밋)

#### Step 4: 검증

1. **자동 검증**:
   - 문법 체크 (`get_errors`)
   - 린터 실행 (프로젝트별 설정)
   - 테스트 실행 (가능한 경우)

2. **전문 에이전트 활용**:

   ```python
   # 코드 품질 검토
   runSubagent(
       description="Code quality review",
       prompt="Review the changes for code quality..."
   )
   
   # 문서 검토
   runSubagent(
       description="Documentation review",
       prompt="Review documentation for completeness..."
   )
   ```

#### Step 5: 문서화

**Memory MCP 중심 접근** (섹션 3 참조)

- 일시적 메모: Memory MCP
- 구조화된 초안: `documents/drafts/`
- 최종 문서: `documents/final/`

#### Step 6: 메모리 저장

작업 완료 후 반드시 기록:

```python
mcp_memory_store_memory(
    content="""
    작업: [작업명]
    날짜: 2026-02-23
    
    ## 수행 내용
    - [변경사항 1]
    - [변경사항 2]
    
    ## 발견 사항
    - [중요 관찰 1]
    - [중요 관찰 2]
    
    ## 향후 작업
    - [다음 단계 1]
    """,
    tags=["work", "note", "프로젝트명"]
)
```

---

## 3. 문서화 파이프라인

### 3.1 Capture → Curate → Publish

```text
Memory MCP          documents/drafts/      documents/final/
(일시적 메모)   →   (구조화된 초안)    →    (검토된 최종본)
```

### 3.2 Memory MCP 사용 규칙

**✅ Memory MCP에 저장해야 하는 것:**

- 작업 진행 중 관찰 사항
- 에러 및 해결 방법
- 연구/조사 결과
- 향후 개선 아이디어
- 임시 메모 및 TODO

**❌ Memory MCP에 저장하지 말아야 하는 것:**

- 최종 보고서 (→ `documents/final/`)
- 템플릿 (→ `documents/templates/`)
- 코드 (→ `src/`)

### 3.3 태그 표준

| 태그 | 용도 | 예시 |
| ------ | ------ | ------ |
| `note` | 일반 메모 | 작업 진행 상황 |
| `issue` | 문제 기록 | 에러, 버그 |
| `solution` | 해결 방법 | 성공한 수정 사항 |
| `research` | 조사 결과 | 외부 문서 참고 |
| `idea` | 개선 아이디어 | 향후 작업 제안 |
| `test` | 테스트 결과 | 검증 내역 |

**복수 태그 사용 권장**: `tags=["issue", "solution", "xml-patch"]`

---

## 4. 안전 규칙 (Safety Rules)

### 4.1 보호된 파일

다음 파일은 **절대 삭제하거나 덮어쓰면 안 됩니다**:

- `.github/copilot-instructions.md` - 코딩 가이드라인
- `documents/PROJECT.md` - 프로젝트 개요
- `documents/AGENT_MANUAL.md` - 이 문서
- `AGENTS.md` - 에이전트 목록
- 기타 프로젝트별 중요 파일 (`PROJECT.md` 참조)

### 4.2 금지 행동

1. ❌ `documents/`에 임시 메모 파일 생성 → ✅ Memory MCP 사용
2. ❌ `*.memory.md` 파일 생성 → ✅ Memory MCP 사용
3. ❌ 기존 파일 덮어쓰기 → ✅ 아카이브 후 수정
4. ❌ 에러 발생 시 즉시 재시도 → ✅ 원인 분석 후 Memory MCP 기록
5. ❌ 사용자 확인 없이 중요 파일 삭제 → ✅ `archive/` 이동

### 4.3 허용 행동

1. ✅ Memory MCP에 관찰 내용 저장
2. ✅ `documents/drafts/`에 초안 작성
3. ✅ `temp/`에 임시 파일 생성 (gitignored)
4. ✅ 전문 에이전트 호출 (`runSubagent`)
5. ✅ Sequential Thinking MCP로 복잡한 문제 분석

---

## 5. 파일 규칙 (File Conventions)

### 5.1 디렉토리 구조

```text
documents/
├── PROJECT.md          # 🔴 보호됨 - 프로젝트 개요
├── AGENT_MANUAL.md     # 🔴 보호됨 - 에이전트 매뉴얼
├── final/              # 🟢 최종 문서 (Published)
│   └── <TOPIC>_FINAL.md
├── drafts/             # 🟡 초안 (Drafts)
│   └── <TOPIC>_DRAFT.md
├── reference/          # 🔵 참고 자료
│   ├── papers/         # 논문 요약
│   └── technical/      # 기술 문서
└── templates/          # ⚪ 템플릿
    └── REPORT_TEMPLATE.md
```

**프로젝트별 구조는 `PROJECT.md` 참조**

### 5.2 파일 명명 규칙

- **날짜 포함**: `YYYY-MM-DD_<description>.<ext>`
- **명확한 이름**: 내용을 추론 가능하게
- **소문자 + 하이픈**: `my-feature-analysis.md`

### 5.3 레거시 코드 관리

```text
src/
├── current/            # 현재 사용 중인 코드
└── archive/            # 이전 버전 (삭제 금지)
    └── <phase>/
```

**삭제 대신 아카이브**: 가치 있는 히스토리 보존

---

## 6. 에러 처리 절차

### 6.1 에러 발생 시 프로세스

```text
1. 에러 발생
   ↓
2. Memory MCP에 기록 (tag: issue)
   ↓
3. Sequential Thinking MCP로 분석
   ↓
4. 해결 방법 도출
   ↓
5. Memory MCP에 해결책 기록 (tag: solution)
   ↓
6. 수정 적용
   ↓
7. 검증
```

### 6.2 에러 기록 템플릿

```python
mcp_memory_store_memory(
    content="""
    ## 에러 발생
    
    **날짜**: 2026-02-23
    **작업**: [작업명]
    **에러 메시지**: 
    ```
    [에러 로그]
    ```
    
    ## 분석
    - 원인: [추정 원인]
    - 컨텍스트: [발생 상황]
    
    ## 시도한 해결책
    1. [방법 1] - 실패 (이유)
    2. [방법 2] - 성공
    
    ## 최종 해결
    [성공한 방법 상세]
    
    ## 학습 내용
    - [향후 주의사항]
    - [재발 방지 방법]
    """,
    tags=["issue", "solution", "error-type"]
)
```

### 6.3 일반적인 에러 대응

프로젝트별 에러 유형은 `PROJECT.md` 참조

**공통 원칙**:

1. 즉시 재시도 금지 - 원인 분석 우선
2. Memory MCP에 반드시 기록
3. 패턴 인식 - 유사 에러 검색
4. 사용자 보고 - 해결 불가 시

---

## 7. 에이전트 호출 규칙

### 7.1 사용 가능한 에이전트

전체 목록은 `AGENTS.md` 참조

**일반적으로 사용되는 에이전트**:

- `@doc-writer`: 문서 작성
- `@doc-reviewer`: 문서 검토
- `@code-quality-reviewer`: 코드 품질 검사
- `@research-*`: 연구/조사 (다중 관점)
- `@validator`: 검증
- `@architect`: 아키텍처 설계

### 7.2 호출 예시

```python
# 단일 에이전트
runSubagent(
    description="Documentation review",
    prompt="Review the draft in documents/drafts/FEATURE_ANALYSIS.md"
)

# 다중 관점 연구 (병렬)
# 각각 독립적으로 호출
runSubagent(description="Research-GPT", prompt="...")
runSubagent(description="Research-Gemini", prompt="...")
runSubagent(description="Research-Claude", prompt="...")
```

### 7.3 에이전트 선택 기준

| 작업 유형 | 추천 에이전트 | 이유 |
| ----------- | -------------- | ------ |
| 복잡한 문제 해결 | `@fixer` | 자율 진단 및 실행 |
| 문서화 | `@doc-writer` | 표준 형식 준수 |
| 연구 | `@research-*` | 다중 관점 |
| 계획 | `@planner-*` | 리소스 최적화 |
| 검증 | `@validator` | 정확성 확인 |

---

## 8. 체크리스트

### 8.1 작업 시작 전

- [ ] `documents/PROJECT.md` 확인
- [ ] Memory MCP에서 관련 작업 검색
- [ ] 기존 코드/파일 패턴 확인
- [ ] 템플릿 존재 여부 확인 (`documents/templates/`)
- [ ] 복잡한 작업은 `manage_todo_list` 생성

### 8.2 작업 중

- [ ] 점진적 변경 (작은 단위)
- [ ] 중요한 관찰은 즉시 Memory MCP 기록
- [ ] 에러 발생 시 즉시 기록 (tag: issue)
- [ ] 불명확한 사항은 사용자에게 확인

### 8.3 작업 완료 후

- [ ] 코드/파일 검증 완료
- [ ] Memory MCP에 작업 요약 저장
- [ ] 필요시 `documents/drafts/` 작성
- [ ] Todo 리스트 업데이트 (사용 중인 경우)
- [ ] 사용자에게 간단한 요약 보고

### 8.4 주기적 점검

- [ ] Memory MCP 품질 확인 (`mcp_memory_quality`)
- [ ] 오래된 메모리 정리 (선택)
- [ ] 초안 문서 최종화 (검토 후)
- [ ] `temp/` 디렉토리 정리

---

## 9. 보고 형식

작업 완료 시 다음 형식으로 요약:

```markdown
✅ [작업명] 완료

**변경 사항**:
- 파일 추가: [파일명]
- 파일 수정: [파일명]

**검증 완료**:
- [검증 항목 1]
- [검증 항목 2]

**메모리 저장**:
- Tags: [tag1, tag2]
- 내용: [간단한 요약]

**다음 단계**:
- [권장 사항 or 후속 작업]
```

---

## 10. 참고 문서

### 프로젝트 문서

- [`documents/PROJECT.md`](PROJECT.md) - **프로젝트별 세부사항** (필수)
- [`AGENTS.md`](../AGENTS.md) - 에이전트 목록 및 사용법
- [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) - 코딩 가이드라인

### 외부 리소스

- [Agent Skills Specification](https://agentskills.io/specification)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

---

**최종 업데이트**: 2026-02-23
