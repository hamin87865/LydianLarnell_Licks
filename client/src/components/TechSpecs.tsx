import { motion } from "framer-motion";

export function TechSpecs() {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 z-0 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-8 leading-[1.1]">
              ENGINEERED FOR <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">TOMORROW</span>
            </h2>
            <div className="space-y-8">
              {[
                { title: "ADAPTIVE CUSHIONING", desc: "사용자의 움직임을 실시간으로 분석하여 최적의 쿠셔닝을 제공합니다." },
                { title: "AERO-KNIT UPPER", desc: "초경량 소재로 통기성을 극대화하여 쾌적한 착용감을 유지합니다." },
                { title: "ENERGY RETURN", desc: "착지 시 발생하는 에너지를 흡수하여 다음 발걸음의 추진력으로 전환합니다." }
              ].map((spec, i) => (
                <div key={i} className="border-l-2 border-primary/50 pl-6 py-2 hover:border-primary transition-colors">
                  <h3 className="text-xl font-bold mb-2 font-display">{spec.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{spec.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-full border border-white/10 flex items-center justify-center p-8 relative animate-[spin_60s_linear_infinite]">
              <div className="absolute inset-0 rounded-full border-t border-primary/50" />
              <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center p-8">
                <div className="w-full h-full rounded-full border border-white/5" />
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-black/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
                <div className="text-6xl font-black font-display text-primary mb-2">98%</div>
                <div className="text-sm font-bold tracking-widest uppercase text-gray-400">Energy Return</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
