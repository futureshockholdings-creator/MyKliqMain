import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function CommunityGuidelines() {
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
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 !bg-white !text-black">
          <Link href={user ? "/profile" : "/"}>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
              <Home className="w-5 h-5" />
              <span>{uiText("HOME")}</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold mb-8 !text-black">{uiText("Community Guidelines")}</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 !text-black">
            <section>
              <p className="mb-6 text-lg">
                {uiText("MyKliq is designed to foster meaningful connections within close-knit friend groups. To maintain a safe, respectful, and positive environment for all users, we have established these community guidelines. Violation of these guidelines may result in content removal, account suspension, or permanent banning from the platform.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Prohibited Content and Behavior")}</h2>
              
              <h3 className="text-xl font-semibold mb-3">{uiText("Hate Speech and Discrimination")}</h3>
              <p className="mb-4">
                {uiText("We have zero tolerance for content that promotes hatred, discrimination, or violence against individuals or groups based on:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Race, ethnicity, or national origin")}</li>
                <li>{uiText("Religion or religious beliefs")}</li>
                <li>{uiText("Gender, gender identity, or sexual orientation")}</li>
                <li>{uiText("Disability or mental health status")}</li>
                <li>{uiText("Age, appearance, or socioeconomic status")}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">{uiText("Adult Content and Sexual Material")}</h3>
              <p className="mb-4">
                {uiText("MyKliq prohibits all forms of sexually explicit content, including:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Pornographic images, videos, or text content")}</li>
                <li>{uiText("Nude or sexually suggestive photos")}</li>
                <li>{uiText("Sexual solicitation or explicit conversations")}</li>
                <li>{uiText("Links to adult websites or content")}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">{uiText("Harassment and Bullying")}</h3>
              <p className="mb-4">
                {uiText("We do not tolerate any form of harassment, bullying, or intimidation, including:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Persistent unwanted contact or messaging")}</li>
                <li>{uiText("Threats of violence or harm")}</li>
                <li>{uiText("Doxxing (sharing personal information without consent)")}</li>
                <li>{uiText("Cyberbullying or coordinated harassment")}</li>
                <li>{uiText("Impersonation of other users")}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">{uiText("Violence and Harmful Content")}</h3>
              <p className="mb-4">
                {uiText("Content that promotes, glorifies, or depicts violence is strictly prohibited:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Graphic violence or gore")}</li>
                <li>{uiText("Self-harm or suicide content")}</li>
                <li>{uiText("Terrorist or extremist content")}</li>
                <li>{uiText("Instructions for dangerous activities")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Platform Integrity")}</h2>
              
              <h3 className="text-xl font-semibold mb-3">{uiText("Spam and Fake Content")}</h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Excessive posting of repetitive content")}</li>
                <li>{uiText("Fake accounts or misleading profiles")}</li>
                <li>{uiText("Unauthorized commercial advertising")}</li>
                <li>{uiText("Misinformation or deliberately false content")}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">{uiText("Illegal Activities")}</h3>
              <p className="mb-4">
                {uiText("Content promoting or facilitating illegal activities is prohibited:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Drug sales or distribution")}</li>
                <li>{uiText("Fraud or financial scams")}</li>
                <li>{uiText("Copyright or intellectual property violation")}</li>
                <li>{uiText("Any content violating local, state, or federal laws")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Enforcement and Appeals")}</h2>
              
              <h3 className="text-xl font-semibold mb-3">{uiText("Reporting Violations")}</h3>
              <p className="mb-4">
                {uiText("If you encounter content that violates these guidelines, please report it immediately using the report feature on any post, comment, or user profile. All reports are reviewed by our moderation team within 24 hours.")}
              </p>

              <h3 className="text-xl font-semibold mb-3">{uiText("Enforcement Actions")}</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">{uiText("Warning")}</h4>
                <p className="text-sm">{uiText("First-time minor violations result in a warning and content removal.")}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">{uiText("Temporary Suspension")}</h4>
                <p className="text-sm">{uiText("24 hours to 180 days depending on violation severity and history.")}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">{uiText("Permanent Ban")}</h4>
                <p className="text-sm">{uiText("Severe violations or repeated offenses result in permanent account termination.")}</p>
              </div>

              <h3 className="text-xl font-semibold mb-3">{uiText("Appeals Process")}</h3>
              <p className="mb-4">
                {uiText("If you believe your account was suspended or content was removed in error, you may appeal by contacting us at")}{" "}
                <a href="mailto:mykliqassistance@outlook.com" className="text-primary hover:underline">
                  {uiText("mykliqassistance@outlook.com")}
                </a>{" "}
                {uiText("within 30 days of the enforcement action. Include your username and a detailed explanation of why you believe the action was incorrect.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Positive Community Behavior")}</h2>
              <p className="mb-4">
                {uiText("We encourage all users to:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Treat all community members with respect and kindness")}</li>
                <li>{uiText("Share authentic and meaningful content with your kliq")}</li>
                <li>{uiText("Respect others' privacy and personal boundaries")}</li>
                <li>{uiText("Help maintain a safe environment by reporting violations")}</li>
                <li>{uiText("Engage in constructive and positive interactions")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Contact and Support")}</h2>
              <p className="mb-4">
                {uiText("For questions about these community guidelines or to report violations, contact us at")}{" "}
                <a href="mailto:mykliqassistance@outlook.com" className="text-primary hover:underline">
                  {uiText("mykliqassistance@outlook.com")}
                </a>
              </p>
              <p className="mb-4">
                {uiText("For immediate safety concerns or emergencies, please contact local authorities.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Updates to Guidelines")}</h2>
              <p className="mb-4">
                {uiText("These community guidelines may be updated periodically to address new challenges and maintain platform safety. Users will be notified of significant changes, and continued use of MyKliq constitutes acceptance of updated guidelines.")}
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                {uiText("Last updated: September 8, 2025")}
              </p>
            </section>
          </div>
        </div>
    </PageWrapper>
  );
}