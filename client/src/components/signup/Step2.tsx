import React from "react";

type DomainOption = "gmail.com" | "naver.com" | "daum.net" | "custom";

type Props = {
  emailId: string;
  setEmailId: (v: string) => void;
  selectedDomain: DomainOption;
  setSelectedDomain: (v: DomainOption) => void;
  customDomain: string;
  setCustomDomain: (v: string) => void;
  isSendingCode: boolean;
  handleSendVerificationCode: () => void;
  resetVerificationState: () => void;
};

export function StepTwoEmail({
  emailId,
  setEmailId,
  selectedDomain,
  setSelectedDomain,
  customDomain,
  setCustomDomain,
  isSendingCode,
  handleSendVerificationCode,
  resetVerificationState,
}: Props) {
  return (
    <section>
      <h1 className="text-2xl font-bold">이메일을 입력해 주세요</h1>
      <p className="mt-2 text-sm text-white/60">
        입력한 이메일로 6자리 인증코드를 발송합니다.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            이메일
          </label>

          <div className="grid grid-cols-[1fr_auto_140px] items-center gap-3">
            <input
              type="text"
              value={emailId}
              onChange={(e) => {
                setEmailId(e.target.value);
                resetVerificationState();
              }}
              placeholder="이메일"
              className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white"
            />

            <div className="text-base font-semibold text-white/70">@</div>

            {selectedDomain === "custom" ? (
              <input
                type="text"
                value={customDomain}
                onChange={(e) => {
                  setCustomDomain(e.target.value);
                  resetVerificationState();
                }}
                placeholder="직접입력"
                className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white"
              />
            ) : (
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value as DomainOption);
                  resetVerificationState();
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none focus:border-white"
              >
                <option value="gmail.com" className="bg-black text-white">
                  gmail.com
                </option>
                <option value="naver.com" className="bg-black text-white">
                  naver.com
                </option>
                <option value="daum.net" className="bg-black text-white">
                  daum.net
                </option>
                <option value="custom" className="bg-black text-white">
                  직접입력
                </option>
              </select>
            )}
          </div>

          {selectedDomain === "custom" && (
            <button
              type="button"
              onClick={() => {
                setSelectedDomain("gmail.com");
                setCustomDomain("");
                resetVerificationState();
              }}
              className="mt-3 text-sm text-white/60 transition hover:text-white"
            >
              도메인 목록으로 돌아가기
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSendVerificationCode}
          disabled={isSendingCode}
          className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        >
          {isSendingCode ? "발송 중..." : "인증"}
        </button>
      </div>
    </section>
  );
}