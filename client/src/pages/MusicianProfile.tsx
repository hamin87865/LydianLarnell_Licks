import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/contexts/AuthContext";
import { fetchMusicianProfile, type ContentItem } from "@/lib/appApi";

export default function MusicianProfile() {
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const musicianId = params.get("id");

  const [musician, setMusician] = useState<User | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.id || currentUser.role === "basic") {
        navigate("/");
        return;
      }

      if (!musicianId) {
        navigate("/");
        return;
      }

      try {
        const response = await fetchMusicianProfile(musicianId);
        if (!response.user) {
          navigate("/");
          return;
        }

        setMusician(response.user);
        setContents(response.contents);
      } catch (error) {
        console.error("뮤지션 프로필 로딩 실패", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [currentUser?.id, currentUser?.role, musicianId, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    );
  }

  if (!musician) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
        <p className="text-gray-400">뮤지션 정보를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-4xl"
      >
        <div className="bg-card border border-white/10 rounded-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mb-4" />
            <h1 className="text-4xl font-display font-bold text-white">{musician.name}</h1>
            <p className="text-primary font-semibold mt-2">뮤지션</p>
            <p className="text-gray-400 mt-4">{musician.email}</p>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-white">활동</h2>
          {contents.length === 0 ? (
            <div className="text-gray-400">
              <p>업로드된 영상이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contents.map((content) => (
                <div key={content.id} className="bg-background rounded p-4 border border-white/5">
                  <h3 className="text-white font-bold mb-2">{content.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{content.description}</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/content/${content.id}`)}
                    className="text-primary hover:underline text-sm"
                  >
                    영상 보기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
