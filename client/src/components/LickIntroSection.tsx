import { motion } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const reasons = [
  {
    title: "즉흥 연주를 더 자연스럽게",
    desc: "솔로를 할 때 매번 새로운 멜로디를 만드는 것이 아닌, \n나에게 익숙하며 곡에 어울리는 Lick을 꺼내어 사용할 수 있습니다.",
  },
  {
    title: "장르의 스타일을 더 분명하게",
    desc: "Lick에는 장르 특유의 느낌이 녹아져 있습니다. \n \nBlues Lick -> Blue Note \nJazz Lick -> Chord Tone + Chromatic \nRock Lick -> Pentatonic",
  },
  {
    title: "연주자 사이의 음악적 언어로",
    desc: "익숙한 Lick은 연주자들 사이에서 빠르게 통하는 공통 언어가 됩니다. \n앙상블과 세션에서도 더 깊고 빠른 소통이 가능해집니다.",
  },
  {
    title: "실력 향상의 속도를 높이기 위해",
    desc: "좋은 연주자들은 많은 Lick을 익히고, 12 key로 돌리고, 상황에 맞게 응용합니다. \n그 과정이 곧 연주력과 표현력을 빠르게 성장시킵니다.",
  },
];

export function LickIntroSection() {
  return (
    <section className="relative w-full px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-5xl">
        {/* 상단 소개 */}
        <Reveal className="text-center">
          <h2 className="text-4xl font-bold leading-tight text-white md:text-6xl">
            음악에서 Lick 이란?
          </h2>

          <div className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75 md:text-2xl md:leading-10">
            <p>Lick은 짧은 멜로디 패턴이나 프레이즈이며,</p>
            <p>연주자의 개성과 음악적 어휘를 보여주는 중요한 요소입니다.</p>
          </div>
        </Reveal>

        {/* 중심 문장 */}
        <Reveal delay={0.06} className="mt-20 text-center md:mt-24">
          <p className="text-xl text-white/55 md:text-2xl">문장 = Solo</p>
          <p className="mt-3 text-4xl font-bold text-white md:text-6xl">
            단어 = Lick
          </p>
        </Reveal>

        {/* 이유 헤더 */}
        <Reveal delay={0.1} className="mt-28 text-center md:mt-32">
          <h3 className="text-3xl font-bold text-white md:text-5xl">
            왜 Lick을 사용하는가
          </h3>
        </Reveal>

        {/* 이유 리스트 */}
        <div className="mt-14 border-t border-white/10">
          {reasons.map((item, index) => (
            <Reveal
              key={item.title}
              delay={0.14 + index * 0.05}
              className="border-b border-white/10"
            >
              <div className="py-10 md:py-14">
                <h4 className="mt-3 text-2xl font-semibold leading-snug text-white md:text-4xl">
                  {item.title}
                </h4>

                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 md:text-xl md:leading-9 whitespace-pre-line">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* 하단 마무리 */}
        <Reveal delay={0.38} className="mt-24 text-center md:mt-28">
          <h3 className="text-3xl font-bold leading-tight text-white md:text-5xl">
            Lick은 음악에서 빼낼 수 없는 존재입니다
          </h3>

          <div className="mt-10 space-y-4 text-lg text-white/72 md:text-2xl md:space-y-5">
            <p>일정 이상 수준을 원하는 취미생</p>
            <p>음악 학교 입시생 · 전공자</p>
            <p>프로 뮤지션</p>
          </div>

          <p className="mx-auto mt-12 max-w-3xl text-lg leading-8 text-white/68 md:text-2xl md:leading-10">
            모두가 연습하고 실전에 적용하는 핵심 스킬입니다.
          </p>
        </Reveal>

        {/* 마지막 문장 */}
        <Reveal delay={0.44} className="mt-24 text-center md:mt-28">
          <p className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight text-white md:text-5xl md:leading-tight">
            단순한 악기 연주가 아닌
            <br className="hidden md:block" />
            음악을 시작해 보세요
          </p>
        </Reveal>
      </div>
    </section>
  );
}