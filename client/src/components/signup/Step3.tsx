import React, { RefObject } from "react";

type Props = {
  fullEmail: string;
  verificationDigits: string[];
  handleDigitChange: (index: number, value: string) => void;
  handleDigitKeyDown: (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  handleDigitPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleVerifyCode: () => void;
  handleSendVerificationCode: () => void;
  isVerified: boolean;
  verificationCode: string;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  inputRefs: RefObject<Array<HTMLInputElement | null>>;
};

export function StepThreeVerification({
  fullEmail,
  verificationDigits,
  handleDigitChange,
  handleDigitKeyDown,
  handleDigitPaste,
  handleVerifyCode,
  handleSendVerificationCode,
  isVerified,
  verificationCode,
  isSendingCode,
  isVerifyingCode,
  inputRefs,
}: Props) {
  return (
    <section>
      <h1 className="break-all text-2xl font-bold">
        {fullEmail || "이메일 정보가 없습니다."}
      </h1>
      <p className="mt-2 text-sm text-white/60">
        입력한 이메일로 전송된 6자리 인증코드를 입력해 주세요.
      </p>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-2">
          {verificationDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                if (inputRefs.current) inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(index, e)}
              onPaste={handleDigitPaste}
              className="h-14 w-12 rounded-xl border border-white/10 bg-white/5 text-center text-lg font-semibold text-white outline-none focus:border-white md:h-16 md:w-14"
            />
          ))}
        </div>

        <div className="mt-6 text-sm text-white/60">이메일을 받지 못하셨나요?</div>

        <button
          type="button"
          onClick={handleSendVerificationCode}
          disabled={isSendingCode}
          className="mt-2 text-sm font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:text-white/30"
        >
          {isSendingCode ? "재전송 중..." : "인증코드 재전송하기"}
        </button>

        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={isVerifyingCode || verificationCode.length !== 6 || isVerified}
          className="mt-6 h-12 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        >
          {isVerifyingCode
            ? "확인 중..."
            : isVerified
            ? "인증되었습니다"
            : "인증"}
        </button>
      </div>
    </section>
  );
}