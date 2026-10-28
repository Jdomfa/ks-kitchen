import type { Metadata } from "next";
import { CheckoutPage } from "@/components/store/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | K's Kitchen Store",
};

export default function Page() {
  return <CheckoutPage />;
}
