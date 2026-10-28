import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccordionMenuSection } from "@/components/menu/AccordionMenuSection";

export default function MenuV2Page() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <AccordionMenuSection />
      </main>
      <Footer />
    </>
  );
}
