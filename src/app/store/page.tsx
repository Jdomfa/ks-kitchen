import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/shop-data";

export default function StorePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-14">
            <h1 className="font-display text-4xl md:text-5xl text-roasted-coffee">
              The Pantry
            </h1>
            <p className="mt-3 font-sans text-roasted-coffee/70 max-w-md mx-auto">
              Take a piece of the kitchen home. Order ahead and collect when
              you come in to dine — no delivery, just the same jars we cook
              with.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
