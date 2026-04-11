import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { BottomActionBar } from "@/components/signup/BottomActionBar";
import { StepIndicator } from "@/components/signup/StepIndicator";
import { StepOneAgreements } from "@/components/signup/Step1";
import { StepTwoEmail } from "@/components/signup/Step2";
import { StepThreeVerification } from "@/components/signup/Step3";
import { StepFourPassword } from "@/components/signup/Step4";
import { useSignupSteps } from "@/hooks/useSignup";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify";

export default function Signup() {
  const {
    currentStep,
    setCurrentStep,
    agreements,
    allChecked,
    requiredChecked,
    toggleAgreement,
    toggleAllAgreements,
    emailId,
    setEmailId,
    selectedDomain,
    setSelectedDomain,
    customDomain,
    setCustomDomain,
    fullEmail,
    validateEmailStep,
    verificationDigits,
    handleDigitChange,
    handleDigitKeyDown,
    handleDigitPaste,
    resetVerificationState,
    verificationCode,
    isCodeSent,
    setIsCodeSent,
    isVerified,
    setIsVerified,
    verificationMessage,
    setVerificationMessage,
    verificationStatus,
    setVerificationStatus,
    isSendingCode,
    setIsSendingCode,
    isVerifyingCode,
    setIsVerifyingCode,
    inputRefs,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    name,
    setName
  } = useSignupSteps();

  const [, navigate] = useLocation();

  const handleOpenTerms = () => {
    window.open("/terms", "_blank", "noopener,noreferrer");
  };

  const handleOpenPrivacy = () => {
    window.open("/privacy", "_blank", "noopener,noreferrer");
  };

  const handleOpenMarketing = () => {
    notifyInfo("마케팅 수신 약관은 현재 선택 항목으로만 반영됩니다.");
  };

  const goNext = async () => {
    if (currentStep === 1 && !requiredChecked) {
      notifyError("필수 항목에 동의해야 진행 가능합니다.");
      return;
    }

    if (currentStep === 3 && !isVerified) {
      notifyError("이메일 인증을 완료해야 합니다.");
      return;
    }

    if (currentStep === 4) {
      const regex = /^(?=.*[A-Za-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

      if (!regex.test(password)) {
        setPasswordError("비밀번호는 영어 + 특수문자 포함 8자 이상");
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("비밀번호가 일치하지 않습니다");
        return;
      }

      setPasswordError("");

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fullEmail, password, name }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "회원가입 실패");
        }

        notifySuccess("회원가입이 완료되었습니다.");
        navigate("/");
      } catch (err) {
        notifyError(err instanceof Error ? err.message : "회원가입 오류");
      }

      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-black px-5 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[480px] items-center justify-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] shadow-xl
            ${currentStep === 4
              ? "p-10 max-w-[440px] mx-auto"
              : "p-6"}
          `}
        >
          <div className="pt-4">
            <StepIndicator currentStep={currentStep} totalSteps={4} />
          </div>

          <div className="mt-10">
            {currentStep === 1 && (
              <StepOneAgreements
                agreements={agreements}
                allChecked={allChecked}
                onToggleAgreement={toggleAgreement}
                onToggleAll={toggleAllAgreements}
                onOpenTerms={() => window.open("/terms", "_blank", "noopener,noreferrer")}
                onOpenPrivacy={() => window.open("/privacy", "_blank", "noopener,noreferrer")}
                onOpenMarketing={() => notifyInfo("마케팅 수신 동의는 선택 항목입니다.")}
              />
            )}

            {currentStep === 2 && (
              <StepTwoEmail
                emailId={emailId}
                setEmailId={setEmailId}
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                customDomain={customDomain}
                setCustomDomain={setCustomDomain}
                isSendingCode={isSendingCode}
                handleSendVerificationCode={async () => {
                  if (!validateEmailStep()) return;

                  try {
                    setIsSendingCode(true);

                    const res = await fetch("/api/auth/email/send-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: fullEmail }),
                    });

                    const data = await res.json().catch(() => null);

                    if (!res.ok || data?.success !== true) {
                      throw new Error(data?.message || "인증코드 발송 실패");
                    }

                    setIsCodeSent(true);
                    resetVerificationState();
                    setCurrentStep(3);
                    inputRefs.current[0]?.focus();
                    notifySuccess(data?.message || "인증코드 발송 완료");
                  } catch (err) {
                    notifyError(err instanceof Error ? err.message : "오류");
                  } finally {
                    setIsSendingCode(false);
                  }
                }}
                resetVerificationState={resetVerificationState}
              />
            )}

            {currentStep === 3 && (
              <StepThreeVerification
                fullEmail={fullEmail}
                verificationDigits={verificationDigits}
                handleDigitChange={handleDigitChange}
                handleDigitKeyDown={handleDigitKeyDown}
                handleDigitPaste={handleDigitPaste}
                handleVerifyCode={async () => {
                  if (verificationCode.length !== 6) {
                    setVerificationMessage("인증되지 않았습니다.");
                    setVerificationStatus("error");
                    return;
                  }

                  try {
                    setIsVerifyingCode(true);

                    const res = await fetch("/api/auth/email/verify-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: fullEmail,
                        code: verificationCode,
                      }),
                    });

                    const data = await res.json().catch(() => null);

                    if (res.ok && data?.verified === true) {
                      setIsVerified(true);
                      setVerificationMessage("인증되었습니다.");
                      setVerificationStatus("success");
                      setTimeout(() => setCurrentStep(4), 800);
                    } else {
                      setIsVerified(false);
                      setVerificationMessage(data?.message || "인증되지 않았습니다.");
                      setVerificationStatus("error");
                    }
                  } catch {
                    setIsVerified(false);
                    setVerificationMessage("인증되지 않았습니다.");
                    setVerificationStatus("error");
                  } finally {
                    setIsVerifyingCode(false);
                  }
                }}
                handleSendVerificationCode={async () => {
                  if (!validateEmailStep()) return;

                  try {
                    setIsSendingCode(true);

                    const res = await fetch("/api/auth/email/send-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: fullEmail }),
                    });

                    const data = await res.json().catch(() => null);

                    if (!res.ok || data?.success !== true) {
                      throw new Error(data?.message || "인증코드 발송 실패");
                    }

                    setIsCodeSent(true);
                    resetVerificationState();
                    inputRefs.current[0]?.focus();
                    notifySuccess(data?.message || "인증코드 재발송 완료");
                  } catch (err) {
                    notifyError(err instanceof Error ? err.message : "오류");
                  } finally {
                    setIsSendingCode(false);
                  }
                }}
                isVerified={isVerified}
                verificationCode={verificationCode}
                isSendingCode={isSendingCode}
                isVerifyingCode={isVerifyingCode}
                inputRefs={inputRefs}
              />
            )}

            {currentStep === 4 && (
              <StepFourPassword
                name={name}
                setName={setName}
                password={password}
                confirmPassword={confirmPassword}
                setPassword={setPassword}
                setConfirmPassword={setConfirmPassword}
                error={passwordError}
                setError={setPasswordError}
              />
            )}
          </div>

          {currentStep !== 2 && currentStep !== 3 && (
            <div className="mt-8">
              <BottomActionBar
                currentStep={currentStep}
                onPrev={goPrev}
                onNext={goNext}
                nextDisabled={currentStep === 1 && !requiredChecked}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}