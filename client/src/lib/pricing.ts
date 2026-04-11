export type VatBreakdown = {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export function normalizeWonAmount(value: number | string | null | undefined) {
  const amount = Math.round(Number(value || 0));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function getVatBreakdown(value: number | string | null | undefined): VatBreakdown {
  const supplyAmount = normalizeWonAmount(value);
  const vatAmount = Math.round(supplyAmount * 0.1);
  return {
    supplyAmount,
    vatAmount,
    totalAmount: supplyAmount + vatAmount,
  };
}

export function formatWon(value: number | string | null | undefined) {
  return `₩${normalizeWonAmount(value).toLocaleString("ko-KR")}`;
}

export function formatVatIncludedLabel(value: number | string | null | undefined) {
  const { totalAmount } = getVatBreakdown(value);
  return `${formatWon(totalAmount)} (VAT 포함)`;
}

export { isSupportedVideoUrl } from "@shared/videoPolicy";
