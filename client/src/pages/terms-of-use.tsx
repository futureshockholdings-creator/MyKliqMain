import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function TermsOfUse() {
  useUiLanguage();
  const { user } = useAuth();

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageWrapper className="!bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 !bg-white !text-black">
        <Link href={user ? "/profile" : "/"}>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
            <Home className="w-5 h-5" />
            <span>{uiText("HOME")}</span>
          </button>
        </Link>
        <h1 className="text-3xl font-bold mb-2 !text-black">{uiText("Terms of Use (End User License Agreement)")}</h1>
        <p className="text-sm text-gray-600 mb-8">{uiText("Effective Date: January 1, 2025  |  Last Updated: May 14, 2026")}</p>

        <div className="prose prose-slate max-w-none space-y-6 !text-black">

          <section>
            <p className="mb-4 text-lg">
              {uiText("Please read these Terms of Use (\"Terms\") carefully before using the MyKliq application (\"App,\" \"Service\"). By creating an account or using the Service, you agree to be legally bound by these Terms. If you do not agree, do not use MyKliq.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("1. Acceptance of Terms")}</h2>
            <p className="mb-4">
              {uiText("These Terms constitute a binding legal agreement between you and MyKliq (\"we,\" \"us,\" \"our\"). You must be at least 13 years old to use the Service. By using MyKliq you represent that you meet this minimum age requirement and have the legal capacity to enter into this agreement.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("2. User-Generated Content (UGC)")}</h2>
            <p className="mb-4">
              {uiText("MyKliq is a platform for private social sharing. You are solely responsible for any content you post, share, upload, or transmit (\"User Content\"). By submitting User Content you grant MyKliq a non-exclusive, worldwide, royalty-free license to store and display that content solely for the purpose of operating the Service.")}
            </p>
            <p className="mb-4">{uiText("You agree that your User Content will not:")}</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>{uiText("Contain hate speech, discrimination, or content that degrades individuals based on race, religion, gender, sexual orientation, disability, or any other protected characteristic")}</li>
              <li>{uiText("Include sexually explicit material, nudity, or pornographic content")}</li>
              <li>{uiText("Harass, bully, threaten, or intimidate other users")}</li>
              <li>{uiText("Depict or promote violence, self-harm, or dangerous activities")}</li>
              <li>{uiText("Constitute spam, misinformation, or deceptive content")}</li>
              <li>{uiText("Violate any applicable local, state, national, or international law")}</li>
            </ul>
          </section>

          <section>
            <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded mb-4">
              <h2 className="text-2xl font-semibold mb-3 text-red-700">{uiText("3. Zero-Tolerance Policy")}</h2>
              <p className="mb-3 font-semibold">
                {uiText("MyKliq maintains a strict zero-tolerance policy for the following types of content or behavior. Violations will result in immediate account suspension or permanent ban without prior warning:")}
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>{uiText("Child sexual abuse material (CSAM)")}</strong> {uiText("— any depiction of minors in a sexual context is strictly prohibited and will be reported to law enforcement")}</li>
                <li><strong>{uiText("Terrorist or extremist content")}</strong> {uiText("— promotion of, glorification of, or recruitment for violent extremist organizations")}</li>
                <li><strong>{uiText("Non-consensual intimate imagery")}</strong> {uiText("— sharing or threatening to share intimate images of another person without their consent")}</li>
                <li><strong>{uiText("Incitement to violence")}</strong> {uiText("— content that explicitly calls for physical harm against specific individuals or groups")}</li>
                <li><strong>{uiText("Human trafficking")}</strong> {uiText("— facilitating or promoting exploitation or trafficking of persons")}</li>
              </ul>
              <p className="mt-3 text-sm text-red-700">
                {uiText("We cooperate fully with law enforcement investigations involving any of the above categories.")}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("4. Reporting and Moderation")}</h2>
            <p className="mb-4">
              {uiText("All users have access to in-app reporting tools on every post. Reports are reviewed by our moderation team within 24 hours. You may also block any user to prevent them from appearing in your feed and to stop receiving their content. Enforcement actions include warnings, content removal, temporary suspension, and permanent bans.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("5. Blocking Users")}</h2>
            <p className="mb-4">
              {uiText("You may block any other user at any time. When you block a user:")}
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>{uiText("Their posts, stories, polls, and events will be hidden from your feed")}</li>
              <li>{uiText("You will no longer receive messages or notifications from them")}</li>
              <li>{uiText("They will not be notified that you have blocked them")}</li>
              <li>{uiText("You may unblock a user at any time from your Settings")}</li>
            </ul>
            <p className="mb-4">
              {uiText("Blocking a user does not automatically remove them from your kliq. You may separately choose to remove them as a member or leave their kliq.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("6. Account Suspension and Termination")}</h2>
            <p className="mb-4">
              {uiText("We reserve the right to suspend or terminate any account at our sole discretion for violation of these Terms. You may appeal enforcement actions by contacting")}{" "}
              <a href="mailto:mykliqassistance@outlook.com" className="text-blue-600 hover:underline">
                {uiText("mykliqassistance@outlook.com")}
              </a>{" "}
              {uiText("within 30 days. We will not reinstate accounts permanently banned for zero-tolerance violations.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("7. Privacy")}</h2>
            <p className="mb-4">
              {uiText("Your use of the Service is also governed by our")}{" "}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">{uiText("Privacy Policy")}</Link>{uiText(", which is incorporated into these Terms by reference.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("8. Disclaimer of Warranties")}</h2>
            <p className="mb-4">
              {uiText("THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("9. Limitation of Liability")}</h2>
            <p className="mb-4">
              {uiText("TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MYKLIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR ANY USER CONTENT.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("10. Changes to These Terms")}</h2>
            <p className="mb-4">
              {uiText("We may update these Terms from time to time. We will notify you of material changes via in-app notification or email. Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{uiText("11. Contact Us")}</h2>
            <p className="mb-4">
              {uiText("For questions about these Terms, contact us at")}{" "}
              <a href="mailto:mykliqassistance@outlook.com" className="text-blue-600 hover:underline">
                {uiText("mykliqassistance@outlook.com")}
              </a>
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-500 mt-8">
              {uiText("© 2025 MyKliq. All rights reserved.")}
            </p>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
