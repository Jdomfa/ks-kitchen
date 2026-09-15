import { CartProvider } from '@/lib/cart-context';
import { SplashScreen } from '@/components/SplashScreen';
import { Header } from '@/components/Header';
import ReservationChatWidget from '@/components/ReservationChatWidget';

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