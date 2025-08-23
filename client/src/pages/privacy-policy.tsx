import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p className="mb-4">
                MyKliq collects information you provide when creating your account and using our services, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Profile information (name, email, profile picture)</li>
                <li>Content you create and share (posts, comments, photos, videos)</li>
                <li>Usage data and interactions within the platform</li>
                <li>Communication preferences and settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Provide and maintain our social networking services</li>
                <li>Personalize your experience and content recommendations</li>
                <li>Communicate with you about updates and features</li>
                <li>Ensure platform security and prevent abuse</li>
                <li>Improve our services through analytics and user feedback</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p className="mb-4">
                MyKliq is designed for sharing within your close friend groups ("kliqs"). Content you share is visible to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Members of your kliq based on friend ranking and privacy settings</li>
                <li>Other users as determined by your content filter and sharing preferences</li>
              </ul>
              <p className="mb-4">
                We do not sell your personal information to third parties. We may share anonymized, aggregated data for analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no internet transmission is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Control your privacy settings and content visibility</li>
                <li>Opt out of certain communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:futureshockholdings@gmail.com" className="text-primary hover:underline">
                  futureshockholdings@gmail.com
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
      <Footer />
    </div>
  );
}