import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuSection } from "@/components/MenuSection";

export default function MenuPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <MenuSection />
      </main>
      <Footer />
    </>
  );
}
