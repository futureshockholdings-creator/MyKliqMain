import Footer from "@/components/Footer";
import { Mail, Megaphone, HeadphonesIcon, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <p className="mb-8 text-lg">
              We're here to help! Choose the department that best fits your needs and we'll get back to you as soon as possible.
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-contact-ads">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Megaphone className="w-6 h-6 text-purple-500" />
                  Ads & Marketing
                </CardTitle>
                <CardDescription>
                  Interested in advertising on MyKliq? Want to partner with us for marketing opportunities?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:ads@mykliq.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  data-testid="link-ads-email"
                >
                  <Mail className="w-4 h-4" />
                  ads@mykliq.com
                </a>
                <p className="mt-3 text-sm text-muted-foreground">
                  Our marketing team will respond within 1-2 business days with information about advertising packages, partnerships, and collaboration opportunities.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow" data-testid="card-contact-support">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <HeadphonesIcon className="w-6 h-6 text-blue-500" />
                  General Customer Service
                </CardTitle>
                <CardDescription>
                  Questions about your account? Need help with features? Technical issues?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:support@mykliq.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  data-testid="link-support-email"
                >
                  <Mail className="w-4 h-4" />
                  support@mykliq.com
                </a>
                <p className="mt-3 text-sm text-muted-foreground">
                  Our support team is available to assist with account questions, feature explanations, troubleshooting, and general inquiries. We aim to respond within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow" data-testid="card-contact-billing">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  AR/AP Billing
                </CardTitle>
                <CardDescription>
                  Accounts receivable, accounts payable, invoices, and billing inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:billing@mykliq.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  data-testid="link-billing-email"
                >
                  <Mail className="w-4 h-4" />
                  billing@mykliq.com
                </a>
                <p className="mt-3 text-sm text-muted-foreground">
                  For all billing-related matters including invoices, payments, account balances, and financial inquiries. Our accounting team will respond within 2-3 business days.
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="mt-8 p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Response Times</h2>
            <p className="mb-4">
              We strive to respond to all inquiries as quickly as possible. Typical response times:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Customer Service:</strong> Within 24 hours</li>
              <li><strong>Ads & Marketing:</strong> Within 1-2 business days</li>
              <li><strong>Billing:</strong> Within 2-3 business days</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Please note: Response times may be longer during weekends and holidays.
            </p>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
