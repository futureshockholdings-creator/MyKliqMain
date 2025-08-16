import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Disclaimer() {
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
          <h1 className="text-3xl font-bold text-primary">Disclaimer</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-secondary">MyKliq Terms and Disclaimer</CardTitle>
            <p className="text-muted-foreground text-sm">Last updated: August 2024</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            
            <section>
              <h3 className="font-semibold text-primary mb-2">1. General Disclaimer</h3>
              <p className="text-muted-foreground">
                MyKliq is provided "as is" without warranties of any kind, either express or implied. 
                We make no representations or warranties regarding the accuracy, reliability, or 
                completeness of the content or services provided through our platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">2. User-Generated Content</h3>
              <p className="text-muted-foreground">
                Users are solely responsible for the content they post, share, or communicate through 
                MyKliq. We do not endorse, support, represent, or guarantee the accuracy or reliability 
                of any user-generated content. Views and opinions expressed by users do not necessarily 
                reflect those of MyKliq.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">3. Service Availability</h3>
              <p className="text-muted-foreground">
                We strive to maintain continuous service availability but cannot guarantee uninterrupted 
                access to MyKliq. Services may be temporarily unavailable due to maintenance, updates, 
                or circumstances beyond our control.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">4. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                To the fullest extent permitted by law, MyKliq shall not be liable for any direct, 
                indirect, incidental, special, consequential, or punitive damages arising from your 
                use of or inability to use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">5. User Conduct</h3>
              <p className="text-muted-foreground">
                Users are expected to behave respectfully and lawfully when using MyKliq. We reserve 
                the right to suspend or terminate accounts that violate our community guidelines or 
                engage in harmful, abusive, or illegal activities.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">6. Third-Party Links</h3>
              <p className="text-muted-foreground">
                MyKliq may contain links to third-party websites or services. We are not responsible 
                for the content, privacy policies, or practices of these external sites. Users access 
                third-party links at their own risk.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">7. Intellectual Property</h3>
              <p className="text-muted-foreground">
                Users retain ownership of content they create and share on MyKliq, but grant us a 
                license to use, display, and distribute such content within our platform. Users must 
                respect the intellectual property rights of others.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">8. Privacy and Data</h3>
              <p className="text-muted-foreground">
                While we implement security measures to protect user data, no online service can 
                guarantee complete security. Users share information at their own risk and should 
                review our Privacy Policy for detailed information about data handling.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">9. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms, our services, or discontinue MyKliq at 
                any time without prior notice. Continued use of our platform constitutes acceptance 
                of any changes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">10. Governing Law</h3>
              <p className="text-muted-foreground">
                These terms and your use of MyKliq are governed by applicable laws. Any disputes 
                arising from the use of our service will be resolved according to the jurisdiction 
                where MyKliq operates.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">11. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have questions about these terms or our disclaimer, please contact us through 
                our official support channels. We will make reasonable efforts to address your concerns.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}