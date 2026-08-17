import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReservationSection } from '@/components/ReservationSection';

export default function ReservationPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ReservationSection />
      </main>
      <Footer />
    </>
  );
}
