import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Mail, Pencil } from "lucide-react";
import {
  fetchMusicianProfile,
  toggleSubscription as toggleSubscriptionApi,
  updateSubscriptionNotify,
  sanctionContentById,
  unsanctionContentById,
} from "@/lib/appApi";
import { Ban } from "lucide-react";
import { formatVatIncludedLabel } from "@/lib/pricing";

interface Content {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  pdfFile?: string;
  pdfFileName?: string;
  pdfPrice?: number;
  createdAt: string;
  isSanctioned?: boolean;
  sanctionReason?: string;
}

interface MusicianProfilePageProps {
  params?: { id?: string };
}

interface ProfileSettings {
  nickname?: string;
  profileImage?: string;
  bio?: string;
  email?: string;
  instagram?: string;
  layout?: "horizontal" | "vertical";
}

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

export default function MusicianProfilePage({ params }: MusicianProfilePageProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [contents, setContents] = useState<Content[]>([]);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [openSanctionMenuId, setOpenSanctionMenuId] = useState<string | null>(null);
  const [sanctionMenuPosition, setSanctionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const targetId = params?.id || user?.id;
  const isOwner = !!user && user.id === targetId;

  useEffect(() => {
    if (!targetId) {
      navigate("/");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetchMusicianProfile(String(targetId));
        if (!response.user) {
          navigate("/");
          return;
        }

        setProfileUser(response.user);
        setProfileSettings(response.settings || {});
        setContents(response.contents);
        setIsSubscribed(response.subscription.subscribed);
        setIsNotifying(response.subscription.notify);

        if (user) {
          try {
            const myProfile = await fetchMusicianProfile(user.id);
            if (myProfile.settings.layout) {
              setLayout(myProfile.settings.layout);
            }
          } catch (error) {
            console.error("내 레이아웃 로딩 실패", error);
          }
        }
      } catch (error) {
        console.error("뮤지션 프로필 로딩 실패", error);
        navigate("/");
      }
    };

    void loadProfile();
  }, [isOwner, navigate, targetId, user]);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenSanctionMenuId(null);
      setSanctionMenuPosition(null);
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const toggleSubscription = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const result = await toggleSubscriptionApi(String(targetId), user.id);
    setIsSubscribed(result.subscribed);
    setIsNotifying(result.notify);
  };

  const toggleNotification = async () => {
    if (!user || !isSubscribed) return;
    const nextNotifyState = !isNotifying;
    await updateSubscriptionNotify(String(targetId), nextNotifyState, user.id);
    setIsNotifying(nextNotifyState);
  };

  const sanctionContent = async (contentId: string, reason: string) => {
    if (!user?.id) return;

    await sanctionContentById(contentId, reason, user.id);
    const response = await fetchMusicianProfile(String(targetId));
    setContents(response.contents);
    setOpenSanctionMenuId(null);
    setSanctionMenuPosition(null);
  };

  const unsanctionContent = async (contentId: string) => {
    if (!user?.id) return;

    await unsanctionContentById(contentId, user.id);
    const response = await fetchMusicianProfile(String(targetId));
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

  const renderSanctionMenu = (
    content: Content,
    positionClassName: string,
  ) => {
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

  if (!profileUser) return null;

  const displayName = profileSettings.nickname || profileUser.name;
  const profileImage = profileSettings.profileImage || "";
  const profileBio = profileSettings.bio || "소개글이 아직 등록되지 않았습니다.";
  const profileEmail = profileSettings.email || profileUser.email || "";
  const instagramId = profileSettings.instagram || "";

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-6xl"
      >
        <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-card">
          <div className="bg-gradient-to-br from-primary/15 via-transparent to-purple-500/10 px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="h-32 w-32 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-xl md:h-36 md:w-36">
                  {profileImage ? (
                    <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">👤</div>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <h1 className="text-4xl font-display font-bold text-white md:text-5xl">
                    {displayName}
                  </h1>
                  <p className="text-sm font-semibold text-primary">뮤지션</p>
                  <p className="max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
                    {profileBio}
                  </p>
                </div>
              </div>

              <div className="flex justify-start lg:justify-end">
                {isOwner ? (
                  <Button
                    onClick={() => navigate("/musician-profile/edit")}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
                  >
                    <Pencil className="h-4 w-4" />
                    프로필 편집
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
                    <Button
                      onClick={toggleSubscription}
                      className={`rounded-xl px-8 py-3 font-bold transition-colors ${
                        isSubscribed
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {isSubscribed ? "구독 취소" : "구독"}
                    </Button>

                    {isSubscribed && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-300">알림 설정</span>
                        <button
                          onClick={toggleNotification}
                          className={`relative h-6 w-12 rounded-full transition-colors ${
                            isNotifying ? "bg-primary" : "bg-gray-600"
                          }`}
                        >
                          <motion.div
                            layout
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white ${
                              isNotifying ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 px-6 py-6 md:grid-cols-2 md:px-10">
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Mail</p>
              <div className="flex items-center gap-3 text-gray-200">
                <Mail className="h-4 w-4 text-primary" />
                <span className="break-all text-sm md:text-base">
                  {profileEmail || "등록된 메일이 없습니다."}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Instagram
              </p>
              <div className="flex items-center gap-3 text-gray-200">
                <Instagram className="h-4 w-4 text-primary" />
                <span className="break-all text-sm md:text-base">
                  {instagramId ? `@${instagramId}` : "등록된 인스타 아이디가 없습니다."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6 md:p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">콘텐츠</h2>

          {contents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-400">아직 업로드된 콘텐츠가 없습니다.</p>
            </div>
          ) : layout === "horizontal" ? (
            <div className="grid grid-cols-1 gap-6 pb-2 md:grid-cols-2 lg:grid-cols-3">
              {contents.map((content) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => navigate(`/content/${content.id}`)}
                  className="cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-background transition-colors hover:border-primary"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-background">
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className={`h-full w-full object-cover transition-transform duration-300 hover:scale-110 ${
                        content.isSanctioned ? "brightness-50 saturate-0" : ""
                      }`}
                    />

                    {content.isSanctioned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2f343a]">
                        <Ban className="h-15 w-15 text-red-500" strokeWidth={2.8} />
                      </div>
                    )}

                    {renderSanctionMenu(content, "absolute top-2 right-2 z-10")}

                    {content.pdfPrice && content.pdfPrice > 0 ? (
                      <div className="absolute top-2 left-2 z-10 bg-green-600 px-2 py-1 rounded text-xs font-bold shadow-md">
                        PDF 유료: {formatVatIncludedLabel(content.pdfPrice)}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="line-clamp-2 flex-1 font-bold text-white">
                        {content.isSanctioned ? "삭제된 콘텐츠" : content.title}
                      </h3>
                      <span className="ml-2 whitespace-nowrap text-xs text-gray-500">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-primary text-sm font-semibold inline-block">
                      {displayName}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {contents.map((content) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => navigate(`/content/${content.id}`)}
                  className="flex cursor-pointer gap-4 overflow-hidden rounded-lg border border-white/10 bg-background p-4 transition-colors hover:border-primary"
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

                  <div className="relative flex flex-1 flex-col justify-between py-1 pr-20">
                    {renderSanctionMenu(content, "absolute top-0 right-0")}

                    <div>
                      <h3 className="mb-1 text-xl font-bold text-white">
                        {content.isSanctioned ? "삭제된 콘텐츠" : content.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <p className="text-sm text-gray-500">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                      <div className="inline-block text-sm font-semibold text-primary">
                        {displayName}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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