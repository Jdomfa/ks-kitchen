import type { Metadata } from 'next';
import { ContactSection } from '@/components/ContactSection';

export const metadata: Metadata = {
  title: "Contact | K's Kitchen",
  description:
    "Get in touch with K's Kitchen — reservations, feedback, press & events, or just to say hi.",
};

export default function ContactPage() {
  return <ContactSection />;
}
