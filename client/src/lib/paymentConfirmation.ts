export type PaymentSuccessParams = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

export function getPaymentConfirmLockKey(orderId: string) {
  return orderId ? `payment-confirm-lock:${orderId}` : null;
}

export function hasCompletedPaymentConfirmation(storage: Pick<Storage, "getItem">, orderId: string) {
  const key = getPaymentConfirmLockKey(orderId);
  return key ? storage.getItem(key) === "done" : false;
}

export function markPaymentConfirmationDone(storage: Pick<Storage, "setItem">, orderId: string) {
  const key = getPaymentConfirmLockKey(orderId);
  if (key) {
    storage.setItem(key, "done");
  }
}

export function parsePaymentSuccessParams(search: string): PaymentSuccessParams | null {
  const params = new URLSearchParams(search);
  const paymentKey = params.get("paymentKey") || "";
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 0);

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return { paymentKey, orderId, amount };
}
