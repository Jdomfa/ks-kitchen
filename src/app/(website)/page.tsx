import { Header } from '@/components/Header';
import { HeroIntro } from '@/components/HeroIntro';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <HeroIntro />
      </main>
    </>
  );
}
