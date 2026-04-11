import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/appApi";
import { hasCompletedPaymentConfirmation, markPaymentConfirmationDone, parsePaymentSuccessParams } from "@/lib/paymentConfirmation";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [confirmed, setConfirmed] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [message, setMessage] = useState("결제 정보를 확인하고 있습니다...");
  const confirmRequestedRef = useRef(false);

  useEffect(() => {
    if (confirmRequestedRef.current) {
      return;
    }

    const parsedParams = parsePaymentSuccessParams(window.location.search);
    const paymentKey = parsedParams?.paymentKey || "";
    const orderId = parsedParams?.orderId || "";
    const amount = parsedParams?.amount || 0;

    if (hasCompletedPaymentConfirmation(sessionStorage, orderId)) {
      setConfirmed(true);
      setMessage("이미 결제 승인이 완료되었습니다.");
      return;
    }

    confirmRequestedRef.current = true;
    let cancelled = false;

    const run = async () => {
      if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
        window.location.replace(`/payment/fail?code=INVALID_PAYMENT_RESULT&message=${encodeURIComponent("결제 결과 정보가 올바르지 않습니다.")}&orderId=${encodeURIComponent(orderId)}`);
        return;
      }

      try {
        const result = await confirmPayment(paymentKey, orderId, amount);
        if (cancelled) return;
        markPaymentConfirmationDone(sessionStorage, orderId);
        setConfirmed(true);
        setContentId(result.contentId);
        setMessage("결제가 완료되었습니다.");
      } catch (error) {
        if (cancelled) return;
        const errorMessage = error instanceof Error ? error.message : "결제 승인에 실패했습니다.";
        window.location.replace(`/payment/fail?code=CONFIRM_FAILED&message=${encodeURIComponent(errorMessage)}&orderId=${encodeURIComponent(orderId)}`);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-xl px-6 pb-12"
      >
        <div className="rounded-lg border border-white/10 bg-card p-8 text-center">
          <h1 className="mb-6 text-4xl font-display font-bold text-white">결제 결과</h1>
          <p className="text-base text-white">{message}</p>

          {confirmed && contentId && (
            <div className="mt-8 flex gap-3">
              <Button onClick={() => navigate(`/content/${contentId}`)} className="flex-1 rounded py-3 font-bold text-white hover:bg-primary/90">
                콘텐츠로 이동
              </Button>
              <Button onClick={() => navigate("/")} className="flex-1 rounded bg-gray-700 py-3 font-bold text-white hover:bg-gray-600">
                홈으로 이동
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
