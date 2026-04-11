import { motion } from "framer-motion";

export function Hero() {
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center">
      <div className="container relative z-20 px-6 mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-tight text-white">
            음악의 여정 <br />
            Lydian Larnell과 <br />
            함께하세요
          </h1>
        </motion.div>
      </div>

      {/* 가로 스크롤 바 (모션 추가) */}
      <motion.button
        onClick={scrollToBottom}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.9,
          delay: 1.0,
          ease: "easeOut",
        }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-100 h-1.5 rounded-full bg-white/30 transition-colors hover:bg-white"
      />
    </section>
  );
}