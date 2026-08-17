import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuSection } from '@/components/MenuSection';
import { MenuSectionTrial } from '@/components/MenuSectionTrial';

export default function MenuPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <MenuSectionTrial />
      </main>
      <Footer />
    </>
  );
}
