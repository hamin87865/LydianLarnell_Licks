import musicBg from "@/assets/music-bg.webp";
import { Link } from "wouter";
import { Hero } from "@/components/Hero";
import { LickIntroSection } from "@/components/LickIntroSection";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#1a1a1a] text-foreground selection:bg-primary selection:text-white">
      {/* 고정 배경 이미지 */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src={musicBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />

        {/* 배경 보정 */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
      </div>

      {/* 실제 콘텐츠 (스크롤됨) */}
      <div className="relative z-10">
        {/* 첫 화면 */}
        <section className="min-h-screen">
          <Hero />
        </section>

        {/* 아래 콘텐츠 */}
        <section className="bg-black/20 backdrop-blur-sm">
          <LickIntroSection />

          <footer className="border-t border-white/10 bg-[#1a1a1a] py-12 text-center">
            {/* 브랜드 */}
            <p className="text-display mb-6 text-4xl font-black tracking-tighter opacity-20">
              Lydian Larnell
            </p>

            {/* 연락처 */}
            <div className="mb-6 space-y-2 text-sm text-gray-400">
              <p>
                Email:{" "}
                <a
                  href="mailto:connect.music@lydianlarnelllicks.com"
                  className="transition hover:text-white"
                >
                  connect.music@lydianlarnelllicks.com
                </a>
              </p>
              <p>
                대표전화:{" "}
                <a
                  href="tel:07089852877"
                  className="transition hover:text-white"
                >
                  070-8985-2877
                </a>
              </p>
            </div>

            {/* 대표전화 아래 구분선 */}
            <div className="mx-auto my-6 w-full max-w-120 border-t-2 border-white/20" />

            {/* 정책 링크 */}
            <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 text-sm text-gray-400">
              <Link href="/terms" className="transition hover:text-white">
                이용약관
              </Link>
              <span className="text-white/20">|</span>

              <Link href="/privacy" className="transition hover:text-white">
                개인정보 처리방침
              </Link>
              <span className="text-white/20">|</span>

              <Link href="/refund" className="transition hover:text-white">
                콘텐츠 구매 및 환불정책
              </Link>
              <span className="text-white/20">|</span>

              <Link href="/business" className="transition hover:text-white">
                사업자정보
              </Link>
            </div>

            {/* 저작권 */}
            <p className="font-mono text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Lydian Larnell. ALL RIGHTS RESERVED.
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}