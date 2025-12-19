import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";

export default function Disclaimer() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageWrapper className="!bg-white">
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 !bg-white !text-black">
        <div>
          <Link href={user ? "/profile" : "/"}>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
              <Home className="w-5 h-5" />
              <span>HOME</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold mb-8 !text-black">Disclaimer</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 !text-black">
            <section>
              <h2 className="text-2xl font-semibold mb-4">General Disclaimer</h2>
              <p className="mb-4">
                The information and services provided by MyKliq are for general informational and entertainment purposes only. 
                While we strive to provide accurate and up-to-date information, we make no warranties or representations about 
                the completeness, accuracy, reliability, suitability, or availability of the platform or its content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User-Generated Content</h2>
              <p className="mb-4">
                MyKliq allows users to create, share, and interact with content. We are not responsible for:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>The accuracy, completeness, or reliability of user-generated content</li>
                <li>Views, opinions, or statements expressed by users</li>
                <li>Content that may be offensive, inappropriate, or harmful</li>
                <li>Interactions between users on or off the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Platform Availability</h2>
              <p className="mb-4">
                We strive to maintain continuous service availability, but MyKliq may experience:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Temporary interruptions for maintenance or updates</li>
                <li>Technical difficulties or server issues</li>
                <li>Service limitations or feature changes</li>
              </ul>
              <p className="mb-4">
                We are not liable for any inconvenience or loss resulting from service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Third-Party Links and Services</h2>
              <p className="mb-4">
                MyKliq may contain links to external websites or integrate with third-party services. 
                We are not responsible for the content, privacy practices, or availability of external sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                To the fullest extent permitted by law, MyKliq and its operators shall not be liable for any direct, 
                indirect, incidental, consequential, or punitive damages arising from:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Use or inability to use the platform</li>
                <li>User interactions or relationships formed through the platform</li>
                <li>Loss of data, privacy breaches, or security incidents</li>
                <li>Technical errors, bugs, or system failures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Age Restrictions</h2>
              <p className="mb-4">
                MyKliq is intended for users aged 13 and older. Users under 18 should obtain parental consent before using the platform. 
                Parents and guardians are responsible for monitoring their minor children's online activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Disclaimer</h2>
              <p className="mb-4">
                We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon posting. 
                Continued use of MyKliq constitutes acceptance of any modifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="mb-4">
                If you have questions about this disclaimer, please contact us at{" "}
                <a href="mailto:mykliqassistance@outlook.com" className="text-primary hover:underline">
                  mykliqassistance@outlook.com
                </a>
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                Last updated: August 23, 2025
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}