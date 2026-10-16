import type { Metadata } from "next";
import ManageReservationPageClient from "@/components/ManageReservationClient";

export const metadata: Metadata = {
  title: "Manage Reservation | K's Kitchen Gourmet",
  description: "View, update or cancel your K's Kitchen Gourmet reservation.",
};

export default function ManageReservationPage() {
  return <ManageReservationPageClient />;
}
