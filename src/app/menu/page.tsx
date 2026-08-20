import { Footer } from '@/components/Footer';
import { MenuSection } from '@/components/MenuSection';
import { MenuSectionTrial } from '@/components/MenuSectionTrial';

export default function MenuPage() {
  return (
    <>
      <main className="flex-1">
        <MenuSectionTrial />
      </main>
      <Footer />
    </>
  );
}
