import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchContentDetail, preparePayment, type ContentItem, type PaymentPrepareResponse } from "@/lib/appApi";
import type { TossAgreementWidget, TossPaymentMethodWidget } from "@/types/toss-payments";
import { notifyError } from "@/lib/notify";
import { formatWon, getVatBreakdown } from "@/lib/pricing";

const TOSS_SDK_URL = "https://js.tosspayments.com/v2/standard";

function getTossClientKey() {
  return String(import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY || "").trim();
}

async function loadTossSdk() {
  if (window.TossPayments) {
    return window.TossPayments;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TOSS_SDK_URL}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("토스 SDK 로드에 실패했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("토스 SDK 로드에 실패했습니다."));
    document.head.appendChild(script);
  });

  if (!window.TossPayments) {
    throw new Error("토스 SDK 초기화에 실패했습니다.");
  }

  return window.TossPayments;
}

export default function Payment() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preparedOrder, setPreparedOrder] = useState<PaymentPrepareResponse | null>(null);
  const [refundAgreementChecked, setRefundAgreementChecked] = useState(false);

  const paymentWidgetRef = useRef<TossPaymentMethodWidget | null>(null);
  const agreementWidgetRef = useRef<TossAgreementWidget | null>(null);
  const requestPaymentRef = useRef<null | (() => Promise<void>)>(null);
  const preparedKeyRef = useRef<string | null>(null);
  const preparingKeyRef = useRef<string | null>(null);
  const contentId = window.location.pathname.split("/payment/")[1];

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetchContentDetail(contentId);
        setContent(response.content);
      } catch (error) {
        console.error("결제 정보 로딩 실패", error);
        setErrorMessage("결제 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, [contentId]);

  useEffect(() => {
    let cancelled = false;

    const resetPreparedState = () => {
      requestPaymentRef.current = null;
      paymentWidgetRef.current?.destroy?.();
      agreementWidgetRef.current?.destroy?.();
      paymentWidgetRef.current = null;
      agreementWidgetRef.current = null;
      setWidgetReady(false);
      setPreparedOrder(null);
    };

    const setupWidgets = async () => {
      if (!user || !content || !content.pdfPrice || content.pdfPrice <= 0) {
        preparedKeyRef.current = null;
        preparingKeyRef.current = null;
        resetPreparedState();
        return;
      }

      const clientKey = getTossClientKey();
      if (!clientKey) {
        setErrorMessage("결제 클라이언트 키가 설정되지 않았습니다.");
        resetPreparedState();
        return;
      }

      const prepareKey = `${user.id}:${content.id}`;
      if (preparedKeyRef.current === prepareKey || preparingKeyRef.current === prepareKey) {
        return;
      }

      preparingKeyRef.current = prepareKey;

      try {
        setErrorMessage(null);
        resetPreparedState();

        const prepared = await preparePayment(content.id);
        if (cancelled || preparingKeyRef.current !== prepareKey) return;
        setPreparedOrder(prepared);

        const tossPaymentsFactory = await loadTossSdk();
        if (cancelled || preparingKeyRef.current !== prepareKey) return;

        const tossPayments = tossPaymentsFactory(clientKey);
        const widgets = tossPayments.widgets({ customerKey: prepared.customerKey });

        await Promise.resolve(widgets.setAmount({ currency: "KRW", value: prepared.amount }));

        paymentWidgetRef.current = await Promise.resolve(
          widgets.renderPaymentMethods({ selector: "#payment-method-widget" }),
        );
        agreementWidgetRef.current = await Promise.resolve(
          widgets.renderAgreement({ selector: "#payment-agreement-widget" }),
        );

        if (cancelled || preparingKeyRef.current !== prepareKey) return;

        requestPaymentRef.current = async () => {
          await widgets.requestPayment({
            orderId: prepared.orderId,
            orderName: prepared.orderName,
            successUrl: prepared.successUrl,
            failUrl: prepared.failUrl,
            customerEmail: prepared.customerEmail,
            customerName: prepared.customerName,
          });
        };

        preparedKeyRef.current = prepareKey;
        setWidgetReady(true);
      } catch (error) {
        if (cancelled) return;
        console.error("결제 위젯 준비 실패", error);
        preparedKeyRef.current = null;
        resetPreparedState();
        setErrorMessage(error instanceof Error ? error.message : "결제 준비에 실패했습니다.");
      } finally {
        if (preparingKeyRef.current === prepareKey) {
          preparingKeyRef.current = null;
        }
      }
    };

    void setupWidgets();

    return () => {
      cancelled = true;
      preparedKeyRef.current = null;
      preparingKeyRef.current = null;
      requestPaymentRef.current = null;
      paymentWidgetRef.current?.destroy?.();
      agreementWidgetRef.current?.destroy?.();
      paymentWidgetRef.current = null;
      agreementWidgetRef.current = null;
    };
  }, [content?.id, content?.pdfPrice, user?.id]);

  const handlePayment = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!content) {
      return;
    }

    if (!preparedOrder || !widgetReady) {
      notifyError(errorMessage || "결제 준비가 아직 완료되지 않았습니다.");
      return;
    }

    if (!refundAgreementChecked) {
      notifyError("디지털 콘텐츠 환불 제한 약관에 동의해 주세요.");
      return;
    }

    const requestPayment = requestPaymentRef.current;
    if (!requestPayment) {
      notifyError("결제창을 준비하지 못했습니다.");
      return;
    }

    try {
      setPaying(true);
      await requestPayment();
    } catch (error) {
      console.error("결제 요청 실패", error);
      notifyError(error instanceof Error ? error.message : "결제 요청에 실패했습니다.");
      setPaying(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-background pt-32 text-white flex items-center justify-center">로딩 중...</main>;
  }

  if (!content) {
    return <main className="min-h-screen bg-background pt-32 text-white flex items-center justify-center">콘텐츠를 찾을 수 없습니다.</main>;
  }

  const vat = getVatBreakdown(content.pdfPrice || 0);

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-xl px-6 pb-12"
      >
        <div className="rounded-lg border border-white/10 bg-card p-8">
          <h1 className="mb-8 text-4xl font-display font-bold text-white">결제</h1>

          <div className="space-y-4 text-white">
            <div>
              <p className="text-sm text-gray-400">콘텐츠</p>
              <p className="text-lg font-semibold">{content.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">뮤지션</p>
              <p className="text-lg font-semibold">{content.authorName}</p>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-gray-400">결제 금액</p>
              <div className="space-y-1 text-sm text-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <span>상품 금액</span>
                  <span>{formatWon(vat.supplyAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>부가가치세(VAT 10%)</span>
                  <span>{formatWon(vat.vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-2 text-base font-semibold text-white">
                  <span>총 결제 금액</span>
                  <span className="text-primary">{formatWon(vat.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="mb-3 text-sm text-gray-400">결제 수단</p>
              <div id="payment-method-widget" className="rounded-lg border border-white/10 bg-white p-3" />
            </div>

            <div>
              <p className="mb-3 text-sm text-gray-400">약관 동의</p>

              <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
                {/* 토스 약관 */}
                <div id="payment-agreement-widget" />

                {/* 우리 서비스 약관 */}
                <label className="flex cursor-pointer items-start gap-3 border-t border-white/10 pt-3">
                  <input
                    type="checkbox"
                    checked={refundAgreementChecked}
                    onChange={(e) => setRefundAgreementChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
                  />
                  <span className="text-sm leading-6 text-gray-200">
                    디지털 콘텐츠의 특성상 다운로드 또는 이용 시 환불이 제한될 수 있음에 동의합니다.
                  </span>
                </label>
              </div>
            </div>
            
            {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              onClick={() => void handlePayment()}
              disabled={!widgetReady || paying || !!errorMessage || !refundAgreementChecked}
              className="flex-1 rounded py-3 font-bold text-white hover:bg-primary/90"
            >
              {paying ? "결제창 여는 중..." : "결제하기"}
            </Button>

            <Button
              onClick={() => navigate(`/content/${content.id}`)}
              className="flex-1 rounded bg-gray-700 py-3 font-bold text-white hover:bg-gray-600"
            >
              취소
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}