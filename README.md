# Jira 웹훅 → Cursor 코딩 연동 (맥미니)

맥미니에서 Jira 웹훅을 받아 **inbox**에 마크다운 파일을 만들고,  
**Cursor**에서 해당 md와 **Confluence**를 참조해서 코딩하는 흐름입니다.

## 구조

```
Jira (이슈 생성/수정) → 웹훅 → 맥미니 이 서버 → inbox/CLEV-123.md 생성
                                                      ↓
Cursor에서 프로젝트 열기 → inbox/*.md 확인 → Confluence MCP로 문서 참조 → 코딩
```

- **md 파일**: Jira 이슈 키, 제목, 설명, 수신 시각, Confluence 링크(설명에 있으면) 포함
- **Confluence 참조**: md에 Confluence 링크가 있으면 그걸 쓰고, 없으면 Cursor에서 이슈 키워드로 Confluence 검색해서 참조

## 맥미니에서 실행

### 1. 의존성 설치

```bash
cd /Users/lee/jira-webhook-agent
npm install
```

### 2. 환경 변수 (선택)

```bash
cp .env.example .env
# 필요 시 .env 에 PORT, JIRA_BASE_URL 등 수정
```

### 3. 서버 실행

```bash
npm start
# 또는 개발 시: npm run dev
```

기본 포트: **3847**  
- 로컬만 쓰면: `http://맥미니IP:3847/webhook/jira`  
- 외부에서 접속하려면: **ngrok** 등으로 터널링 후 Jira 웹훅 URL에 등록

### 4. Jira 웹훅 등록

1. Jira **설정** → **시스템** → **Webhook** (또는 프로젝트 설정의 Webhook)
2. **Create a WebHook**
   - URL: `https://your-ngrok-url.ngrok.io/webhook/jira` (또는 `http://맥미니IP:3847/webhook/jira`)
   - 이벤트: **Issue created**, **Issue updated** 등 원하는 것 선택
3. 저장 후 이슈 생성/수정 시 `inbox/<이슈키>.md` 가 생성되는지 확인

### 5. 맥미니 상시 실행 (launchd)

```bash
# 예: ~/Library/LaunchAgents/com.jira-webhook.plist
# Label, ProgramArguments, RunAtLoad, KeepAlive 등 설정 후
launchctl load ~/Library/LaunchAgents/com.jira-webhook.plist
```

또는 **pm2** 사용:

```bash
npm install -g pm2
pm2 start src/server.js --name jira-webhook
pm2 save && pm2 startup
```

## Cursor에서 사용

1. 이 프로젝트 루트(`jira-webhook-agent`) 또는 상위 폴더를 Cursor로 연다.
2. **inbox** 폴더에 쌓인 `CLEV-123.md` 같은 파일을 연다.
3. Cursor에 **Jira / Confluence MCP**가 연결되어 있으면:
   - "이 이슈 기준으로 구현해줘" → 에이전트가 Jira 이슈 상세 조회
   - "Confluence 문서 참고해서 구현해줘" → Confluence 검색/페이지 조회 후 코딩
4. md에 Confluence 링크가 있으면 그 페이지를 우선 참조하라고 요청하면 됨.

## 정리

| 항목 | 설명 |
|------|------|
| 웹훅 URL | `POST /webhook/jira` |
| inbox | 프로젝트 내 `inbox/` 디렉터리, `<이슈키>.md` 생성 |
| Confluence | md 내 링크 또는 Cursor에서 Confluence MCP로 검색 후 참조 |

이렇게 설정하면 오픈 클로드처럼 Jira 이슈가 웹훅으로 들어오고, md는 Confluence를 참조하면서 Cursor에서 코딩할 수 있습니다.
