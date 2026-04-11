import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("이메일과 비밀번호를 입력해 주세요.");
      }

      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-2"
      >
        <div className="bg-card border border-white/10 rounded-xl p-8">
          <h1 className="text-3xl font-display font-bold mb-6 text-white">로그인</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
                placeholder="이메일을 입력해 주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
                  placeholder="비밀번호를 입력해 주세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-blue-500/90 text-sm font-semibold text-white transition hover:bg-blue-500/80 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 mt-2"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <p className="text-left text-sm text-gray-400 mt-6">
            계정이 없으신가요?{" "}
            <a href="/signup" className="text-primary text-sm hover:underline">
              회원가입
            </a>
          </p>

          <p className="text-left text-sm text-gray-400 mt-4">
            비밀번호를 잊어버리셨나요?{" "}
            <a href="/reset-password" className="text-primary text-sm hover:underline">
              비밀번호 재설정
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}