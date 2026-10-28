import { Footer } from "@/components/Footer";
import ReservationPageClient from "@/components/ReservationPageClient";

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
