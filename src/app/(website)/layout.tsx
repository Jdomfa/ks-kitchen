import { CartProvider } from "@/lib/cart-context";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { Header } from "@/components/layout/Header";
import ReservationChatWidget from "@/components/reservation/ReservationChatWidget";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SplashScreen />

      <CartProvider>
        <Header />

        {children}

        <ReservationChatWidget />
      </CartProvider>
    </>
  );
}
