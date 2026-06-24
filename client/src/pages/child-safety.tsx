import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";

export default function ChildSafety() {
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
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 !bg-white !text-black">
          <Link href={user ? "/profile" : "/"}>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
              <Home className="w-5 h-5" />
              <span>HOME</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold mb-8 !text-black">Child Safety Standards (CSAE Policy)</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 !text-black">
            <section>
              <p className="mb-4">
                MyKliq is committed to maintaining a safe environment for all users and strictly prohibits child sexual abuse and exploitation (CSAE) in any form. We enforce a zero-tolerance policy against child sexual abuse material (CSAM) and any behavior that involves the exploitation or endangerment of minors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Zero Tolerance Policy</h2>
              <p className="mb-4">MyKliq does not allow any content or behavior that includes:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Child sexual abuse or exploitation (CSAE)</li>
                <li>Sharing, requesting, or distributing child sexual abuse material (CSAM)</li>
                <li>Grooming, solicitation, or harassment of minors</li>
                <li>Any attempt to exploit or harm individuals under the age of 18</li>
              </ul>
              <p className="mb-4">
                Any violation of this policy will result in immediate action, including content removal, account suspension, and permanent banning of accounts involved.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Prevention and Enforcement</h2>
              <p className="mb-4">
                We use a combination of automated systems, user reporting tools, and manual review processes to help detect and prevent abusive content and behavior.
              </p>
              <p className="mb-4">We may take actions including:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Removing violating content</li>
                <li>Suspending or permanently banning accounts</li>
                <li>Restricting access to features</li>
                <li>Reporting illegal activity to relevant authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Reporting Child Safety Concerns</h2>
              <p className="mb-4">
                Users can report any child safety concerns through in-app reporting tools (if available) or by contacting us directly.
              </p>
              <p className="mb-4">All reports are reviewed and handled as quickly as possible.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Cooperation with Authorities</h2>
              <p className="mb-4">
                MyKliq complies with all applicable child protection laws and cooperates with law enforcement and relevant authorities when required. We may report illegal content or activity involving child exploitation in accordance with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Age Requirement</h2>
              <p className="mb-4">
                MyKliq is intended for users aged 18 years and older. We do not knowingly allow minors to register or use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
              <p className="mb-4">For any child safety concerns or reports, please contact us at{" "}
                <a href="mailto:fredlamb@futureshockholdings.com" className="text-primary hover:underline">
                  fredlamb@futureshockholdings.com
                </a>
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                Last updated: June 2026
              </p>
            </section>
          </div>
        </div>
    </PageWrapper>
  );
}
