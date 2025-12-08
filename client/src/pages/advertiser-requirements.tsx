import { Link } from "wouter";
import { CheckCircle2, AlertCircle, FileText, Image, Video, Globe, Shield, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";

export default function AdvertiserRequirements() {
  return (
    <ForcedLightSurface>
      <div className="w-full max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold !text-black">
            Advertiser Requirements
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            MyKliq offers targeted advertising to reach our engaged community of close-knit friend groups. 
            Review our comprehensive requirements to ensure your ads meet our quality standards.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/advertiser-onboarding">
              <Button size="lg" data-testid="button-start-onboarding">
                Start Application
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="outline" size="lg" data-testid="button-contact-ads">
                Contact Ads Team
              </Button>
            </Link>
          </div>
        </div>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Image className="w-6 h-6" />
              Image Creative Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Required Specifications
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• <strong>Minimum Resolution:</strong> 1200 × 628 pixels</li>
                  <li>• <strong>Recommended:</strong> 2400 × 1256 pixels</li>
                  <li>• <strong>Aspect Ratio:</strong> 1.91:1 (landscape)</li>
                  <li>• <strong>File Formats:</strong> JPG, PNG, WebP</li>
                  <li>• <strong>Maximum File Size:</strong> 5 MB</li>
                  <li>• <strong>Color Space:</strong> RGB (not CMYK)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Best Practices
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• Use high-quality, eye-catching imagery</li>
                  <li>• Ensure text is readable on mobile devices</li>
                  <li>• Avoid excessive text (max 20% of image)</li>
                  <li>• Use brand colors and maintain consistency</li>
                  <li>• Test on multiple screen sizes</li>
                  <li>• Include clear visual hierarchy</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Video className="w-6 h-6" />
              Video Creative Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Technical Specifications
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• <strong>Format:</strong> MP4 (H.264 codec)</li>
                  <li>• <strong>Resolution:</strong> 1080p (1920 × 1080)</li>
                  <li>• <strong>Frame Rate:</strong> 30 fps minimum</li>
                  <li>• <strong>Duration:</strong> 6-30 seconds</li>
                  <li>• <strong>Maximum File Size:</strong> 100 MB</li>
                  <li>• <strong>Audio:</strong> AAC codec, 128 kbps+</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Content Guidelines
                </h3>
                <ul className="space-y-1 text-gray-800 text-sm">
                  <li>• Hook viewers in first 3 seconds</li>
                  <li>• Include captions for accessibility</li>
                  <li>• Optimize for sound-off viewing</li>
                  <li>• Keep branding visible throughout</li>
                  <li>• End with clear call-to-action</li>
                  <li>• Test on mobile first</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <FileText className="w-6 h-6" />
              Ad Copy Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Headline / Title</h3>
                <p className="text-sm text-gray-800">
                  <strong>Length:</strong> 60-100 characters<br />
                  <strong>Purpose:</strong> Grab attention and communicate main value proposition<br />
                  <strong>Best Practice:</strong> Use action words, numbers, and emotional triggers
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Description</h3>
                <p className="text-sm text-gray-800">
                  <strong>Length:</strong> 150-500 characters<br />
                  <strong>Purpose:</strong> Provide context and persuade users to click<br />
                  <strong>Best Practice:</strong> Focus on benefits, not features. Be conversational.
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Call-to-Action (CTA)</h3>
                <p className="text-sm text-gray-800">
                  <strong>Length:</strong> 10-30 characters<br />
                  <strong>Examples:</strong> "Shop Now", "Learn More", "Sign Up Free", "Get Started"<br />
                  <strong>Best Practice:</strong> Use action verbs and create urgency when appropriate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Globe className="w-6 h-6" />
              Landing Page Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-black">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">HTTPS Required:</strong>
                <p className="text-sm text-gray-800">All landing pages must use secure HTTPS protocol</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">Mobile Responsive:</strong>
                <p className="text-sm text-gray-800">Must work seamlessly on smartphones and tablets (60%+ of traffic)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">Fast Load Time:</strong>
                <p className="text-sm text-gray-800">Page must load in under 3 seconds on 4G connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">Clear Value Proposition:</strong>
                <p className="text-sm text-gray-800">Immediately communicate what you're offering</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-black">Functional & Active:</strong>
                <p className="text-sm text-gray-800">No "coming soon" or under construction pages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 !border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <Shield className="w-6 h-6" />
              Legal & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 !text-black">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">Required</Badge>
                <div>
                  <strong className="text-black">Business Registration:</strong>
                  <p className="text-sm text-gray-800">Valid business license and tax ID (EIN or SSN for sole proprietors)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">Required</Badge>
                <div>
                  <strong className="text-black">Truthful Advertising:</strong>
                  <p className="text-sm text-gray-800">All claims must be accurate and substantiated. No misleading statements.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">Required</Badge>
                <div>
                  <strong className="text-black">Age-Appropriate Content:</strong>
                  <p className="text-sm text-gray-800">Suitable for users 13+. No adult content, violence, or profanity.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">Required</Badge>
                <div>
                  <strong className="text-black">Intellectual Property:</strong>
                  <p className="text-sm text-gray-800">You must own or have rights to all creative assets used in ads</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">Required</Badge>
                <div>
                  <strong className="text-black">Privacy Compliance:</strong>
                  <p className="text-sm text-gray-800">Comply with GDPR, CCPA, and other data privacy regulations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white border-2 border-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-black">
              <XCircle className="w-6 h-6 text-red-600" />
              Prohibited Content
            </CardTitle>
          </CardHeader>
          <CardContent className="!text-black">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">Strictly Prohibited</h3>
                <ul className="space-y-1 text-sm text-gray-800">
                  <li>• Tobacco, vaping, or smoking products</li>
                  <li>• Illegal drugs or drug paraphernalia</li>
                  <li>• Weapons, firearms, or ammunition</li>
                  <li>• Adult content or sexual services</li>
                  <li>• Gambling or online casinos</li>
                  <li>• Get-rich-quick schemes or MLMs</li>
                  <li>• Cryptocurrency or forex trading</li>
                  <li>• Political campaign advertisements</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">Also Not Allowed</h3>
                <ul className="space-y-1 text-sm text-gray-800">
                  <li>• Hate speech or discriminatory content</li>
                  <li>• Misleading health claims or fake cures</li>
                  <li>• Counterfeit or knock-off products</li>
                  <li>• Deceptive business practices</li>
                  <li>• Malware or phishing attempts</li>
                  <li>• Content promoting eating disorders</li>
                  <li>• Payday loans or predatory lending</li>
                  <li>• Content violating third-party rights</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-gray-800">
                <strong className="text-red-600">Note:</strong> MyKliq reserves the right to reject any advertisement 
                that doesn't align with our community values or violates our terms of service.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-600">
          <CardHeader>
            <CardTitle className="text-black">Ready to Advertise?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-800">
              If you meet all the requirements above and are ready to reach our engaged community 
              of private social circles, start your application today.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/advertiser-onboarding">
                <Button size="lg" data-testid="button-start-onboarding-bottom">
                  Start Application
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button variant="outline" size="lg" data-testid="button-contact-ads-bottom">
                  Contact Ads Team
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-700">
              Questions? Email us at{" "}
              <a 
                href="mailto:mykliqadsmanagement@outlook.com" 
                className="text-blue-600 hover:underline font-medium"
              >
                mykliqadsmanagement@outlook.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </ForcedLightSurface>
  );
}
