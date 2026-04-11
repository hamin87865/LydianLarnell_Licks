import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteContentById, deleteMyAccount, fetchMyContents, fetchMySettings, fetchMySubscriptions, saveMySettings, updateSubscriptionNotify } from "@/lib/appApi";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Content {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  pdfPrice?: number;
}

export default function MyPage() {
  const { user, isAuthenticated, requestUpgrade, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [contents, setContents] = useState<Content[]>([]);
  
  // 설정 상태
  const [nickname, setNickname] = useState("");
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [lastNicknameChange, setLastNicknameChange] = useState<number | null>(null);
  
  // 계정 탈퇴
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // 알림/구독 상태
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      void loadContents();
      void loadSettings();
      void loadSubscriptions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          const yOffset = -100; // Navbar 높이만큼 보정
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [window.location.hash]);

  const loadContents = async () => {
    if (!user) return;
    const response = await fetchMyContents();
    setContents(response.contents as Content[]);
  };

  const loadSettings = async () => {
    if (!user) return;
    const response = await fetchMySettings();
    const s = response.settings || {};
    if (s.nickname) setNickname(s.nickname);
    if (s.layout) setLayout(s.layout);
    if (s.language) setLanguage(s.language);
    if (s.notificationsEnabled !== undefined) setNotificationsEnabled(s.notificationsEnabled);
    if (s.lastNicknameChange) setLastNicknameChange(s.lastNicknameChange);
  };

  const loadSubscriptions = async () => {
    if (!user) return;
    const response = await fetchMySubscriptions();
    setSubscriptions(response.subscriptions);
  };

  const toggleSubNotification = async (targetId: string) => {
    if (!user) return;
    const current = subscriptions.find((s: any) => s.targetId === targetId);
    const nextNotify = !current?.notify;
    await updateSubscriptionNotify(targetId, nextNotify, user.id);
    await loadSubscriptions();
  };

  const canChangeNickname = () => {
    if (!lastNicknameChange) return true;
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (now - lastNicknameChange) >= TWO_WEEKS;
  };

  const getDaysUntilChange = () => {
    if (!lastNicknameChange) return 0;
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = now - lastNicknameChange;
    const remaining = TWO_WEEKS - diff;
    return Math.ceil(remaining / (1000 * 60 * 60 * 24));
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setError("");

    const response = await fetchMySettings();
    const currentSettings = response.settings || {};
    
    let isNicknameChanged = user.role === "musician" && currentSettings.nickname !== nickname;
    
    if (isNicknameChanged && !canChangeNickname()) {
      setError("닉네임은 2주에 1번만 변경할 수 있습니다.");
      return;
    }

    const nextLastNicknameChange = isNicknameChanged ? Date.now() : currentSettings.lastNicknameChange;

    await saveMySettings({
      nickname: user?.role === "musician" ? nickname : undefined,
      layout,
      language,
      notificationsEnabled,
      lastNicknameChange: nextLastNicknameChange,
    }, user.id);

    if (isNicknameChanged) {
      setLastNicknameChange(nextLastNicknameChange ?? null);
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await deleteMyAccount(deleteReason);
    window.location.href = "/";
  };

  const handleRequestUpgrade = () => {
    navigate("/musicians-application");
  };

  const deleteContent = async (contentId: string) => {
    if (!user) return;
    await deleteContentById(contentId, user.id);
    await loadContents();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "basic": return "기본 회원";
      case "musician": return "뮤지션";
      case "admin": return "관리자";
      default: return "사용자";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "심사 중...";
      case "approved": return "승인됨";
      case "rejected": return "거절됨";
      case "none": return "신청 안함";
      default: return "미정";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-4xl px-6"
      >
        <div className="bg-card/50 border border-white/10 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="text-4xl font-display font-bold mb-12 text-white border-b border-white/10 pb-6">마이페이지</h1>
          
          <div className="space-y-16">
            {/* 1. 계정정보 */}
            <section id="account" className="bg-background/80 rounded-xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="bg-primary/20 p-2 rounded-xl text-primary">👤</span> 계정정보
              </h2>
              <div className="bg-card rounded-xl p-6 space-y-4 border border-white/5">
                <div>
                  <label className="text-gray-400 text-sm">이름</label>
                  <p className="text-white font-semibold">{user.name}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">이메일</label>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">회원등급</label>
                  <p className="text-primary font-semibold">{getRoleLabel(user.role)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">뮤지션 승급 요청 상태</label>
                  <p className={`font-semibold ${user.upgradeRequestStatus === "approved" ? "text-green-400" : user.upgradeRequestStatus === "rejected" ? "text-red-400" : "text-gray-300"}`}>
                    {getStatusLabel(user.upgradeRequestStatus)}
                  </p>
                </div>
              </div>
              
              {user.role === "basic" && user.upgradeRequestStatus === "none" && (
                <Button
                  onClick={handleRequestUpgrade}
                  className="mt-4 bg-blue-500/90 text-white rounded-lg py-2 px-4 hover:bg-blue-500/80 transition-colors"
                >
                  뮤지션 지원하기
                </Button>
              )}
              {user.upgradeRequestStatus === "pending" && (
                <div className="mt-4 text-yellow-400 text-sm">
                  뮤지션 승급 요청이 대기 중입니다. 관리자의 승인을 기다리고 있습니다.
                </div>
              )}
              {user.upgradeRequestStatus === "rejected" && (
                <div className="mt-4 text-red-300 text-sm">
                  뮤지션 승급 요청이 거절되었습니다.
                </div>
              )}
            </section>

            {/* 2. 내활동 */}
            <section id="activity" className="bg-background/80 rounded-xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="bg-purple-500/20 p-2 rounded-xl text-purple-400">🎵</span> 내활동
              </h2>
              {user.role === "musician" ? (
                <>
                  <div className="mb-4">
                    <Button
                      onClick={() => navigate("/upload")}
                      className="bg-blue-500/90 text-white rounded-lg py-2 px-4 hover:bg-blue-500/80 transition-colors"
                    >
                      콘텐츠 업로드
                    </Button>
                  </div>
                  {contents.length === 0 ? (
                    <div className="bg-background rounded-xl p-4 text-gray-400 border border-white/5">
                      <p>업로드한 콘텐츠가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contents.map((content) => (
                        <div key={content.id} className="bg-background rounded-xl overflow-hidden border border-white/5 hover:border-primary transition-colors">
                          <div className="w-full h-32 bg-gray-800 overflow-hidden">
                            <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3">
                            <h3 className="text-white font-bold text-sm line-clamp-1">{content.title}</h3>
                            <p className="text-gray-400 text-xs mt-1">{content.category}</p>
                            <p className="text-gray-500 text-xs">{new Date(content.createdAt).toLocaleDateString()}</p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => navigate(`/content/${content.id}`)}
                                className="flex-1 bg-blue-500/90 text-white text-xs py-1 rounded-lg hover:bg-blue-500/80"
                              >
                                보기
                              </Button>
                              <Button
                                onClick={() => {
                                  const confirmed = window.confirm("정말 삭제하시겠습니까?");
                                    if (!confirmed) return;
                                    deleteContent(content.id);
                                }}
                                className="flex-1 bg-red-600/90 text-white text-xs py-1 rounded-lg hover:bg-red-600/80"
                              >
                                삭제
                              </Button>
                              

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-background rounded-xl p-4 text-gray-400 border border-white/5">
                  <p>뮤지션 승급 후 콘텐츠를 업로드할 수 있습니다.</p>
                </div>
              )}
            </section>

            {/* 3. 알림 관리 */}
            <section id="notifications" className="bg-background/80 rounded-xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="bg-green-500/20 p-2 rounded-xl text-green-400">🔔</span> 알림
              </h2>
              {subscriptions.length === 0 ? (
                <div className="bg-background rounded-xl p-4 text-gray-400 border border-white/5">
                  <p>구독 중인 뮤지션이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.targetId} className="flex items-center justify-between p-4 bg-background border border-white/5 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-500 rounded-full" />
                        <div>
                          <Link href={`/musician-profile/${sub.targetId}`}>
                            <a className="text-white font-bold hover:text-primary transition-colors">
                              {sub.name}
                            </a>
                          </Link>
                          <p className="text-xs text-gray-400">뮤지션</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-300">콘텐츠 알림</span>
                        <button
                          onClick={() => toggleSubNotification(sub.targetId)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            sub.notify ? "bg-primary" : "bg-gray-600"
                          }`}
                        >
                          <motion.div
                            layout
                            className={`absolute w-4 h-4 bg-white rounded-full top-1 ${
                              sub.notify ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. 설정 */}
            <section id="settings" className="bg-background/80 rounded-xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-400"></div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="bg-gray-500/20 p-2 rounded-xl text-gray-300">⚙️</span> 설정
              </h2>
              <div className="bg-card border border-white/5 rounded-xl p-6 space-y-8">
                
                {/* 닉네임 설정 - 뮤지션만 */}
                {user.role === "musician" && (
                  <div className="border-b border-white/10 pb-6">
                    <h3 className="text-lg font-bold mb-3 text-white">닉네임</h3>
                    <label className="block text-sm font-semibold mb-2">활동명</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-card border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="활동명을 입력해주세요"
                    />
                    {canChangeNickname() ? (
                      <p className="mt-2 text-sm text--400">닉네임변경이 가능합니다.</p>
                    ) : (
                      <p className="mt-2 text-sm text-red-400">
                        {getDaysUntilChange()}일 후 다시 변경할 수 있습니다.
                      </p>
                    )}
                  </div>
                )}

                {/* 영상 배치 설정 */}
                <div className="border-b border-white/10 pb-6">
                  <h3 className="text-lg font-bold mb-3 text-white">영상 배치</h3>
                  <div className="space-y-3">
                    {[
                      { value: "horizontal", label: "가로 배치 (기본)" },
                      { value: "vertical", label: "세로 배치" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center p-3 bg-card rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="layout"
                          value={option.value}
                          checked={layout === option.value}
                          onChange={(e) => setLayout(e.target.value as "horizontal" | "vertical")}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="text-white">{option.label}</span>
                      </label>
                    ))}
                    <p className="text-xs text-gray-400 mt-2">
                      {layout === "horizontal"
                        ? "영상 목록을 그리드로 표시합니다"
                        : "영상 목록을 한 줄에 1개씩 표시합니다"}
                    </p>
                  </div>
                </div>

                {/* 알림 설정 (전체) */}
                <div className="pb-2">
                  <h3 className="text-lg font-bold mb-3 text-white">전체 알림</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-semibold block">푸시 알림</label>
                      <p className="text-xs text-gray-400 mt-1">새로운 콘텐츠 등록 등의 중요한 알림을 받습니다.</p>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        notificationsEnabled ? "bg-primary" : "bg-gray-600"
                      }`}
                    >
                      <motion.div
                        layout
                        className={`absolute w-6 h-6 bg-white rounded-full top-1 ${
                          notificationsEnabled ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleSaveSettings}
                    className="flex-1 bg-blue-500/90 text-white rounded-xl py-3 hover:bg-blue-500/80 transition-colors"
                  >
                    설정 저장
                  </Button>
                </div>

                {settingsSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-green-300 text-sm text-center"
                  >
                    설정이 저장되었습니다
                  </motion.div>
                )}
              </div>
            </section>

            {/* 5. 회원 탈퇴 */}
            <section id="delete-account" className="bg-background/80 rounded-xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
                <span className="bg-red-500/20 p-2 rounded-xl text-red-400">⚠️</span> 계정 탈퇴
              </h2>
              <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
                <p className="text-gray-300 text-sm">
                  계정을 탈퇴하시면 모든 콘텐츠, 결제 내역, 프로필 정보가 영구적으로 삭제되며 복구할 수 없습니다.<br/>
                  탈퇴 전 사유를 남겨주시면 서비스 개선에 큰 도움이 됩니다.
                </p>

                <div className="space-y-4">
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors h-24 resize-none"
                    placeholder="탈퇴하시는 이유를 알려주세요. (선택사항)"
                  />
                  
                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-red-600/90 text-white border border-red-500/50 font-bold rounded-xl py-3 hover:bg-red-600/80 transition-colors"
                    >
                      회원 탈퇴 진행
                    </Button>
                  ) : (
                    <div className="bg-red-500/10 border border-white/10 rounded-xl p-4 space-y-4">
                      <p className="text-red-400 font-bold text-center">정말로 탈퇴하시겠습니까?</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleDeleteAccount}
                          className="flex-1 bg-red-600 text-white font-bold rounded-xl py-2 hover:bg-red-700 transition-colors"
                        >
                          네, 탈퇴합니다
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-gray-700 text-white font-bold rounded-xl py-2 hover:bg-gray-600 transition-colors"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
            
          </div>
        </div>
      </motion.div>
    </main>
  );
}
