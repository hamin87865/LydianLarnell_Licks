export type TossWidgetsAmount = {
  currency: string;
  value: number;
};

export type TossPaymentRequestParams = {
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
};

export type TossAgreementWidget = {
  destroy?: () => void;
};

export type TossPaymentMethodWidget = {
  destroy?: () => void;
};

export type TossWidgetsInstance = {
  setAmount: (amount: TossWidgetsAmount) => void | Promise<void>;
  renderPaymentMethods: (params: { selector: string; variantKey?: string }) => TossPaymentMethodWidget | Promise<TossPaymentMethodWidget>;
  renderAgreement: (params: { selector: string; variantKey?: string }) => TossAgreementWidget | Promise<TossAgreementWidget>;
  requestPayment: (params: TossPaymentRequestParams) => Promise<void> | void;
};

export type TossPaymentsInstance = {
  widgets: (params: { customerKey: string }) => TossWidgetsInstance;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

export {};
