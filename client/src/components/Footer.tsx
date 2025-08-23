import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-12 pt-8 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="font-medium">© 2025 MyKliq</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="hover:text-foreground transition-colors">
                Disclaimer
              </Link>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="max-w-md">
              By using MyKliq, you agree to our terms of service and privacy policy. 
              Content shared is subject to community guidelines.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}