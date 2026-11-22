import { Link } from "wouter";
import { CheckCircle2, AlertCircle, FileText, Image, Video, Globe, Shield, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/PageWrapper";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function AdvertiserRequirements() {
  useUiLanguage();
  return (
    <PageWrapper className="!bg-white">
      <ForcedLightSurface>
        <div className="w-full max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold !text-black">
            {uiText("Advertiser Requirements")}
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            {uiText("MyKliq offers targeted advertising to reach our engaged community of close-knit friend groups. Review our comprehensive requirements to ensure your ads meet our quality standards.")}
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/advertiser-onboarding">
              <Button size="lg" data-testid="button-start-onboarding">
                {uiText("Start Application")}
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="outline" size="lg" data-testid="button-contact-ads">
                {uiText("Contact Ads Team")}
              </Button>
            </Link>
          </div>
        </div>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Image className="w-6 h-6" />
              {uiText("Image Creative Requirements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {uiText("Required Specifications")}
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• <strong>{uiText("Minimum Resolution:")}</strong> {uiText("1200 × 628 pixels")}</li>
                  <li>• <strong>{uiText("Recommended:")}</strong> {uiText("2400 × 1256 pixels")}</li>
                  <li>• <strong>{uiText("Aspect Ratio:")}</strong> {uiText("1.91:1 (landscape)")}</li>
                  <li>• <strong>{uiText("File Formats:")}</strong> {uiText("JPG, PNG, WebP")}</li>
                  <li>• <strong>{uiText("Maximum File Size:")}</strong> {uiText("5 MB")}</li>
                  <li>• <strong>{uiText("Color Space:")}</strong> {uiText("RGB (not CMYK)")}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  {uiText("Best Practices")}
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>{uiText("• Use high-quality, eye-catching imagery")}</li>
                  <li>{uiText("• Ensure text is readable on mobile devices")}</li>
                  <li>{uiText("• Avoid excessive text (max 20% of image)")}</li>
                  <li>{uiText("• Use brand colors and maintain consistency")}</li>
                  <li>{uiText("• Test on multiple screen sizes")}</li>
                  <li>{uiText("• Include clear visual hierarchy")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Video className="w-6 h-6" />
              {uiText("Video Creative Requirements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {uiText("Technical Specifications")}
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• <strong>{uiText("Format:")}</strong> {uiText("MP4 (H.264 codec)")}</li>
                  <li>• <strong>{uiText("Resolution:")}</strong> {uiText("1080p (1920 × 1080)")}</li>
                  <li>• <strong>{uiText("Frame Rate:")}</strong> {uiText("30 fps minimum")}</li>
                  <li>• <strong>{uiText("Duration:")}</strong> {uiText("6-30 seconds")}</li>
                  <li>• <strong>{uiText("Maximum File Size:")}</strong> {uiText("100 MB")}</li>
                  <li>• <strong>{uiText("Audio:")}</strong> {uiText("AAC codec, 128 kbps+")}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  {uiText("Content Guidelines")}
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>{uiText("• Hook viewers in first 3 seconds")}</li>
                  <li>{uiText("• Include captions for accessibility")}</li>
                  <li>{uiText("• Optimize for sound-off viewing")}</li>
                  <li>{uiText("• Keep branding visible throughout")}</li>
                  <li>{uiText("• End with clear call-to-action")}</li>
                  <li>{uiText("• Test on mobile first")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <FileText className="w-6 h-6" />
              {uiText("Ad Copy Requirements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{uiText("Headline / Title")}</h3>
                <p className="text-sm text-gray-800">
                  <strong>{uiText("Length:")}</strong> {uiText("60-100 characters")}<br />
                  <strong>{uiText("Purpose:")}</strong> {uiText("Grab attention and communicate main value proposition")}<br />
                  <strong>{uiText("Best Practice:")}</strong> {uiText("Use action words, numbers, and emotional triggers")}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{uiText("Description")}</h3>
                <p className="text-sm text-gray-800">
                  <strong>{uiText("Length:")}</strong> {uiText("150-500 characters")}<br />
                  <strong>{uiText("Purpose:")}</strong> {uiText("Provide context and persuade users to click")}<br />
                  <strong>{uiText("Best Practice:")}</strong> {uiText("Focus on benefits, not features. Be conversational.")}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">{uiText("Call-to-Action (CTA)")}</h3>
                <p className="text-sm text-gray-800">
                  <strong>{uiText("Length:")}</strong> {uiText("10-30 characters")}<br />
                  <strong>{uiText("Examples:")}</strong> {uiText("\"Shop Now\", \"Learn More\", \"Sign Up Free\", \"Get Started\"")}<br />
                  <strong>{uiText("Best Practice:")}</strong> {uiText("Use action verbs and create urgency when appropriate")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Globe className="w-6 h-6" />
              {uiText("Landing Page Requirements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-black">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">{uiText("HTTPS Required:")}</strong>
                <p className="text-sm text-gray-800">{uiText("All landing pages must use secure HTTPS protocol")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">{uiText("Mobile Responsive:")}</strong>
                <p className="text-sm text-gray-800">{uiText("Must work seamlessly on smartphones and tablets (60%+ of traffic)")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">{uiText("Fast Load Time:")}</strong>
                <p className="text-sm text-gray-800">{uiText("Page must load in under 3 seconds on 4G connection")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">{uiText("Clear Value Proposition:")}</strong>
                <p className="text-sm text-gray-800">{uiText("Immediately communicate what you're offering")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">{uiText("Functional & Active:")}</strong>
                <p className="text-sm text-gray-800">{uiText("No \"coming soon\" or under construction pages")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Shield className="w-6 h-6" />
              {uiText("Legal & Compliance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">{uiText("Required")}</Badge>
                <div>
                  <strong className="text-black">{uiText("Business Registration:")}</strong>
                  <p className="text-sm text-gray-800">{uiText("Valid business license and tax ID (EIN or SSN for sole proprietors)")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">{uiText("Required")}</Badge>
                <div>
                  <strong className="text-black">{uiText("Truthful Advertising:")}</strong>
                  <p className="text-sm text-gray-800">{uiText("All claims must be accurate and substantiated. No misleading statements.")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">{uiText("Required")}</Badge>
                <div>
                  <strong className="text-black">{uiText("Age-Appropriate Content:")}</strong>
                  <p className="text-sm text-gray-800">{uiText("Suitable for users 13+. No adult content, violence, or profanity.")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">{uiText("Required")}</Badge>
                <div>
                  <strong className="text-black">{uiText("Intellectual Property:")}</strong>
                  <p className="text-sm text-gray-800">{uiText("You must own or have rights to all creative assets used in ads")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">{uiText("Required")}</Badge>
                <div>
                  <strong className="text-black">{uiText("Privacy Compliance:")}</strong>
                  <p className="text-sm text-gray-800">{uiText("Comply with GDPR, CCPA, and other data privacy regulations")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 border-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <XCircle className="w-6 h-6 text-red-600" />
              {uiText("Prohibited Content")}
            </CardTitle>
          </CardHeader>
          <CardContent className="!text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">{uiText("Strictly Prohibited")}</h3>
                <ul className="space-y-1 text-sm text-gray-800">
                  <li>{uiText("• Tobacco, vaping, or smoking products")}</li>
                  <li>{uiText("• Illegal drugs or drug paraphernalia")}</li>
                  <li>{uiText("• Weapons, firearms, or ammunition")}</li>
                  <li>{uiText("• Adult content or sexual services")}</li>
                  <li>{uiText("• Gambling or online casinos")}</li>
                  <li>{uiText("• Get-rich-quick schemes or MLMs")}</li>
                  <li>{uiText("• Cryptocurrency or forex trading")}</li>
                  <li>{uiText("• Political campaign advertisements")}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">{uiText("Also Not Allowed")}</h3>
                <ul className="space-y-1 text-sm text-gray-800">
                  <li>{uiText("• Hate speech or discriminatory content")}</li>
                  <li>{uiText("• Misleading health claims or fake cures")}</li>
                  <li>{uiText("• Counterfeit or knock-off products")}</li>
                  <li>{uiText("• Deceptive business practices")}</li>
                  <li>{uiText("• Malware or phishing attempts")}</li>
                  <li>{uiText("• Content promoting eating disorders")}</li>
                  <li>{uiText("• Payday loans or predatory lending")}</li>
                  <li>{uiText("• Content violating third-party rights")}</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-gray-800">
                <strong className="text-red-600">{uiText("Note:")}</strong> {uiText("MyKliq reserves the right to reject any advertisement that doesn't align with our community values or violates our terms of service.")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-600">
          <CardHeader>
            <CardTitle className="text-black">{uiText("Ready to Advertise?")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-800">
              {uiText("If you meet all the requirements above and are ready to reach our engaged community of private social circles, start your application today.")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/advertiser-onboarding">
                <Button size="lg" data-testid="button-start-onboarding-bottom">
                  {uiText("Start Application")}
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button variant="outline" size="lg" data-testid="button-contact-ads-bottom">
                  {uiText("Contact Ads Team")}
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-700">
              {uiText("Questions? Email us at")}{" "}
              <a 
                href="mailto:mykliqadsmanagement@outlook.com" 
                className="text-blue-600 hover:underline font-medium"
              >
                {uiText("mykliqadsmanagement@outlook.com")}
              </a>
            </p>
          </CardContent>
        </Card>
        </div>
      </ForcedLightSurface>
    </PageWrapper>
  );
}
