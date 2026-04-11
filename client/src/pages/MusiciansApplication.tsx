import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";


export default function MusiciansApplication() {
  const { user, isAuthenticated, requestUpgrade } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [signedContractFile, setSignedContractFile] = useState<File | null>(null);
  const [contractChecked, setContractChecked] = useState(false);
  const [error, setError] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const CONTRACT_PDF_URL = "/documents/musician-contract.pdf";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role === "musician") {
      navigate("/mypage");
      return;
    }

    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name || !nickname || !category || !email || !bankName || !accountNumber || !accountHolder || !videoFile) {
        throw new Error("모든 필수 항목을 입력해 주세요.");
      }

      if (!email.includes("@")) {
        throw new Error("유효한 이메일을 입력해 주세요.");
      }

      if (!videoFile.type.startsWith("video/")) {
        throw new Error("영상 파일을 선택해 주세요.");
      }

      if (!signedContractFile) {
        throw new Error("서명한 계약서를 업로드해 주세요.");
      }

      if (signedContractFile.type !== "application/pdf") {
        throw new Error("서명한 계약서는 PDF 파일만 업로드할 수 있습니다.");
      }

      if (!contractChecked) {
        throw new Error("계약서를 확인하고 동의 체크를 해주세요.");
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("nickname", nickname);
      formData.append("category", category);
      formData.append("email", email);
      formData.append("bankName", bankName);
      formData.append("accountNumber", accountNumber);
      formData.append("accountHolder", accountHolder);
      formData.append("videoFile", videoFile);
      formData.append("signedContractFile", signedContractFile);
      formData.append("contractChecked", String(contractChecked));

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "승급 요청 중 오류가 발생했습니다.");
      }

      requestUpgrade();
      navigate("/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="container mx-auto px-6 max-w-3xl pb-12"
      >
        <div className="bg-card border border-white/10 rounded-xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-white">
              뮤지션 지원 양식
            </h1>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 mb-6 text-sm text-blue-200 leading-6">
            <p className="mb-2">
              'Lydian Larnell' 뮤지션 지원 요청을 해주셔서 감사합니다.
            </p>
            <p className="mb-2">
              드럼, 피아노, 기타, 베이스 중 한 가지 카테고리를 선택하여
              1분 내외로 연주해 주시면 됩니다.
            </p>
            <p className="mb-2">
              영상을 찍으실 때 반드시 본인의 지원 메일을 종이에 작성하여
              연주 영상에 보이도록 촬영해 주세요.
            </p>
            <p className="text-xs text-red-400">
              미입력 시 승급 요청이 반려될 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">기본 정보</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">이름 *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors disabled:opacity-70"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">닉네임 *</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="활동명을 입력해 주세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">이메일 *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors disabled:opacity-70"
                    disabled
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">정산 계좌 정보</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">은행 *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="은행명을 입력해주세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">계좌번호 *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="계좌번호를 입력해주세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">예금주명 *</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="예금주명을 입력해주세요"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">지원 정보</h2>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">카테고리 *</label>

                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none bg-background border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-white transition-colors"
                  >
                    <option value="">카테고리를 선택해 주세요</option>
                    <option value="드럼">드럼</option>
                    <option value="피아노">피아노</option>
                    <option value="기타">기타</option>
                    <option value="베이스">베이스</option>
                  </select>

                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ▼
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">연주 영상 제출</h2>
              <p className="mt-1 text-sm text-gray-400">
                지원 메일과 동일한 메일을 종이에 작성하여 연주 영상에 보이도록 촬영해 주세요.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">영상 업로드 *</label>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white"
                />

                {videoFile && (
                  <p className="text-xs text-gray-400 mt-2">선택됨: {videoFile.name}</p>
                )}

                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 mt-4 text-sm text-blue-200">
                  <p className="mb-2">영상 제출 기준</p>
                  <p>지원 메일과 동일한 메일을 종이에 작성하여 연주 영상에 보이도록 녹화해 주세요.</p>
                  <p className="text-xs text-red-400 mt-2">
                    자막 사용 금지, 반드시 종이에 작성된 메일이 영상 안에 보여야 합니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">계약서 제출</h2>
              <p className="mt-1 text-sm text-gray-400">
                아래 계약서를 먼저 확인한 뒤, 서명한 PDF 파일을 업로드해 주세요.
              </p>

              <div className="mt-4 rounded-xl border border-white/8 bg-background/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">뮤지션 계약서 PDF</p>
                    <p className="text-xs text-gray-400 mt-1">
                      계약서를 읽고 서명한 뒤 PDF 파일로 제출합니다.
                    </p>
                  </div>

                  <a
                    href={CONTRACT_PDF_URL}
                    download="musician-contract.pdf"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    뮤지션 계약서 PDF
                  </a>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  서명한 계약서 업로드 (PDF) *
                </label>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSignedContractFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white"
                />

                {signedContractFile && (
                  <p className="text-xs text-gray-400 mt-2">
                    선택됨: {signedContractFile.name}
                  </p>
                )}
              </div>

              <label className="mt-4 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractChecked}
                  onChange={(e) => setContractChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-background accent-white"
                />
                <span className="text-sm text-gray-300 leading-6">
                  계약서 내용을 확인했으며, 서명한 계약서를 제출합니다.
                </span>
              </label>
            </section>

            {error && (
              <p className="text-sm text-red-400 mt-1">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500/90 text-white font-bold rounded-xl py-3 hover:bg-blue-500/80 transition-colors disabled:opacity-50"
              >
                {loading ? "제출 중..." : "뮤지션 승급 요청"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/mypage")}
                className="flex-1 bg-gray-700 text-white font-bold rounded-xl py-3 hover:bg-gray-600 transition-colors"
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}