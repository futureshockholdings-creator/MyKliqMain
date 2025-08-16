import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={goBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-secondary">MyKliq Privacy Policy</CardTitle>
            <p className="text-muted-foreground text-sm">Last updated: August 2024</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            
            <section>
              <h3 className="font-semibold text-primary mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, such as when you create an account, 
                update your profile, post content, or communicate with other users. This includes your 
                name, email address, profile information, posts, messages, and any other content you 
                choose to share.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                We use the information we collect to provide, maintain, and improve MyKliq services, 
                including to facilitate connections between friends, enable communication features, 
                and personalize your experience on our platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">3. Information Sharing</h3>
              <p className="text-muted-foreground">
                MyKliq is designed as a private social network with a maximum of 15 friends per user. 
                Your content is only shared with your approved friends within your Kliq. We do not 
                sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal information. You may 
                also deactivate your account at any time through your profile settings. For assistance 
                with these requests, please contact us.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">6. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience, remember your 
                preferences, and analyze how you use our service to improve functionality.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">7. Children's Privacy</h3>
              <p className="text-muted-foreground">
                MyKliq is not intended for users under the age of 13. We do not knowingly collect 
                personal information from children under 13. If you become aware that a child has 
                provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">8. Changes to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes by posting the updated policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">9. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this privacy policy or our privacy practices, 
                please contact us through our support channels or by email.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}