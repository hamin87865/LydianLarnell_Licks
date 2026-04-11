import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { fetchMySettings, saveMySettings } from "@/lib/appApi";

export default function EditProfile() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastNicknameChange, setLastNicknameChange] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "musician") {
      navigate("/");
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetchMySettings();
        const mySettings = response.settings || {};

        setNickname(mySettings.nickname || user.name);
        setProfileImagePreview(mySettings.profileImage || "");
        setBio(mySettings.bio || "");
        setEmail(mySettings.email || user.email || "");
        setInstagram(mySettings.instagram || "");
        setLastNicknameChange(mySettings.lastNicknameChange || null);
      } catch (error) {
        console.error("프로필 설정 로딩 실패", error);
      }
    };

    void loadSettings();
  }, [isAuthenticated, navigate, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setProfileImage(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setProfileImagePreview(objectUrl);
  };

  const canChangeNickname = () => {
    if (!lastNicknameChange) return true;
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    return Date.now() - lastNicknameChange >= TWO_WEEKS;
  };

  const getDaysUntilChange = () => {
    if (!lastNicknameChange) return 0;
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const remaining = TWO_WEEKS - (Date.now() - lastNicknameChange);
    return Math.max(1, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) return;

    const settingsResponse = await fetchMySettings();
    const mySettings = settingsResponse.settings || {};
    const trimmedNickname = nickname.trim();
    const trimmedBio = bio.trim();
    const trimmedEmail = email.trim();
    const trimmedInstagram = instagram.trim().replace(/^@+/, "");
    const currentNickname = mySettings.nickname || user.name;
    const isNicknameChanged = currentNickname !== trimmedNickname;

    if (!trimmedNickname) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    if (isNicknameChanged && !canChangeNickname()) {
      setError("닉네임은 2주에 1번만 변경할 수 있습니다.");
      return;
    }

    try {
      const nextLastNicknameChange = isNicknameChanged ? Date.now() : mySettings.lastNicknameChange;

      const payload = new FormData();
      payload.append("nickname", trimmedNickname);
      payload.append("bio", trimmedBio);
      payload.append("email", trimmedEmail);
      payload.append("instagram", trimmedInstagram);
      payload.append("layout", mySettings.layout || "horizontal");
      payload.append("language", mySettings.language || "ko");
      payload.append("notificationsEnabled", String(mySettings.notificationsEnabled !== false));
      if (nextLastNicknameChange) {
        payload.append("lastNicknameChange", String(nextLastNicknameChange));
      }
      if (profileImage) {
        payload.append("profileImageFile", profileImage);
      }

      await saveMySettings(payload, user.id);
      setLastNicknameChange(nextLastNicknameChange || null);
      setSuccess("프로필이 저장되었습니다.");

      setTimeout(() => {
        navigate("/musician-profile");
      }, 600);
    } catch (saveError) {
      setError("저장 중 오류가 발생했습니다.");
    }
  };

  if (!user || user.role !== "musician") return null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-16 ">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-3xl px-6"
      >
        <div className="overflow-hidden rounded-xl border border-white/10 bg-card shadow-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-6 md:px-8">
            <h1 className="text-3xl font-display font-bold text-white md:text-4xl">프로필 편집 페이지</h1>
          </div>

          <form onSubmit={handleSave} className="space-y-8 px-6 py-8 md:px-8">
            <section className="flex flex-col items-center justify-center gap-4 border-b border-white/10 pb-8">
              <div className="relative h-36 w-36 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-lg">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="프로필 미리보기" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">👤</div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition-opacity md:opacity-0 md:hover:opacity-100"
                  aria-label="프로필 사진 변경"
                >
                  <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                    <Pencil className="h-4 w-4" />
                    사진 편집
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-400">사진 위 연필 버튼을 눌러 업로드할 수 있습니다.</p>
            </section>

            <section className="grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white"
                  placeholder="활동명을 입력해 주세요"
                />
                {canChangeNickname() ? (
                  <p className="mt-2 text-sm text--400">닉네임변경이 가능합니다.</p>
                ) : (
                  <p className="mt-2 text-sm text-red-400">
                    {getDaysUntilChange()}일 후 다시 변경할 수 있습니다.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">소개글</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[140px] w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white"
                  placeholder="소개글을 입력해 주세요"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-white outline-none transition-colors focus:border-white"
                  placeholder="연락받을 메일을 입력해 주세요"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">인스타 아이디</label>
                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-background ">
                  <span className="flex items-center border-r border-white/10 px-4 text-gray-400">@</span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-white outline-none"
                    placeholder="아이디만 입력해 주세요"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-400">
                {success}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <Button type="submit" className="flex-1 rounded-xl bg-blue-500/90 py-4 font-bold text-white hover:bg-blue-500/80">
                저장
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/musician-profile")}
                className="flex-1 rounded-xl bg-white/10 py-4 font-bold text-white hover:bg-white/15"
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
