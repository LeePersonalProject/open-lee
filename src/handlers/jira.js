/**
 * Jira 웹훅 페이로드 파싱 후 inbox에 md 파일 생성
 * - Jira Cloud 웹훅 형식: webhookEvent, issue, ...
 * - md에는 이슈 요약/설명 + Confluence 참조 안내 포함
 */
const fs = require('fs');
const path = require('path');

const CONFLUENCE_README = `
## Confluence 참조
- **Cursor에서 작업할 때**: Confluence MCP로 이 이슈 제목/설명 키워드로 검색해 문서를 참조하세요.
- 이슈 설명에 Confluence 링크가 있으면 해당 페이지를 우선 참조합니다.
`;

function safe(str) {
  if (str == null) return '';
  return String(str).replace(/\r\n/g, '\n').trim();
}

function extractConfluenceLinks(description) {
  if (!description) return [];
  const links = [];
  const wikiRegex = /https?:\\/\\/[^\\s]*atlassian\\.net\\/wiki\\/[^\\s)]+/gi;
  let m;
  while ((m = wikiRegex.exec(description)) !== null) links.push(m[0]);
  return [...new Set(links)];
}

function buildMd(payload, inboxDir) {
  const event = payload.webhookEvent || 'jira:issue_created';
  const issue = payload.issue || {};
  const key = issue.key;
  if (!key) return null;

  const fields = issue.fields || {};
  const summary = safe(fields.summary);
  const description = safe(fields.description);
  const issueType = (fields.issuetype || {}).name || '';
  const status = (fields.status || {}).name || '';
  const reporter = (fields.reporter || {}).displayName || '';
  const confluenceLinks = extractConfluenceLinks(description);

  const createdAt = new Date().toISOString();
  const jiraBase = process.env.JIRA_BASE_URL || 'https://ss1mobile.atlassian.net';
  const issueUrl = `${jiraBase}/browse/${key}`;

  let confluenceSection = CONFLUENCE_README.trim();
  if (confluenceLinks.length > 0) {
    confluenceSection = `## Confluence 참조\n${confluenceLinks.map((url) => `- ${url}`).join('\n')}\n\nCursor에서 위 Confluence 페이지를 참조하여 작업하세요.`;
  }

  const md = `# ${key}: ${summary}

- **이벤트**: ${event}
- **타입**: ${issueType} | **상태**: ${status}
- **등록**: ${reporter}
- **수신 시각**: ${createdAt}
- **Jira**: ${issueUrl}

## 설명

${description || '(설명 없음)'}

${confluenceSection}
`;

  return { key, md };
}

function handleJiraWebhook(body, inboxDir) {
  const result = buildMd(body, inboxDir);
  if (!result) throw new Error('No issue key in webhook payload');

  const filename = `${result.key}.md`;
  const filepath = path.join(inboxDir, filename);
  fs.writeFileSync(filepath, result.md, 'utf8');
  console.log(`Written: ${filepath}`);
  return filepath;
}

module.exports = { handleJiraWebhook, buildMd };
