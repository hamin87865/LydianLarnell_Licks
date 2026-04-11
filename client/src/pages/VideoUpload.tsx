import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchMySettings } from "@/lib/appApi";
import { isSupportedVideoUrl } from "@/lib/pricing";

const CATEGORIES = ["드럼", "피아노", "베이스", "기타"];

type PdfType = "free" | "paid";

export default function VideoUpload() {
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfType, setPdfType] = useState<PdfType>("free");
  const [pdfPrice, setPdfPrice] = useState("");
  const [error, setError] = useState("");
  const [videoSourceError, setVideoSourceError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authUser || authUser.role !== "musician") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">접근 권한이 없습니다.</h1>
          <p className="text-gray-400 mb-6">뮤지션 회원만 콘텐츠를 업로드할 수 있습니다.</p>
          <Button
            onClick={() => navigate("/mypage")}
            className="bg-blue-500/90 text-white font-bold rounded-xl py-2 px-4 hover:bg-blue-500/80 transition-colors"
          >
            돌아가기
          </Button>
        </div>
      </main>
    );
  }

  const handlePdfFileChange = (file: File | null) => {
    setPdfFile(file);
    if (!file) {
      setPdfPrice("");
      setPdfType("free");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVideoSourceError("");
    setLoading(true);

    try {
      if (!title.trim() || !description.trim() || !category) {
        throw new Error("제목, 설명, 카테고리는 필수입니다.");
      }

      if (!videoUrl.trim()) {
        throw new Error("영상 URL을 등록해주세요.");
      }

      if (!isSupportedVideoUrl(videoUrl)) {
        throw new Error("유튜브 일반 영상 또는 유튜브 쇼츠 URL만 등록할 수 있습니다.");
      }

      if (!thumbnail) {
        throw new Error("썸네일 이미지를 선택해주세요.");
      }

      if (pdfFile && pdfFile.type !== "application/pdf") {
        throw new Error("첨부파일은 PDF만 가능합니다.");
      }

      if (pdfFile && pdfType === "paid") {
        if (!pdfPrice.trim()) {
          throw new Error("유료 PDF는 가격 입력이 필요합니다.");
        }

        const parsedPrice = parseInt(pdfPrice, 10);

        if (Number.isNaN(parsedPrice)) {
          throw new Error("PDF 가격은 숫자로 입력해주세요.");
        }

        if (parsedPrice < 1000) {
          throw new Error("유료 PDF의 최소 가격은 1000원입니다.");
        }
      }

      const settingsResponse = await fetchMySettings();
      const nickname = settingsResponse.settings.nickname || authUser.name;

      const finalPdfPrice =
        pdfFile && pdfType === "paid" ? String(parseInt(pdfPrice, 10)) : "0";

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("videoUrl", videoUrl.trim());
      formData.append("authorName", nickname);
      formData.append("pdfPrice", finalPdfPrice);
      formData.append("thumbnail", thumbnail);


      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      }

      const response = await fetch("/api/contents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "업로드 중 오류가 발생했습니다.");
      }

      navigate("/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="container mx-auto max-w-3xl px-6 pb-14"
      >
        <div className="rounded-2xl border border-white/10 bg-card p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white">콘텐츠 업로드</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">기본 정보</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200">제목 *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white"
                    placeholder="콘텐츠 제목을 입력해주세요"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200">설명 *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-32 w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white resize-none"
                    placeholder="콘텐츠 설명을 입력해주세요"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200">카테고리 *</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-background px-4 py-3 pr-10 text-white outline-none transition-colors focus:border-white"
                    >
                      <option value="">카테고리를 선택해주세요</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">영상 등록</h2>
              <p className="mt-1 text-sm text-gray-400">
                영상은 URL 방식으로만 등록됩니다. 유튜브 일반 영상과 유튜브 쇼츠 URL을 사용할 수 있습니다.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-200">영상 URL *</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoSourceError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white"
                  placeholder="https://www.youtube.com/watch?v=... 또는 https://www.youtube.com/shorts/..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  지원 형식: youtube.com/watch, youtu.be, youtube.com/shorts
                </p>
              </div>

              {videoSourceError && (
                <p className="mt-3 text-sm text-red-300">
                  {videoSourceError}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-semibold text-white">썸네일</h2>
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  권장 비율 16:9
                </span>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-200">썸네일 이미지 *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white"
                />
                {thumbnail && (
                  <p className="mt-2 text-xs text-gray-400">선택됨: {thumbnail.name}</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">PDF 악보</h2>
              <p className="mt-1 text-sm text-gray-400">
                PDF를 첨부한 경우에만 무료 또는 유료를 선택합니다.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-200">PDF 파일</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handlePdfFileChange(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white"
                />
                {pdfFile && (
                  <p className="mt-2 text-xs text-gray-400">선택됨: {pdfFile.name}</p>
                )}
              </div>

              {pdfFile && (
                <div className="mt-5 space-y-4 rounded-xl border border-white/8 bg-background/60 p-4">
                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-200">배포 방식</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPdfType("free");
                          setPdfPrice("");
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          pdfType === "free"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-black/20 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        무료 배포
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfType("paid")}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          pdfType === "paid"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-black/20 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        유료 판매
                      </button>
                    </div>
                  </div>

                  {pdfType === "paid" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-200">
                        PDF 가격 (원) *
                      </label>
                      <input
                        type="number"
                        value={pdfPrice}
                        onChange={(e) => setPdfPrice(e.target.value)}
                        min="1000"
                        step="100"
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition-colors focus:border-primary"
                        placeholder="최소 1000원"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        유료 PDF는 최소 1000원부터 설정할 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {error && (
              <div className="text-sm text-red-400 mt-2">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-500/90 text-white font-semibold py-3 hover:bg-blue-500/80 transition-colors disabled:opacity-50"
              >
                {loading ? "업로드 중..." : "업로드"}
              </Button>

              <Button
                type="button"
                onClick={() => navigate("/mypage")}
                className="flex-1 rounded-xl bg-white/10 text-white font-semibold py-3 hover:bg-white/15 transition-colors"
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