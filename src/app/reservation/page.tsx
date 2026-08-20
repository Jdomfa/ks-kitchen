import { Footer } from '@/components/Footer';
import { ReservationSection } from '@/components/ReservationSection';

export default function ReservationPage() {
  return (
    <>
      <main className="flex-1">
        <ReservationSection />
      </main>
      <Footer />
    </>
  );
}
