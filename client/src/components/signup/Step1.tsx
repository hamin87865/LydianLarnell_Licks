import { AgreementRow } from "./AgreementRow";

type StepOneProps = {
  agreements: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
  };
  allChecked: boolean;
  onToggleAgreement: (key: "terms" | "privacy" | "marketing") => void;
  onToggleAll: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenMarketing: () => void;
};

export function StepOneAgreements({
  agreements,
  allChecked,
  onToggleAgreement,
  onToggleAll,
  onOpenTerms,
  onOpenPrivacy,
  onOpenMarketing,
}: StepOneProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold">이용약관 및 정책</h1>
      <p className="mt-2 text-sm text-white/60">
        Lydian Larnell Licks 서비스 약관을 확인해 주세요.
      </p>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-2">
        <AgreementRow
          checked={allChecked}
          label="모두 동의합니다."
          isAll
          onToggle={onToggleAll}
          noBorder
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <AgreementRow
          checked={agreements.terms}
          label="[필수] 이용약관에 동의합니다."
          onToggle={() => onToggleAgreement("terms")}
          onDetail={onOpenTerms}
        />

        <AgreementRow
          checked={agreements.privacy}
          label="[필수] 개인정보 수집 및 이용에 동의합니다."
          onToggle={() => onToggleAgreement("privacy")}
          onDetail={onOpenPrivacy}
        />

        <AgreementRow
          checked={agreements.marketing}
          label="[선택] 이벤트 및 혜택 수신 알림에 동의합니다."
          onToggle={() => onToggleAgreement("marketing")}
          onDetail={onOpenMarketing}
          noBorder
        />
      </div>
    </section>
  );
}