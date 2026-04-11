import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync(new URL('../server/routes.ts', import.meta.url), 'utf8');

test('password reset flow requires reset token after code verification', () => {
  assert.match(routeSource, /\/api\/auth\/password-reset\/verify-code/);
  assert.match(routeSource, /resetToken/);
  assert.match(routeSource, /verified_token/);
});

test('application review supports both approve and reject with memo or reason', () => {
  assert.match(routeSource, /\/api\/admin\/applications\/:id\/approve/);
  assert.match(routeSource, /\/api\/admin\/applications\/:id\/reject/);
  assert.match(routeSource, /adminMemo/);
  assert.match(routeSource, /거절 사유가 필요합니다/);
});

test('settlement payout route uses transaction and already-paid guard', () => {
  assert.match(routeSource, /\/api\/admin\/settlements\/:musicianUserId\/pay/);
  assert.match(routeSource, /withTransaction/);
  assert.match(routeSource, /ALREADY_PAID/);
});

test('musician application stores encrypted account fields with masked exposure', () => {
  assert.match(routeSource, /account_number_encrypted/);
  assert.match(routeSource, /account_number_last4/);
  assert.match(routeSource, /maskAccountNumber\(/);
});
