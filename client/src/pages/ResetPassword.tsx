import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { StepTwoEmail } from "@/components/signup/Step2";
import { StepThreeVerification } from "@/components/signup/Step3";
import { ResetPasswordFields } from "@/components/reset-password/ResetPasswordFields";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/notify";

type DomainOption = "gmail.com" | "naver.com" | "daum.net" | "custom";

const CODE_LENGTH = 6;

export default function ResetPassword() {
  const [, navigate] = useLocation();

  const [currentStep, setCurrentStep] = useState(1);

  const [emailId, setEmailId] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainOption>("gmail.com");
  const [customDomain, setCustomDomain] = useState("");

  const [verificationDigits, setVerificationDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const domain = selectedDomain === "custom" ? customDomain.trim() : selectedDomain;

  const fullEmail = useMemo(() => {
    const id = emailId.trim();
    if (!id || !domain) return "";
    return `${id}@${domain}`;
  }, [emailId, domain]);

  const verificationCode = verificationDigits.join("");

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    if (type === "error") {
      notifyError(message);
      return;
    }
    notifySuccess(message);
  };

  const resetVerificationState = () => {
    setVerificationDigits(Array(CODE_LENGTH).fill(""));
    setIsVerified(false);
    setResetToken("");
    setError("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (value: string) => {
    return /^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  };

  const handleSendVerificationCode = async () => {
    setError("");

    if (!fullEmail || !validateEmail(fullEmail)) {
      showMessage("올바른 이메일 양식이 아닙니다.", "error");
      return;
    }

    try {
      setIsSendingCode(true);

      const res = await fetch("/api/auth/password-reset/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: fullEmail,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success !== true) {
        throw new Error(data?.message || "인증코드 발송에 실패했습니다.");
      }

      setVerificationDigits(Array(CODE_LENGTH).fill(""));
      setIsVerified(false);
      setCurrentStep(2);
      showMessage(data?.message || "인증코드가 발송되었습니다.");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "인증코드 발송에 실패했습니다.",
        "error",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");

    if (!fullEmail || !validateEmail(fullEmail)) {
      showMessage("올바른 이메일 양식이 아닙니다.", "error");
      return;
    }

    if (verificationCode.length !== 6) {
      showMessage("6자리 인증코드를 입력해 주세요.", "error");
      return;
    }

    try {
      setIsVerifyingCode(true);

      const res = await fetch("/api/auth/password-reset/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: fullEmail,
          code: verificationCode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.verified !== true) {
        throw new Error(data?.message || "인증코드 확인에 실패했습니다.");
      }

      setIsVerified(true);
      setResetToken(typeof data?.resetToken === "string" ? data.resetToken : "");
      showMessage(data?.message || "인증되었습니다.");

      setTimeout(() => {
        setCurrentStep(3);
      }, 500);
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "인증코드 확인에 실패했습니다.",
        "error",
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const onlyNumber = value.replace(/\D/g, "");
    if (!onlyNumber && value !== "") return;

    const next = [...verificationDigits];
    next[index] = onlyNumber.slice(-1);
    setVerificationDigits(next);
    setError("");

    if (onlyNumber && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !verificationDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    e.preventDefault();

    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });

    setVerificationDigits(next);
    setError("");

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResetPassword = async () => {
    setError("");

    if (!isVerified || !resetToken) {
      setError("이메일 인증을 먼저 완료해 주세요.");
      return;
    }

    if (!validatePassword(password)) {
      setError("비밀번호는 영어 + 특수문자를 포함한 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsSubmittingPassword(true);

      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: fullEmail,
          code: verificationCode,
          newPassword: password,
          resetToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success !== true) {
        throw new Error(data?.message || "비밀번호 재설정에 실패했습니다.");
      }

      showMessage(data?.message || "비밀번호가 재설정되었습니다.", "success");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다."
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg px-2"
      >
        <div className="bg-card border border-white/10 rounded-xl p-8">
          {currentStep === 1 && (
            <StepTwoEmail
              emailId={emailId}
              setEmailId={setEmailId}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              customDomain={customDomain}
              setCustomDomain={setCustomDomain}
              isSendingCode={isSendingCode}
              handleSendVerificationCode={handleSendVerificationCode}
              resetVerificationState={resetVerificationState}
            />
          )}

          {currentStep === 2 && (
            <StepThreeVerification
              fullEmail={fullEmail}
              verificationDigits={verificationDigits}
              handleDigitChange={handleDigitChange}
              handleDigitKeyDown={handleDigitKeyDown}
              handleDigitPaste={handleDigitPaste}
              handleVerifyCode={handleVerifyCode}
              handleSendVerificationCode={handleSendVerificationCode}
              isVerified={isVerified}
              verificationCode={verificationCode}
              isSendingCode={isSendingCode}
              isVerifyingCode={isVerifyingCode}
              inputRefs={inputRefs}
            />
          )}

          {currentStep === 3 && (
            <section>
              <ResetPasswordFields
                password={password}
                confirmPassword={confirmPassword}
                setPassword={setPassword}
                setConfirmPassword={setConfirmPassword}
                error={error}
                setError={setError}
              />

              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmittingPassword}
                className="mt-6 h-12 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
              >
                {isSubmittingPassword ? "변경 중..." : "비밀번호 재설정"}
              </Button>
            </section>
          )}
        </div>
      </motion.div>
    </main>
  );
}