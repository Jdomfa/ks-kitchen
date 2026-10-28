import { Footer } from "@/components/layout/Footer";
import ReservationPageClient from "@/components/reservation/ReservationPageClient";

export default function ReservationPage() {
  return (
    <>
      <main className="flex-1">
        <ReservationPageClient />
      </main>
      <Footer />
    </>
  );
}
