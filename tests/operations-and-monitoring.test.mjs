import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync(new URL('../server/routes.ts', import.meta.url), 'utf8');
const indexSource = fs.readFileSync(new URL('../server/index.ts', import.meta.url), 'utf8');
const monitoringSource = fs.readFileSync(new URL('../server/lib/monitoring.ts', import.meta.url), 'utf8');
const renderSource = fs.readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
const envExampleSource = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const packageSource = fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8');
const releaseChecklistSource = fs.readFileSync(new URL('../docs/RELEASE_CHECKLIST.md', import.meta.url), 'utf8');

test('payment status API exists for order verification and audit logging', () => {
  assert.match(routeSource, /\/api\/payments\/status/);
  assert.match(routeSource, /actionType: "status_check"/);
});

test('server error monitoring reports to sentry and admin alert mail', () => {
  assert.match(indexSource, /reportServerError/);
  assert.match(monitoringSource, /SENTRY_DSN/);
  assert.match(monitoringSource, /ADMIN_ALERT_EMAIL_TO/);
  assert.match(monitoringSource, /application\/x-sentry-envelope/);
});

test('render and env example include account encryption and monitoring vars', () => {
  assert.match(renderSource, /ACCOUNT_ENCRYPTION_KEY/);
  assert.match(renderSource, /SENTRY_DSN/);
  assert.match(envExampleSource, /ACCOUNT_ENCRYPTION_KEY/);
  assert.match(envExampleSource, /ADMIN_ALERT_EMAIL_TO/);
});


test('release verification scripts include e2e and integration checks with documented checklist', () => {
  assert.match(packageSource, /"test:e2e:staging"\s*:/);
  assert.match(packageSource, /"verify:release"\s*:\s*"[^"]*test:e2e[^"]*verify:integrations/);
  assert.match(packageSource, /"verify:release:deployed"\s*:\s*"[^"]*smoke:check[^"]*verify:integrations/);
  assert.match(releaseChecklistSource, /npm run test:e2e:staging/);
  assert.match(releaseChecklistSource, /npm run verify:release:deployed/);
  assert.match(releaseChecklistSource, /회원가입 확인/);
  assert.match(releaseChecklistSource, /관리자 영상 제재 확인/);
});
