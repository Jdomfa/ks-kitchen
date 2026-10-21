import { Footer } from "@/components/Footer";
import ReservationPageClient from "@/components/ReservationPageClient";
import { ReservationSection } from "@/components/ReservationSection";

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
