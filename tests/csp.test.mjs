import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cspSource = fs.readFileSync(new URL('../server/lib/csp.ts', import.meta.url), 'utf8');

test('production CSP source includes Toss Payments domains required for payment widget', () => {
  assert.match(cspSource, /https:\/\/js\.tosspayments\.com/);
  assert.match(cspSource, /https:\/\/api\.tosspayments\.com/);
  assert.match(cspSource, /https:\/\/pay\.tosspayments\.com/);
});
