import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";

export default function ChildSafety() {
  const { user } = useAuth();

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    window.scrollTo(0, 0);
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

        <h1 className="text-3xl font-bold mb-8 !text-black">Child Safety</h1>

        <div className="prose prose-slate max-w-none space-y-6 !text-black">

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="mb-4">
              MyKliq is committed to providing a safe environment for all users. We do not allow anyone under the age of 13 to create an account, and we take the safety of minors seriously across every part of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Age Requirements</h2>
            <p className="mb-4">
              MyKliq is intended for users who are at least 13 years old. Users between the ages of 13 and 17 may use the platform only with the consent and supervision of a parent or legal guardian. By creating an account, you confirm that you meet this age requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Prohibited Content</h2>
            <p className="mb-4">
              MyKliq has a zero-tolerance policy for content that exploits, harms, or endangers children. The following content is strictly prohibited and will result in immediate account termination and reporting to the appropriate authorities:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Child sexual abuse material (CSAM) of any kind</li>
              <li>Grooming, solicitation, or exploitation of minors</li>
              <li>Any content that sexualizes individuals under the age of 18</li>
              <li>Attempts to establish inappropriate contact with minors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Reporting Concerns</h2>
            <p className="mb-4">
              If you encounter content or behavior that you believe endangers a child, please report it immediately using the in-app report function or by contacting us directly at:
            </p>
            <p className="mb-4 font-medium">
              <a href="mailto:safety@mykliq.app" className="text-blue-600 hover:underline">safety@mykliq.app</a>
            </p>
            <p className="mb-4">
              All reports are reviewed promptly. Where required by law, we report child exploitation material to the National Center for Missing &amp; Exploited Children (NCMEC) and cooperate fully with law enforcement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Privacy for Minors</h2>
            <p className="mb-4">
              We do not knowingly collect personal information from children under the age of 13. If we discover that a user under 13 has created an account, we will delete the account and all associated data promptly. Parents or guardians who believe their child has created an account should contact us at <a href="mailto:safety@mykliq.app" className="text-blue-600 hover:underline">safety@mykliq.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Parental Guidance</h2>
            <p className="mb-4">
              We encourage parents and guardians to stay involved in their children's online activity. MyKliq is an invite-only platform — users can only join with a valid invite code — which helps limit access to trusted communities. We recommend parents:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Review and discuss the content their child shares and receives</li>
              <li>Ensure their child understands what is and is not appropriate to post</li>
              <li>Report any concerns using the in-app tools or via email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              For any child safety concerns or questions about this policy, please reach out to our safety team at <a href="mailto:safety@mykliq.app" className="text-blue-600 hover:underline">safety@mykliq.app</a>.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">Last updated: June 2026</p>
        </div>
      </div>
    </PageWrapper>
  );
}
