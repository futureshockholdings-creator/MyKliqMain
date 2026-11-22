import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function Disclaimer() {
  useUiLanguage();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <PageWrapper className="!bg-white">
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 !bg-white !text-black">
        <div>
          <Link href={user ? "/profile" : "/"}>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
              <Home className="w-5 h-5" />
              <span>{uiText("HOME")}</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold mb-8 !text-black">{uiText("Disclaimer")}</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 !text-black">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("General Disclaimer")}</h2>
              <p className="mb-4">
                {uiText("The information and services provided by MyKliq are for general informational and entertainment purposes only. While we strive to provide accurate and up-to-date information, we make no warranties or representations about the completeness, accuracy, reliability, suitability, or availability of the platform or its content.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("User-Generated Content")}</h2>
              <p className="mb-4">
                {uiText("MyKliq allows users to create, share, and interact with content. We are not responsible for:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("The accuracy, completeness, or reliability of user-generated content")}</li>
                <li>{uiText("Views, opinions, or statements expressed by users")}</li>
                <li>{uiText("Content that may be offensive, inappropriate, or harmful")}</li>
                <li>{uiText("Interactions between users on or off the platform")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Platform Availability")}</h2>
              <p className="mb-4">
                {uiText("We strive to maintain continuous service availability, but MyKliq may experience:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Temporary interruptions for maintenance or updates")}</li>
                <li>{uiText("Technical difficulties or server issues")}</li>
                <li>{uiText("Service limitations or feature changes")}</li>
              </ul>
              <p className="mb-4">
                {uiText("We are not liable for any inconvenience or loss resulting from service interruptions.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Third-Party Links and Services")}</h2>
              <p className="mb-4">
                {uiText("MyKliq may contain links to external websites or integrate with third-party services. We are not responsible for the content, privacy practices, or availability of external sites or services.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Limitation of Liability")}</h2>
              <p className="mb-4">
                {uiText("To the fullest extent permitted by law, MyKliq and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Use or inability to use the platform")}</li>
                <li>{uiText("User interactions or relationships formed through the platform")}</li>
                <li>{uiText("Loss of data, privacy breaches, or security incidents")}</li>
                <li>{uiText("Technical errors, bugs, or system failures")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Age Restrictions")}</h2>
              <p className="mb-4">
                {uiText("MyKliq is intended for users aged 13 and older. Users under 18 should obtain parental consent before using the platform. Parents and guardians are responsible for monitoring their minor children's online activities.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Changes to This Disclaimer")}</h2>
              <p className="mb-4">
                {uiText("We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon posting. Continued use of MyKliq constitutes acceptance of any modifications.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Contact Information")}</h2>
              <p className="mb-4">
                {uiText("If you have questions about this disclaimer, please contact us at")}{" "}
                <a href="mailto:mykliqassistance@outlook.com" className="text-primary hover:underline">
                  {uiText("mykliqassistance@outlook.com")}
                </a>
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                {uiText("Last updated: August 23, 2025")}
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}