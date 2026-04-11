import { useMemo, useRef, useState } from "react";
import { notifyError } from "@/lib/notify";

export type Agreements = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

export type DomainOption = "gmail.com" | "naver.com" | "daum.net" | "custom";

const CODE_LENGTH = 6;

export const useSignupSteps = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step1 - 약관
  const [agreements, setAgreements] = useState<Agreements>({
    terms: false,
    privacy: false,
    marketing: false,
  });

  // Step2 - 이메일
  const [emailId, setEmailId] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainOption>("gmail.com");
  const [customDomain, setCustomDomain] = useState("");

  // Step3 - 인증코드
  const [verificationDigits, setVerificationDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "success" | "error" | ""
  >("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Step4 - 비밀번호
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [name, setName] = useState("");

  // Computed
  const allChecked = agreements.terms && agreements.privacy && agreements.marketing;
  const requiredChecked = agreements.terms && agreements.privacy;
  const resolvedDomain = selectedDomain === "custom" ? customDomain.trim() : selectedDomain;
  const fullEmail = emailId.trim() && resolvedDomain ? `${emailId.trim()}@${resolvedDomain}` : "";
  const verificationCode = verificationDigits.join("");

  // 약관
  const toggleAgreement = (key: keyof Agreements) =>
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAllAgreements = () => {
    const nextValue = !allChecked;
    setAgreements({ terms: nextValue, privacy: nextValue, marketing: nextValue });
  };

  // 인증코드 상태 초기화
  const resetVerificationState = () => {
    setVerificationDigits(Array(CODE_LENGTH).fill(""));
    setIsVerified(false);
    setVerificationMessage("");
    setVerificationStatus("");
  };

  const validateEmailStep = () => {
    if (!emailId.trim()) { notifyError("이메일 아이디를 입력해 주세요."); return false; }
    if (!resolvedDomain.trim()) { notifyError("이메일 도메인을 입력하거나 선택해 주세요."); return false; }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(fullEmail)) { notifyError("올바른 이메일 형식이 아닙니다."); return false; }
    return true;
  };

  // Step3 - 인증코드
  const handleDigitChange = (index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(-1);
    const nextDigits = [...verificationDigits];
    nextDigits[index] = numericValue;
    setVerificationDigits(nextDigits);
    resetVerificationFeedback();
    if (index < CODE_LENGTH - 1 && numericValue) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (verificationDigits[index]) {
        const nextDigits = [...verificationDigits];
        nextDigits[index] = "";
        setVerificationDigits(nextDigits);
        resetVerificationFeedback();
        return;
      }
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...verificationDigits];
        nextDigits[index - 1] = "";
        setVerificationDigits(nextDigits);
        resetVerificationFeedback();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const nextDigits = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, idx) => { nextDigits[idx] = char; });
    setVerificationDigits(nextDigits);
    resetVerificationFeedback();
    const focusIndex = Math.min(pasted.length, CODE_LENGTH) - 1;
    if (focusIndex >= 0) inputRefs.current[focusIndex]?.focus();
  };

  const resetVerificationFeedback = () => {
    setIsVerified(false);
    setVerificationMessage("");
    setVerificationStatus("");
  };

  return {
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
  };
};