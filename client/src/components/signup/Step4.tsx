import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  name: string;
  setName: (v: string) => void;

  password: string;
  confirmPassword: string;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  error: string;
  setError: (v: string) => void;
};

export function StepFourPassword({
  name,
  setName,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  error,
  setError,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  return (
    <section>
      <h1 className="text-2xl font-bold">
        이름을 작성해 주세요
      </h1>

      <div className="mt-5 space-y-4">
        {/* ✅ 이름 */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
        />
      <div>

      </div>

      <h1 className="text-2xl font-bold">
          비밀번호를 작성해 주세요
      </h1>
      <p className="mt-2 text-sm text-white/60">
        영어 + 특수문자를 포함한 8자 이상
      </p>

        {/* 비밀번호 */}
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="비밀번호"
            className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* 재입력 */}
        <div className="mt-5 relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            placeholder="비밀번호 재입력"
            className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showConfirmPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
      </div>
    </section>
  );
}