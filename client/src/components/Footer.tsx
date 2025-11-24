import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-12 pt-8 border-t !border-gray-300">
      <div className="container mx-auto px-4 py-6 !bg-white backdrop-blur rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm !text-black">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="font-medium !text-black">© 2025 MyKliq</span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
              <Link href="/privacy-policy" className="font-medium hover:underline transition-all text-xs sm:text-sm !text-black">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="font-medium hover:underline transition-all text-xs sm:text-sm !text-black">
                Disclaimer
              </Link>
              <Link href="/community-guidelines" className="font-medium hover:underline transition-all text-xs sm:text-sm !text-black">
                Guidelines
              </Link>
              <Link href="/contact-us" className="font-medium hover:underline transition-all text-xs sm:text-sm !text-black" data-testid="link-contact-us">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="max-w-md !text-black">
              By using MyKliq, you agree to our terms of service and privacy policy. 
              Content shared is subject to community guidelines.
            </p>
          </div>
        </div>
        
        {/* Futureshock Holdings Link */}
        <div className="text-center mt-4 pt-4 border-t !border-gray-300 !text-black">
          <a 
            href="https://futureshockholdings.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline transition-all !text-black"
          >
            Owned and Operated by Futureshock Holdings, LLC
          </a>
        </div>
      </div>
    </footer>
  );
}