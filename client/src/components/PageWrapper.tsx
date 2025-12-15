import Footer from "./Footer";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

export function PageWrapper({ children, className, showFooter = true }: PageWrapperProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
