/**
 * Jira 웹훅 수신 서버 (맥미니 등에서 실행)
 * - POST /webhook/jira 수신 시 이슈 정보를 inbox/*.md 로 저장
 * - md 파일에는 Confluence 참조 안내 포함 (Cursor에서 Confluence MCP로 조회)
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { handleJiraWebhook } = require('./handlers/jira');

const app = express();
const PORT = process.env.PORT || 3847;
const INBOX_DIR = path.resolve(process.cwd(), 'inbox');

if (!fs.existsSync(INBOX_DIR)) {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
}

app.use(express.json());

app.post('/webhook/jira', (req, res) => {
  try {
    handleJiraWebhook(req.body, INBOX_DIR);
    res.status(200).json({ ok: true, message: 'inbox updated' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', inbox: INBOX_DIR });
});

app.listen(PORT, () => {
  console.log(`Jira webhook server: http://0.0.0.0:${PORT}`);
  console.log(`  POST /webhook/jira  - Jira 이벤트 수신`);
  console.log(`  GET  /health        - 상태 확인`);
  console.log(`  inbox: ${INBOX_DIR}`);
});
