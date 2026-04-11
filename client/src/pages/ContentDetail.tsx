import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { CircleHelp, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchContentDetail, getProtectedPdfDownloadUrl, type ContentItem } from "@/lib/appApi";
import { notifyError } from "@/lib/notify";
import { formatWon, getVatBreakdown } from "@/lib/pricing";

export default function ContentDetail() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const contentId = window.location.pathname.split("/content/")[1];

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetchContentDetail(contentId);
        setContent(response.content);
        setHasPurchased(response.hasPurchased);
      } catch (error) {
        console.error("콘텐츠 상세 로딩 실패", error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, [contentId, user]);

  const downloadAttachment = async () => {
    if (!content?.pdfFile || !content?.pdfFileName || content.isSanctioned) return;

    setDownloading(true);
    try {
      const response = await fetch(getProtectedPdfDownloadUrl(content.id), {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "PDF 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = content.pdfFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "PDF 다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (!content || content.isSanctioned) return;

    if (content.pdfPrice && content.pdfPrice > 0) {
      if (!user) {
        notifyError("구매하려면 로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      navigate(`/payment/${content.id}`);
    }
  };

  const isYouTubeUrl = (url: string) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";

    if (url.includes("youtube.com/embed/")) return url;

    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes("youtube.com/shorts/")) {
      const videoId = url.split("shorts/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground pt-32 flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="min-h-screen bg-background text-foreground pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">콘텐츠를 찾을 수 없습니다.</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-primary text-white font-bold rounded py-2 px-4"
          >
            돌아가기
          </Button>
        </div>
      </main>
    );
  }

  const isBlocked = !!content.isSanctioned;
  const vat = getVatBreakdown(content.pdfPrice || 0);

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-4xl pb-12"
      >
        <h1 className="text-5xl font-display font-bold mb-4 text-white">
          {content.isSanctioned ? "삭제된 콘텐츠" : content.title}
        </h1>

        <button
          type="button"
          onClick={() => navigate(`/musician-profile/${content.authorId}`)}
          className="text-xl text-primary mb-8 hover:underline cursor-pointer inline-block"
        >
          {content.authorName}
        </button>

        <div className="bg-card border border-white/10 rounded-lg overflow-hidden mb-8">
          {isBlocked ? (
            <div className="relative aspect-video bg-[#2f343a]">
              <img
                src={content.thumbnail}
                alt={content.title}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-[#2f343a] flex flex-col items-center justify-center text-center px-6">
                <div className="text-5xl mb-4">
                  <div className="mb-4 flex items-center justify-center">
                    <Ban className="h-40 w-40 text-red-500" strokeWidth={2.8} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm md:text-base font-medium">
                    관리자 제재로 인해 영상 재생이 제한되었습니다.
                  </p>

                  <div className="relative group">
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center text-gray-300 hover:text-white translate-y-[2px]"
                      aria-label="삭제 사유 보기"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>

                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-gray-200 shadow-lg group-hover:block">
                      {content.sanctionReason || "삭제 사유 없음"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isYouTubeUrl(content.videoUrl) ? (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={getYouTubeEmbedUrl(content.videoUrl)}
                title={content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : content.videoFile ? (
            <video width="100%" height="100%" controls className="bg-black">
              <source src={content.videoFile} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="aspect-video bg-background flex items-center justify-center">
              <p className="text-gray-400">영상을 재생할 수 없습니다.</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-white/10 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">설명</h2>
          <p className="text-gray-300 whitespace-pre-wrap">
            {content.isSanctioned ? "삭제된 콘텐츠" : content.description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {content.pdfFile && (
            <>
              {isBlocked ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <p className="text-sm font-semibold text-red-300">
                    제재된 콘텐츠는 PDF를 다운로드할 수 없습니다.
                  </p>
                </div>
              ) : content.pdfPrice && content.pdfPrice > 0 ? (
                hasPurchased ? (
                  <Button onClick={() => void downloadAttachment()} disabled={downloading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded">
                    {downloading ? "다운로드 준비 중..." : "PDF 다운로드"}
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-card p-5">
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-between gap-4">
                        <span>상품 금액</span>
                        <span>{formatWon(vat.supplyAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>부가가치세(VAT 10%)</span>
                        <span>{formatWon(vat.vatAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-white">
                        <span>총 결제 금액</span>
                        <span className="text-primary">{formatWon(vat.totalAmount)}</span>
                      </div>
                    </div>
                    <Button onClick={handlePurchase} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded">
                      PDF 구매하기 ({formatWon(vat.totalAmount)})
                    </Button>
                  </div>
                )
              ) : (
                <Button onClick={() => void downloadAttachment()} disabled={downloading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded">
                  {downloading ? "다운로드 준비 중..." : "PDF 다운로드"}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
