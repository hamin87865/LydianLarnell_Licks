import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product1.png";
import product2 from "@/assets/product2.png";
import product3 from "@/assets/product3.png";

const products = [
  {
    id: 1,
    name: "AERO-X SMARTWATCH",
    category: "WEARABLE",
    price: "₩349,000",
    image: product1,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
  },
  {
    id: 2,
    name: "SONIC BUDS PRO",
    category: "AUDIO",
    price: "₩199,000",
    image: product2,
    colSpan: "col-span-1",
  },
  {
    id: 3,
    name: "ZERO GRAVITY SNEAKER",
    category: "FOOTWEAR",
    price: "₩229,000",
    image: product3,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
  }
];

export function FeaturedProducts() {
  return (
    <section className="py-32 bg-background relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-4">
              LATEST DROP
            </h2>
            <p className="text-gray-400 max-w-md">
              완벽한 퍼포먼스를 위해 설계된 최신 컬렉션을 만나보세요. 
              기술과 디자인의 완벽한 조화.
            </p>
          </div>
          <Button variant="link" className="text-primary p-0 h-auto font-bold tracking-wide uppercase hover:text-white transition-colors group">
            View All Products
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[400px]">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative bg-card overflow-hidden rounded-xl border border-white/5 hover:border-white/20 transition-colors ${product.colSpan}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              
              <motion.img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <span className="text-xs font-bold tracking-widest text-primary mb-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {product.category}
                </span>
                <h3 className="text-2xl font-display font-bold mb-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <p className="font-mono text-gray-300">{product.price}</p>
                  <Button size="icon" className="rounded-full bg-white text-black hover:bg-primary hover:text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
