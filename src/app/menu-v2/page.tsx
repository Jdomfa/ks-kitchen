import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AccordionMenuSection } from '@/components/AccordionMenuSection';

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
