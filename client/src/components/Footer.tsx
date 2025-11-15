import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-12 pt-8 border-t border-border">
      <div className="container mx-auto px-4 py-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-900 dark:text-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="font-medium">© 2025 MyKliq</span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link href="/privacy-policy" className="font-medium hover:underline transition-all text-sm sm:text-base">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="font-medium hover:underline transition-all text-sm sm:text-base">
                Disclaimer
              </Link>
              <Link href="/community-guidelines" className="font-medium hover:underline transition-all text-sm sm:text-base whitespace-nowrap">
                Community Guidelines
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
        
        {/* Futureshock Holdings Link */}
        <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
          <a 
            href="https://futureshockholdings.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline transition-all"
          >
            Owned and Operated by Futureshock Holdings, LLC
          </a>
        </div>
      </div>
    </footer>
  );
}