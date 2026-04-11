import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { reportPaymentFailure } from "@/lib/appApi";

export default function PaymentFail() {
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = params.get("code") || "PAYMENT_FAILED";
  const message = params.get("message") || "결제가 완료되지 않았습니다.";
  const orderId = params.get("orderId") || undefined;

  useEffect(() => {
    void reportPaymentFailure({ orderId, code, message }).catch(() => undefined);
  }, [code, message, orderId]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-xl px-6 pb-12"
      >
        <div className="rounded-lg border border-white/10 bg-card p-8 text-center">
          <h1 className="mb-6 text-4xl font-display font-bold text-white">결제 실패</h1>
          <p className="text-base text-white">{message}</p>
          <p className="mt-3 text-sm text-white/50">오류 코드: {code}</p>
          <div className="mt-8 flex gap-3">
            <Button onClick={() => navigate("/")} className="flex-1 rounded py-3 font-bold text-white hover:bg-primary/90">
              홈으로 이동
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1 rounded bg-gray-700 py-3 font-bold text-white hover:bg-gray-600">
              이전으로
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
