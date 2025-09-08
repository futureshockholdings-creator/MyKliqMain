import Footer from "@/components/Footer";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Community Guidelines</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <p className="mb-6 text-lg">
                MyKliq is designed to foster meaningful connections within close-knit friend groups. 
                To maintain a safe, respectful, and positive environment for all users, we have established 
                these community guidelines. Violation of these guidelines may result in content removal, 
                account suspension, or permanent banning from the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Prohibited Content and Behavior</h2>
              
              <h3 className="text-xl font-semibold mb-3">Hate Speech and Discrimination</h3>
              <p className="mb-4">
                We have zero tolerance for content that promotes hatred, discrimination, or violence against 
                individuals or groups based on:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Race, ethnicity, or national origin</li>
                <li>Religion or religious beliefs</li>
                <li>Gender, gender identity, or sexual orientation</li>
                <li>Disability or mental health status</li>
                <li>Age, appearance, or socioeconomic status</li>
              </ul>
              <p className="mb-4 font-semibold text-red-600 dark:text-red-400">
                Consequence: Immediate account suspension or permanent ban
              </p>

              <h3 className="text-xl font-semibold mb-3">Adult Content and Sexual Material</h3>
              <p className="mb-4">
                MyKliq prohibits all forms of sexually explicit content, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Pornographic images, videos, or text content</li>
                <li>Nude or sexually suggestive photos</li>
                <li>Sexual solicitation or explicit conversations</li>
                <li>Links to adult websites or content</li>
              </ul>
              <p className="mb-4 font-semibold text-red-600 dark:text-red-400">
                Consequence: Immediate content removal and account suspension
              </p>

              <h3 className="text-xl font-semibold mb-3">Harassment and Bullying</h3>
              <p className="mb-4">
                We do not tolerate any form of harassment, bullying, or intimidation, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Persistent unwanted contact or messaging</li>
                <li>Threats of violence or harm</li>
                <li>Doxxing (sharing personal information without consent)</li>
                <li>Cyberbullying or coordinated harassment</li>
                <li>Impersonation of other users</li>
              </ul>
              <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
                Consequence: Account suspension (24 hours to 30 days) or permanent ban for severe cases
              </p>

              <h3 className="text-xl font-semibold mb-3">Violence and Harmful Content</h3>
              <p className="mb-4">
                Content that promotes, glorifies, or depicts violence is strictly prohibited:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Graphic violence or gore</li>
                <li>Self-harm or suicide content</li>
                <li>Terrorist or extremist content</li>
                <li>Instructions for dangerous activities</li>
              </ul>
              <p className="mb-4 font-semibold text-red-600 dark:text-red-400">
                Consequence: Immediate account suspension or permanent ban
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Platform Integrity</h2>
              
              <h3 className="text-xl font-semibold mb-3">Spam and Fake Content</h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Excessive posting of repetitive content</li>
                <li>Fake accounts or misleading profiles</li>
                <li>Unauthorized commercial advertising</li>
                <li>Misinformation or deliberately false content</li>
              </ul>
              <p className="mb-4 font-semibold text-yellow-600 dark:text-yellow-400">
                Consequence: Content removal and account warning, repeated violations result in suspension
              </p>

              <h3 className="text-xl font-semibold mb-3">Illegal Activities</h3>
              <p className="mb-4">
                Content promoting or facilitating illegal activities is prohibited:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Drug sales or distribution</li>
                <li>Fraud or financial scams</li>
                <li>Copyright or intellectual property violation</li>
                <li>Any content violating local, state, or federal laws</li>
              </ul>
              <p className="mb-4 font-semibold text-red-600 dark:text-red-400">
                Consequence: Immediate account suspension and potential law enforcement reporting
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Enforcement and Appeals</h2>
              
              <h3 className="text-xl font-semibold mb-3">Reporting Violations</h3>
              <p className="mb-4">
                If you encounter content that violates these guidelines, please report it immediately using 
                the report feature on any post, comment, or user profile. All reports are reviewed by our 
                moderation team within 24 hours.
              </p>

              <h3 className="text-xl font-semibold mb-3">Enforcement Actions</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Warning</h4>
                <p className="text-sm">First-time minor violations result in a warning and content removal.</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Temporary Suspension</h4>
                <p className="text-sm">24 hours to 180 days depending on violation severity and history.</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Permanent Ban</h4>
                <p className="text-sm">Severe violations or repeated offenses result in permanent account termination.</p>
              </div>

              <h3 className="text-xl font-semibold mb-3">Appeals Process</h3>
              <p className="mb-4">
                If you believe your account was suspended or content was removed in error, you may appeal by 
                contacting us at{" "}
                <a href="mailto:futureshockholdings@gmail.com" className="text-primary hover:underline">
                  futureshockholdings@gmail.com
                </a>{" "}
                within 30 days of the enforcement action. Include your username and a detailed explanation of why 
                you believe the action was incorrect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Positive Community Behavior</h2>
              <p className="mb-4">
                We encourage all users to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Treat all community members with respect and kindness</li>
                <li>Share authentic and meaningful content with your kliq</li>
                <li>Respect others' privacy and personal boundaries</li>
                <li>Help maintain a safe environment by reporting violations</li>
                <li>Engage in constructive and positive interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact and Support</h2>
              <p className="mb-4">
                For questions about these community guidelines or to report violations, contact us at{" "}
                <a href="mailto:futureshockholdings@gmail.com" className="text-primary hover:underline">
                  futureshockholdings@gmail.com
                </a>
              </p>
              <p className="mb-4">
                For immediate safety concerns or emergencies, please contact local authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Updates to Guidelines</h2>
              <p className="mb-4">
                These community guidelines may be updated periodically to address new challenges and maintain 
                platform safety. Users will be notified of significant changes, and continued use of MyKliq 
                constitutes acceptance of updated guidelines.
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                Last updated: September 8, 2025
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}