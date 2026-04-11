import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchMySettings, saveMySettings } from "@/lib/appApi";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [nickname, setNickname] = useState("");
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [lastNicknameChange, setLastNicknameChange] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetchMySettings();
        const userSettings = response.settings || {};
        if (userSettings.nickname) setNickname(userSettings.nickname);
        if (userSettings.layout) setLayout(userSettings.layout);
        if (userSettings.language) setLanguage(userSettings.language);
        if (userSettings.notificationsEnabled !== undefined) {
          setNotificationsEnabled(userSettings.notificationsEnabled);
        }
        setLastNicknameChange(userSettings.lastNicknameChange || null);
        if (!userSettings.nickname && user.role === "musician") {
          setNickname(user.name);
        }
      } catch (error) {
        console.error("설정 로딩 실패", error);
        if (user.role === "musician") setNickname(user.name);
      }
    };

    void loadSettings();
  }, [isAuthenticated, navigate, user]);

  const canChangeNickname = () => {
    if (!lastNicknameChange) return true;
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    return Date.now() - lastNicknameChange >= TWO_WEEKS;
  };

  const handleSave = async () => {
    if (!user) return;

    const response = await fetchMySettings();
    const currentSettings = response.settings || {};
    const nextNickname = nickname.trim();
    const currentNickname = currentSettings.nickname || user.name;
    const isNicknameChanged = user.role === "musician" && currentNickname !== nextNickname;

    setError("");

    if (user.role === "musician") {
      if (!nextNickname) {
        setError("닉네임을 입력해 주세요.");
        return;
      }

      if (isNicknameChanged && !canChangeNickname()) {
        setError("닉네임은 2주에 1번만 변경할 수 있습니다.");
        return;
      }
    }

    const nextLastNicknameChange = isNicknameChanged ? Date.now() : currentSettings.lastNicknameChange;
    await saveMySettings({
      nickname: user.role === "musician" ? nextNickname : currentSettings.nickname,
      layout,
      language,
      notificationsEnabled,
      lastNicknameChange: nextLastNicknameChange,
    }, user.id);
    if (isNicknameChanged) {
      setLastNicknameChange(nextLastNicknameChange || null);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-2xl px-6 pb-12"
      >
        <div className="rounded-lg border border-white/10 bg-card p-8">
          <h1 className="mb-8 text-4xl font-display font-bold text-white">설정</h1>

          <div className="space-y-8">
            {user.role === "musician" && (
              <section className="border-b border-white/10 pb-6">
                <h2 className="mb-4 text-xl font-bold text-white">닉네임</h2>
                <div className="rounded bg-background p-4">
                  <label className="mb-2 block text-sm font-semibold">활동명</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full rounded border border-white/10 bg-background px-4 py-2 text-white transition-colors focus:border-primary focus:outline-none"
                    placeholder="활동명을 입력해주세요"
                  />
                  <p className="mt-2 text-xs text-gray-400">프로필 편집 페이지와 같은 닉네임 데이터를 사용합니다.</p>
                  {!canChangeNickname() && (
                    <p className="mt-2 text-xs text-red-400">닉네임은 2주에 1번만 변경할 수 있습니다.</p>
                  )}
                </div>
              </section>
            )}

            <section className="border-b border-white/10 pb-6">
              <h2 className="mb-4 text-xl font-bold text-white">영상 배치</h2>
              <div className="space-y-3">
                {[
                  { value: "horizontal", label: "가로 배치 (기본)" },
                  { value: "vertical", label: "세로 배치" },
                ].map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center rounded border border-white/5 bg-background p-3 transition-colors hover:border-white/10">
                    <input
                      type="radio"
                      name="layout"
                      value={option.value}
                      checked={layout === option.value}
                      onChange={(e) => setLayout(e.target.value as "horizontal" | "vertical")}
                      className="mr-3 h-4 w-4"
                    />
                    <span className="text-white">{option.label}</span>
                  </label>
                ))}
                <p className="mt-2 text-xs text-gray-400">
                  {layout === "horizontal" ? "영상 목록을 그리드로 표시합니다" : "영상 목록을 한 줄에 1개씩 표시합니다"}
                </p>
              </div>
            </section>

            <section className="border-b border-white/10 pb-6">
              <h2 className="mb-4 text-xl font-bold text-white">언어</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "ko" | "en")}
                className="w-full rounded border border-white/10 bg-background px-4 py-2 text-white transition-colors focus:border-primary focus:outline-none"
              >
                <option value="ko">한국어</option>
                <option value="en">ENGLISH</option>
              </select>
              <p className="mt-2 text-xs text-gray-400">사이트 언어를 선택합니다</p>
            </section>

            <section className="pb-6">
              <h2 className="mb-4 text-xl font-bold text-white">알림</h2>
              <div className="flex items-center justify-between rounded bg-background p-4">
                <div>
                  <label className="block font-semibold text-white">푸시 알림</label>
                  <p className="mt-1 text-xs text-gray-400">중요한 알림을 받을 수 있습니다</p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative h-8 w-14 rounded-full transition-colors ${notificationsEnabled ? "bg-primary" : "bg-gray-600"}`}
                >
                  <motion.div
                    layout
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white ${notificationsEnabled ? "right-1" : "left-1"}`}
                  />
                </button>
              </div>
            </section>

            {error && <div className="rounded border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1 rounded py-3 font-bold text-white hover:bg-primary/90">
                저장
              </Button>
              <Button onClick={() => navigate("/mypage")} className="flex-1 rounded bg-gray-700 py-3 font-bold text-white hover:bg-gray-600">
                취소
              </Button>
            </div>

            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded border border-green-500/50 bg-green-500/20 p-3 text-center text-sm text-green-300"
              >
                ✓ 설정이 저장되었습니다
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
