import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
