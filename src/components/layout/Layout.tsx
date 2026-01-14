import Header from "./Header";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/sonner";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Toaster />
    </div>
  );
}
