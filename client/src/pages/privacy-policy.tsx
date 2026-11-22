import { PageWrapper } from "@/components/PageWrapper";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-8 !text-black">{uiText("Privacy Policy")}</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 !text-black">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Information We Collect")}</h2>
              <p className="mb-4">
                {uiText("MyKliq collects information you provide when creating your account and using our services, including:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Profile information (name, email, profile picture)")}</li>
                <li>{uiText("Content you create and share (posts, comments, photos, videos)")}</li>
                <li>{uiText("Usage data and interactions within the platform")}</li>
                <li>{uiText("Communication preferences and settings")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Mobile Application Data Collection")}</h2>
              <p className="mb-4">
                {uiText("When you use the MyKliq mobile application (iOS and Android), we collect additional information to provide mobile-specific features:")}
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Camera and Photo Library Access")}</h3>
              <p className="mb-4">
                {uiText("We request access to your device's camera and photo library to enable you to:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Take photos and videos for posts and stories")}</li>
                <li>{uiText("Upload existing photos and videos from your library")}</li>
                <li>{uiText("Set and update your profile picture")}</li>
                <li>{uiText("Share visual content with your kliq")}</li>
              </ul>
              <p className="mb-4">
                <strong>{uiText("Important:")}</strong> {uiText("Photos and videos are only accessed when you explicitly choose to upload them. We do not access your camera or photo library in the background or without your permission.")}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Location Data")}</h3>
              <p className="mb-4">
                {uiText("We collect location information when you use location-based features:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>{uiText("GPS Meetups:")}</strong> {uiText("Real-time location for discovering nearby kliq members and check-ins")}</li>
                <li><strong>{uiText("Event Location Tagging:")}</strong> {uiText("Optional location tags for calendar events")}</li>
                <li><strong>{uiText("Post Location Tags:")}</strong> {uiText("Optional location data when creating posts")}</li>
              </ul>
              <p className="mb-4">
                <strong>{uiText("Control Your Location:")}</strong> {uiText("You can enable or disable location services for MyKliq at any time in your device settings. Location data is only collected when you actively use GPS-based features and is never shared without your consent.")}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Push Notifications")}</h3>
              <p className="mb-4">
                {uiText("With your permission, we send push notifications to keep you updated about:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("New posts from your kliq members")}</li>
                <li>{uiText("Comments and replies on your posts")}</li>
                <li>{uiText("Likes and reactions to your content")}</li>
                <li>{uiText("New messages and conversations")}</li>
                <li>{uiText("Story replies and mentions")}</li>
                <li>{uiText("Friend requests and kliq updates")}</li>
                <li>{uiText("Kliq Koin milestones and streaks")}</li>
                <li>{uiText("Event reminders and calendar notifications")}</li>
                <li>{uiText("Sports score updates (if enabled)")}</li>
              </ul>
              <p className="mb-4">
                <strong>{uiText("Manage Notifications:")}</strong> {uiText("You can customize which notifications you receive in the app's Notification Preferences screen or disable push notifications entirely in your device settings.")}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Device Information and Analytics")}</h3>
              <p className="mb-4">
                {uiText("We collect technical information about your mobile device to improve app performance and user experience:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Device model, operating system, and version")}</li>
                <li>{uiText("Device identifiers (for push notification registration)")}</li>
                <li>{uiText("App version and installation data")}</li>
                <li>{uiText("Crash reports and error logs")}</li>
                <li>{uiText("Performance metrics (load times, feature usage)")}</li>
                <li>{uiText("Network connection type (WiFi, cellular)")}</li>
              </ul>
              <p className="mb-4">
                {uiText("We use")} <strong>{uiText("Firebase Analytics")}</strong> {uiText("and")} <strong>{uiText("Firebase Cloud Messaging")}</strong> {uiText("for mobile app analytics and push notifications. This data is anonymized and used solely to improve app stability, performance, and user experience.")}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Local Data Storage")}</h3>
              <p className="mb-4">
                {uiText("The mobile app stores certain data locally on your device for offline access and improved performance:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Authentication tokens (securely stored)")}</li>
                <li>{uiText("Theme preferences and app settings")}</li>
                <li>{uiText("Cached feed content and images")}</li>
                <li>{uiText("Draft posts and messages")}</li>
                <li>{uiText("Recently viewed stories and content")}</li>
              </ul>
              <p className="mb-4">
                {uiText("All locally stored data is encrypted and protected by your device's security features. This data is automatically cleared when you log out or uninstall the app.")}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Third-Party Services (Mobile)")}</h3>
              <p className="mb-4">
                {uiText("The mobile app integrates with the following third-party services:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>{uiText("Firebase (Google):")}</strong> {uiText("Analytics, push notifications, and crash reporting")}</li>
                <li><strong>{uiText("Google Gemini API:")}</strong> {uiText("AI-powered mood boost content generation")}</li>
                <li><strong>{uiText("ESPN API:")}</strong> {uiText("Sports scores and updates")}</li>
                <li><strong>{uiText("Social Media Platforms:")}</strong> {uiText("Optional integrations for content aggregation (Instagram, YouTube, TikTok, etc.)")}</li>
              </ul>
              <p className="mb-4">
                {uiText("These services have their own privacy policies. We recommend reviewing them to understand how they handle your data.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("How We Use Your Information")}</h2>
              <p className="mb-4">{uiText("We use your information to:")}</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Provide and maintain our social networking services")}</li>
                <li>{uiText("Personalize your experience and content recommendations")}</li>
                <li>{uiText("Communicate with you about updates and features")}</li>
                <li>{uiText("Ensure platform security and prevent abuse")}</li>
                <li>{uiText("Improve our services through analytics and user feedback")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Information Sharing")}</h2>
              <p className="mb-4">
                {uiText("MyKliq is designed for sharing within your close friend groups (\"kliqs\"). Content you share is visible to:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Members of your kliq based on friend ranking and privacy settings")}</li>
                <li>{uiText("Other users as determined by your content filter and sharing preferences")}</li>
              </ul>
              <p className="mb-4">
                {uiText("We do not sell your personal information to third parties. We may share anonymized, aggregated data for analytics purposes.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Data Security")}</h2>
              <p className="mb-4">
                {uiText("We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is 100% secure.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Your Rights and Controls")}</h2>
              <p className="mb-4">{uiText("You have the right to:")}</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{uiText("Access and update your personal information")}</li>
                <li>{uiText("Delete your account and associated data")}</li>
                <li>{uiText("Control your privacy settings and content visibility")}</li>
                <li>{uiText("Opt out of certain communications")}</li>
                <li><strong>{uiText("Mobile Users:")}</strong> {uiText("Revoke camera, location, and notification permissions at any time through device settings")}</li>
                <li><strong>{uiText("Mobile Users:")}</strong> {uiText("Clear locally cached data by logging out or uninstalling the app")}</li>
                <li><strong>{uiText("Mobile Users:")}</strong> {uiText("Customize notification preferences in-app or disable all push notifications in device settings")}</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">{uiText("Mobile Permissions Summary")}</h3>
              <p className="mb-4">
                {uiText("The MyKliq mobile app requests the following device permissions. All permissions are optional and you can deny them while still using core app features:")}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>{uiText("Camera:")}</strong> {uiText("Take photos/videos for posts and stories (optional)")}</li>
                <li><strong>{uiText("Photo Library:")}</strong> {uiText("Upload photos/videos from your device (optional)")}</li>
                <li><strong>{uiText("Location (When In Use):")}</strong> {uiText("GPS meetups and location tagging (optional)")}</li>
                <li><strong>{uiText("Notifications:")}</strong> {uiText("Receive updates about posts, messages, and events (optional)")}</li>
              </ul>
              <p className="mb-4">
                {uiText("You will be prompted to grant permissions when you first use each feature. You can change these permissions at any time in your device's Settings app.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Contact Us")}</h2>
              <p className="mb-4">
                {uiText("If you have questions about this Privacy Policy, please contact us at")}{" "}
                <a href="mailto:mykliqassistance@outlook.com" className="text-primary hover:underline">
                  {uiText("mykliqassistance@outlook.com")}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Children's Privacy")}</h2>
              <p className="mb-4">
                {uiText("MyKliq is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately and we will delete it.")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{uiText("Changes to This Policy")}</h2>
              <p className="mb-4">
                {uiText("We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the \"Last updated\" date below. For mobile users, we may also send a push notification about major privacy policy changes.")}
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                {uiText("Last updated: November 14, 2025")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {uiText("Version 2.0 - Added mobile application privacy disclosures")}
              </p>
            </section>
          </div>
        </div>
    </PageWrapper>
  );
}