import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
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
              <h2 className="text-2xl font-semibold mb-4">Mobile Application Data Collection</h2>
              <p className="mb-4">
                When you use the MyKliq mobile application (iOS and Android), we collect additional information to provide mobile-specific features:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Camera and Photo Library Access</h3>
              <p className="mb-4">
                We request access to your device's camera and photo library to enable you to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Take photos and videos for posts and stories</li>
                <li>Upload existing photos and videos from your library</li>
                <li>Set and update your profile picture</li>
                <li>Share visual content with your kliq</li>
              </ul>
              <p className="mb-4">
                <strong>Important:</strong> Photos and videos are only accessed when you explicitly choose to upload them. 
                We do not access your camera or photo library in the background or without your permission.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Location Data</h3>
              <p className="mb-4">
                We collect location information when you use location-based features:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>GPS Meetups:</strong> Real-time location for discovering nearby kliq members and check-ins</li>
                <li><strong>Event Location Tagging:</strong> Optional location tags for calendar events</li>
                <li><strong>Post Location Tags:</strong> Optional location data when creating posts</li>
              </ul>
              <p className="mb-4">
                <strong>Control Your Location:</strong> You can enable or disable location services for MyKliq at any time in your device settings. 
                Location data is only collected when you actively use GPS-based features and is never shared without your consent.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Push Notifications</h3>
              <p className="mb-4">
                With your permission, we send push notifications to keep you updated about:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>New posts from your kliq members</li>
                <li>Comments and replies on your posts</li>
                <li>Likes and reactions to your content</li>
                <li>New messages and conversations</li>
                <li>Story replies and mentions</li>
                <li>Friend requests and kliq updates</li>
                <li>Kliq Koin milestones and streaks</li>
                <li>Event reminders and calendar notifications</li>
                <li>Sports score updates (if enabled)</li>
              </ul>
              <p className="mb-4">
                <strong>Manage Notifications:</strong> You can customize which notifications you receive in the app's Notification Preferences screen 
                or disable push notifications entirely in your device settings.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Device Information and Analytics</h3>
              <p className="mb-4">
                We collect technical information about your mobile device to improve app performance and user experience:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Device model, operating system, and version</li>
                <li>Device identifiers (for push notification registration)</li>
                <li>App version and installation data</li>
                <li>Crash reports and error logs</li>
                <li>Performance metrics (load times, feature usage)</li>
                <li>Network connection type (WiFi, cellular)</li>
              </ul>
              <p className="mb-4">
                We use <strong>Firebase Analytics</strong> and <strong>Firebase Cloud Messaging</strong> for mobile app analytics and push notifications. 
                This data is anonymized and used solely to improve app stability, performance, and user experience.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Local Data Storage</h3>
              <p className="mb-4">
                The mobile app stores certain data locally on your device for offline access and improved performance:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Authentication tokens (securely stored)</li>
                <li>Theme preferences and app settings</li>
                <li>Cached feed content and images</li>
                <li>Draft posts and messages</li>
                <li>Recently viewed stories and content</li>
              </ul>
              <p className="mb-4">
                All locally stored data is encrypted and protected by your device's security features. 
                This data is automatically cleared when you log out or uninstall the app.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Third-Party Services (Mobile)</h3>
              <p className="mb-4">
                The mobile app integrates with the following third-party services:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Firebase (Google):</strong> Analytics, push notifications, and crash reporting</li>
                <li><strong>Google Gemini API:</strong> AI-powered mood boost content generation</li>
                <li><strong>ESPN API:</strong> Sports scores and updates</li>
                <li><strong>Social Media Platforms:</strong> Optional integrations for content aggregation (Instagram, YouTube, TikTok, etc.)</li>
              </ul>
              <p className="mb-4">
                These services have their own privacy policies. We recommend reviewing them to understand how they handle your data.
              </p>
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
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Controls</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Control your privacy settings and content visibility</li>
                <li>Opt out of certain communications</li>
                <li><strong>Mobile Users:</strong> Revoke camera, location, and notification permissions at any time through device settings</li>
                <li><strong>Mobile Users:</strong> Clear locally cached data by logging out or uninstalling the app</li>
                <li><strong>Mobile Users:</strong> Customize notification preferences in-app or disable all push notifications in device settings</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Mobile Permissions Summary</h3>
              <p className="mb-4">
                The MyKliq mobile app requests the following device permissions. All permissions are optional and you can deny them while still using core app features:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Camera:</strong> Take photos/videos for posts and stories (optional)</li>
                <li><strong>Photo Library:</strong> Upload photos/videos from your device (optional)</li>
                <li><strong>Location (When In Use):</strong> GPS meetups and location tagging (optional)</li>
                <li><strong>Notifications:</strong> Receive updates about posts, messages, and events (optional)</li>
              </ul>
              <p className="mb-4">
                You will be prompted to grant permissions when you first use each feature. You can change these permissions at any time in your device's Settings app.
              </p>
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
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="mb-4">
                MyKliq is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. 
                If you believe we have collected information from a child under 13, please contact us immediately and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page 
                and updating the "Last updated" date below. For mobile users, we may also send a push notification about major privacy policy changes.
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                Last updated: November 14, 2025
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Version 2.0 - Added mobile application privacy disclosures
              </p>
            </section>
          </div>
        </div>
      <Footer />
    </div>
  );
}