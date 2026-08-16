"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/shop-data";
import { DietaryTags } from "./DietaryIcons";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Check } from "lucide-react";

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id: product.id, name: `${product.name} (${product.size})`, price: product.price });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6 text-center"
    >
      <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-curry-leaf/10">
        <span className="font-hand text-2xl text-curry-leaf">K&apos;s</span>
      </div>
      <h3 className="font-display text-lg text-roasted-coffee">{product.name}</h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-brushed-brass">{product.size}</p>
      <p className="mt-2 font-sans text-sm text-roasted-coffee/70 flex-1">
        {product.description}
      </p>
      <DietaryTags tags={product.tags} />
      <p className="mt-3 font-sans text-sm text-roasted-coffee">{formatNaira(product.price)}</p>
      <button
        onClick={handleAdd}
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" /> Added
          </>
        ) : (
          "Add to cart"
        )}
      </button>
    </motion.div>
  );
}
