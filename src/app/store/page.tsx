import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoreSection } from '@/components/StoreSection';

export default function StorePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <StoreSection />
      </main>
      <Footer />
    </>
  );
}
