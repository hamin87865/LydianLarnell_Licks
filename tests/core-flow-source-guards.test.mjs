import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync(new URL('../server/routes.ts', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../server/migrations/0000_initial_schema.sql', import.meta.url), 'utf8');

test('email verification flow persists code with expiry and consumption state', () => {
  assert.match(routeSource, /email_verifications/);
  assert.match(routeSource, /expires_at/);
  assert.match(routeSource, /consumed_at/);
});

test('video upload enforces url-only policy while keeping contract validation', () => {
  assert.match(routeSource, /영상은 URL 방식만 등록할 수 있습니다/);
  assert.match(routeSource, /지원하지 않는 영상 URL 형식입니다/);
  assert.match(routeSource, /FEATURE_FLAGS\.allowVideoFileUpload/);
  assert.match(routeSource, /validateFileSignature\(signedContractFile, "pdf"\)/);
  assert.match(routeSource, /이미 대기 중인 승급 요청이 있습니다/);
});

test('payment prepare and confirm keep unique order and purchase constraints', () => {
  assert.match(routeSource, /\/api\/payments\/prepare/);
  assert.match(routeSource, /\/api\/payments\/confirm/);
  assert.match(migrationSource, /UNIQUE \(user_id, content_id\)/);
});
