import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Ban } from "lucide-react";
import { fetchCategoryContents, fetchMySettings, sanctionContentById, unsanctionContentById } from "@/lib/appApi";
import { formatVatIncludedLabel } from "@/lib/pricing";

interface Content {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  pdfFile?: string;
  pdfFileName?: string;
  pdfPrice?: number;
  createdAt: string;
  isSanctioned?: boolean;
  sanctionReason?: string;
}

const ITEMS_PER_PAGE = 6;
const PAGE_BUTTONS_PER_GROUP = 5;

const SANCTION_REASONS = [
  "불법 및 권리침해",
  "음란 및 성적 콘텐츠",
  "혐오 및 차별",
  "폭력 및 위험행위",
  "정치 및 종교선동",
  "스팸 및 광고",
  "허위정보 및 사기",
  "플렛폼 목적과 무관한 콘텐츠",
] as const;

export default function Bass() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [contents, setContents] = useState<Content[]>([]);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [authorNicknames, setAuthorNicknames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openSanctionMenuId, setOpenSanctionMenuId] = useState<string | null>(null);
  const [sanctionMenuPosition, setSanctionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        if (user) {
          const settingsResponse = await fetchMySettings();
          if (settingsResponse.settings.layout) {
            setLayout(settingsResponse.settings.layout);
          }
        }

        const response = await fetchCategoryContents("베이스");
        setAuthorNicknames(response.authorNicknames);
        setContents(response.contents);
      } catch (error) {
        console.error("베이스 목록 로딩 실패", error);
      }
    };

    void loadPageData();
  }, [user]);

  useEffect(() => {
    const closeMenu = () => {
      setOpenSanctionMenuId(null);
      setSanctionMenuPosition(null);
    };

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleMusicianClick = (e: React.MouseEvent, authorId: string) => {
    e.stopPropagation();
    navigate(`/musician-profile/${authorId}`);
  };

  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      const term = searchQuery.toLowerCase();
      const musicianName = authorNicknames[c.authorId] || c.authorName;
      return (
        c.title.toLowerCase().includes(term) ||
        musicianName.toLowerCase().includes(term)
      );
    });
  }, [authorNicknames, contents, searchQuery]);

  const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE) || 1;

  const currentGroup = Math.ceil(currentPage / PAGE_BUTTONS_PER_GROUP);
  const startPage = (currentGroup - 1) * PAGE_BUTTONS_PER_GROUP + 1;
  const endPage = Math.min(startPage + PAGE_BUTTONS_PER_GROUP - 1, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const currentContents = filteredContents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const sanctionContent = async (contentId: string, reason: string) => {
    if (!user?.id) return;

    await sanctionContentById(contentId, reason, user.id);
    const response = await fetchCategoryContents("베이스");
    setAuthorNicknames(response.authorNicknames);
    setContents(response.contents);
    setOpenSanctionMenuId(null);
    setSanctionMenuPosition(null);
  };

  const unsanctionContent = async (contentId: string) => {
    if (!user?.id) return;

    await unsanctionContentById(contentId, user.id);
    const response = await fetchCategoryContents("베이스");
    setAuthorNicknames(response.authorNicknames);
    setContents(response.contents);
    setOpenSanctionMenuId(null);
    setSanctionMenuPosition(null);
  };

  const openSanctionMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    contentId: string,
  ) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 176;

    setOpenSanctionMenuId((prev) => {
      const nextId = prev === contentId ? null : contentId;

      if (nextId) {
        setSanctionMenuPosition({
          top: rect.bottom + 8,
          left: rect.right - menuWidth,
        });
      } else {
        setSanctionMenuPosition(null);
      }

      return nextId;
    });
  };

  const renderSanctionMenu = (content: Content, positionClassName: string) => {
    if (user?.role !== "admin") return null;

    const isSanctioned = !!content.isSanctioned;

    return (
      <div
        className={positionClassName}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {isSanctioned ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!window.confirm("정말 삭제 해제하시겠습니까?")) return;
              unsanctionContent(content.id);
            }}
            className="inline-flex items-center rounded-md border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/80"
          >
            삭제 해제
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => openSanctionMenu(e, content.id)}
            className="inline-flex items-center rounded-md border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/80"
          >
            삭제
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-6xl"
      >
        <CategoryTabs searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <h1 className="text-4xl font-display font-bold mb-8 text-white">베이스 (BASS)</h1>

        {filteredContents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">일치하는 항목이 없습니다.</p>
          </div>
        ) : layout === "horizontal" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {currentContents.map((content) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigate(`/content/${content.id}`)}
                className="bg-card border border-white/10 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
              >
                <div className="relative w-full h-48 bg-background overflow-hidden">
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className={`w-full h-full object-cover hover:scale-110 transition-transform duration-300 ${
                      content.isSanctioned ? "brightness-50 saturate-0" : ""
                    }`}
                  />

                  {content.isSanctioned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#2f343a]">
                      <Ban className="h-15 w-15 text-red-500" strokeWidth={2.8} />
                    </div>
                  )}

                  {renderSanctionMenu(content, "absolute top-2 left-2 z-10")}

                  {content.pdfPrice && content.pdfPrice > 0 ? (
                    <div className="absolute top-2 left-2 z-10 bg-green-600 px-2 py-1 rounded text-xs font-bold shadow-md">
                      PDF 유료: {formatVatIncludedLabel(content.pdfPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold line-clamp-2 flex-1">
                      {content.isSanctioned ? "삭제된 콘텐츠" : content.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div
                    onClick={(e) => handleMusicianClick(e, content.authorId)}
                    className="text-primary text-sm font-semibold hover:underline inline-block"
                  >
                    {authorNicknames[content.authorId] || content.authorName}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {currentContents.map((content) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigate(`/content/${content.id}`)}
                className="bg-card border border-white/10 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer flex gap-4 p-4"
              >
                <div className="relative w-48 h-32 bg-gray-800 rounded flex-shrink-0 overflow-hidden">
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className={`h-full w-full object-cover ${
                      content.isSanctioned ? "brightness-50 saturate-0" : ""
                    }`}
                  />

                  {content.isSanctioned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#2f343a]">
                      <Ban className="h-15 w-15 text-red-500" strokeWidth={2.8} />
                    </div>
                  )}

                  {content.pdfPrice && content.pdfPrice > 0 ? (
                    <div className="absolute top-2 left-2 z-10 bg-green-600 px-2 py-1 rounded text-xs font-bold shadow-md">
                      PDF 유료: {formatVatIncludedLabel(content.pdfPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="relative flex-1 flex flex-col justify-between py-1 pr-20">
                  {renderSanctionMenu(content, "absolute top-0 right-0")}

                  <div>
                    <h3 className="text-white font-bold text-xl mb-1">
                      {content.isSanctioned ? "삭제된 콘텐츠" : content.title}
                    </h3>
                  </div>

                  <div className="flex flex-col items-start gap-1">
                    <p className="text-gray-500 text-sm">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                    <div
                      onClick={(e) => handleMusicianClick(e, content.authorId)}
                      className="text-primary text-sm font-semibold hover:underline inline-block"
                    >
                      {authorNicknames[content.authorId] || content.authorName}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4 pb-12 flex-wrap">
            <button
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}
              disabled={currentPage === 1}
              className={`px-4 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                currentPage === 1
                  ? "bg-background border border-white/10 text-gray-600 cursor-not-allowed"
                  : "bg-background border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
              }`}
            >
              이전
            </button>

            {Array.from(
              { length: endPage - startPage + 1 },
              (_, i) => startPage + i,
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  currentPage === page
                    ? "bg-primary text-white"
                    : "bg-background border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => {
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
              className={`px-4 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                currentPage === totalPages
                  ? "bg-background border border-white/10 text-gray-600 cursor-not-allowed"
                  : "bg-background border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
              }`}
            >
              다음
            </button>
          </div>
        )}
      </motion.div>

      {openSanctionMenuId && sanctionMenuPosition && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => {
            setOpenSanctionMenuId(null);
            setSanctionMenuPosition(null);
          }}
        >
          <div
            className="absolute w-44 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl"
            style={{
              top: sanctionMenuPosition.top,
              left: sanctionMenuPosition.left,
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {SANCTION_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm("정말 삭제하시겠습니까?")) return;
                  sanctionContent(openSanctionMenuId, reason);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10"
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}