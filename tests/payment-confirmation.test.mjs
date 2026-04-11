import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const helperSource = fs.readFileSync(new URL('../client/src/lib/paymentConfirmation.ts', import.meta.url), 'utf8');
const pageSource = fs.readFileSync(new URL('../client/src/pages/PaymentSuccess.tsx', import.meta.url), 'utf8');

test('payment confirmation helper defines order-based sessionStorage lock', () => {
  assert.match(helperSource, /payment-confirm-lock:\$\{orderId\}/);
  assert.match(helperSource, /setItem\(key, "done"\)/);
});

test('PaymentSuccess uses parsed params and sessionStorage duplicate guard', () => {
  assert.match(pageSource, /parsePaymentSuccessParams/);
  assert.match(pageSource, /hasCompletedPaymentConfirmation\(sessionStorage, orderId\)/);
  assert.match(pageSource, /markPaymentConfirmationDone\(sessionStorage, orderId\)/);
});
