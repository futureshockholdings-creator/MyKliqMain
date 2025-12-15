import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Zap, 
  Shield, 
  Heart, 
  Star, 
  TrendingUp, 
  MessageCircle, 
  Camera, 
  Crown,
  Sparkles,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Download,
  Smartphone,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  Images
} from "lucide-react";
import Footer from "@/components/Footer";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";

const demoScreenshots = [
  {
    url: "/demo-screenshots/profile-view.png",
    title: "Profile View",
    description: "Customize your profile with themes, borders, and personal info"
  },
  {
    url: "/demo-screenshots/feed-view.png",
    title: "Feed View", 
    description: "See posts from your closest friends in your personalized feed"
  },
  {
    url: "/demo-screenshots/friend-ranking.png",
    title: "Friend Ranking",
    description: "Rank your friends 1-28 to prioritize who matters most"
  },
  {
    url: "/demo-screenshots/messaging.png",
    title: "Messaging",
    description: "Private conversations with your kliq members"
  },
  {
    url: "/demo-screenshots/stories.png",
    title: "Stories",
    description: "Share 24-hour stories with your inner circle"
  },
  {
    url: "/demo-screenshots/theme-customization.png",
    title: "Theme Customization",
    description: "Make the app your own with custom colors and styles"
  }
];

export default function Marketing() {
  const [email, setEmail] = useState("");
  const [currentFeature, setCurrentFeature] = useState(0);
  const [userCount, setUserCount] = useState(10000);
  const [showDemo, setShowDemo] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState(0);

  const nextScreenshot = () => {
    setCurrentScreenshot((prev) => (prev + 1) % demoScreenshots.length);
  };

  const prevScreenshot = () => {
    setCurrentScreenshot((prev) => (prev - 1 + demoScreenshots.length) % demoScreenshots.length);
  };

  // Simulate growing user count for social proof
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotating feature highlights
  const features = [
    { icon: Crown, text: "Rank your closest friends 1-28", color: "text-yellow-500" },
    { icon: MessageCircle, text: "Private circle conversations", color: "text-blue-500" },
    { icon: Shield, text: "Smart content filtering", color: "text-purple-500" },
    { icon: Camera, text: "Stories that actually matter", color: "text-pink-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleEarlyAccess = () => {
    if (email) {
      // Handle email signup - could integrate with email service
      alert(`Thanks ${email}! You're on the early access list 🎉`);
      setEmail("");
    }
  };

  return (
    <ForcedLightSurface className="overflow-hidden">
      {/* Clean Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none bg-white"></div>

      {/* Navigation */}
      <nav className="relative z-50 flex justify-between items-center p-6 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center border border-green-500">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#00ff00" strokeWidth="2.5" fill="none">
                <circle cx="16" cy="10" r="3"/>
                <path d="M10 22 L10 18 Q10 15 13 15 L19 15 Q22 15 22 18 L22 22"/>
                <path d="M24 8 L24 16 M20 12 L28 12"/>
              </g>
            </svg>
          </div>
          <span className="text-2xl font-bold !text-black">MyKliq</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-blue-100 !text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
            Coming Soon
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 text-center px-6 pt-20 pb-32 !bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Rotating Feature Badge */}
          <div className="mb-8 flex justify-center">
            <Badge className="bg-purple-100 !text-purple-800 px-4 py-2 text-sm">
              {React.createElement(features[currentFeature].icon, { className: `h-4 w-4 mr-2 ${features[currentFeature].color}` })}
              {features[currentFeature].text}
            </Badge>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 !text-black">
            Your <span className="text-purple-600">Closest</span> Circle
          </h1>
          
          <p className="text-xl md:text-2xl !text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            The first social media that actually brings friends closer together. 
            <span className="text-purple-600 font-semibold"> Rank your friends</span>, 
            <span className="text-blue-600 font-semibold"> create meaningful content</span>, and 
            <span className="text-pink-600 font-semibold"> build authentic connections</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="!bg-black hover:!bg-gray-800 !text-white px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105">
              <Download className="h-5 w-5 mr-2" />
              Download Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="!border-black !text-black hover:!bg-gray-100 px-8 py-4 text-lg"
              onClick={() => setShowDemo(true)}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm !text-gray-600">
            <div className="flex items-center">
              <Star className="h-4 w-4 !text-gray-800 mr-1" />
              <span>N/A App Store Rating</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 !text-gray-800 mr-1" />
              <span>Coming to App Store</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 !text-gray-800 mr-1" />
              <span>N/A Active Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-40 px-6 py-20 !bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 !text-black">
              Why MyKliq is <span className="!text-gray-800">Different</span>
            </h2>
            <p className="text-xl !text-gray-600 max-w-2xl mx-auto">
              Stop scrolling through strangers. Start connecting with friends who actually matter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Friend Ranking */}
            <Card className="!bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 !bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <Crown className="h-6 w-6 !text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 !text-black">Friend Pyramid</h3>
                <p className="!text-gray-600">Rank your friends 1-28. See who your real ones are and strengthen those bonds.</p>
              </CardContent>
            </Card>

            {/* Content Filtering */}
            <Card className="!bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 !bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 !text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 !text-black">Content Filtering</h3>
                <p className="!text-gray-600">Customize what content you see based on friend rankings and personal preferences.</p>
              </CardContent>
            </Card>

            {/* Moviecons */}
            <Card className="!bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 !bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <PlayCircle className="h-6 w-6 !text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 !text-black">Moviecons</h3>
                <p className="!text-gray-600">Create custom video reactions and emotes to express yourself uniquely in conversations.</p>
              </CardContent>
            </Card>

            {/* Meaningful Stories */}
            <Card className="!bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 !bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 !text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 !text-black">Stories That Matter</h3>
                <p className="!text-gray-600">Share moments with people who actually care. No algorithm, just genuine connections.</p>
              </CardContent>
            </Card>

            {/* Custom Themes */}
            <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-800/30 border-yellow-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Your Vibe</h3>
                <p className="text-gray-300">Customize everything. Make your social space reflect your personality.</p>
              </CardContent>
            </Card>

            {/* Social Media Integration */}
            <Card className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 border-indigo-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Social Integration</h3>
                <p className="text-gray-300">Connect your Instagram, TikTok, YouTube and other platforms in one unified feed.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-40 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Getting Started is <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Simple</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Download & Sign Up</h3>
              <p className="text-gray-300">Get MyKliq from the App Store or Google Play. Sign up in seconds.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Invite Your Circle</h3>
              <p className="text-gray-300">Add your closest friends and rank them by how close you are.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Connect Authentically</h3>
              <p className="text-gray-300">Share, poll, and chat with people who actually matter to you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-40 px-6 py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            What Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Users Say</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"Finally, a social app that doesn't make me feel anxious. Just me and my real friends."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-gray-400">MyKliq User</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"The friend ranking helped me realize who my true friends are. It's actually brought us closer."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Mike R.</p>
                    <p className="text-sm text-gray-400">Software Engineer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"No more endless scrolling through strangers' posts. Just quality time with my squad."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Emma L.</p>
                    <p className="text-sm text-gray-400">Marketing Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early Access CTA */}
      <section className="relative z-40 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Find Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Real Friends</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who've discovered authentic social connections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="max-w-md bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button 
                onClick={handleEarlyAccess}
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 font-semibold shadow-2xl shadow-purple-500/25"
              >
                Get Early Access
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                Free to download
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                Available on all devices
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="relative z-40 px-6 py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Download MyKliq Today</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl">
              <Smartphone className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="text-xs text-gray-400">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </Button>
            
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl">
              <Smartphone className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="text-xs text-gray-400">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-2xl font-bold text-white">MyKliq App Demo</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDemo(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden">
                {/* Demo Video Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <PlayCircle className="h-10 w-10 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Interactive App Walkthrough</h4>
                    <p className="text-gray-400 mb-6">See MyKliq in action with this comprehensive demo</p>
                    
                    {/* Demo Sections */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <h5 className="font-semibold text-white mb-2">Landing Experience</h5>
                        <p className="text-gray-400 text-sm">Beautiful onboarding and sign-up flow</p>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <h5 className="font-semibold text-white mb-2">Profile Setup</h5>
                        <p className="text-gray-400 text-sm">Customization and personalization features</p>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                        <h5 className="font-semibold text-white mb-2">MyKliq Features</h5>
                        <p className="text-gray-400 text-sm">Friend ranking, posts, polls, and more</p>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-3">
                      <Button 
                        onClick={() => window.open('/landing', '_blank')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white mr-4"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Try Landing Page
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setShowDemo(false);
                          setShowGallery(true);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white mr-4"
                      >
                        <Images className="h-4 w-4 mr-2" />
                        View Demo Profile
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          // First login as admin, then navigate to kliq
                          const demoUrl = `${window.location.origin}`;
                          window.open(demoUrl, '_blank');
                        }}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Explore Demo App
                      </Button>
                    </div>
                    
                    <p className="text-gray-500 text-sm mt-6">
                      💡 Tip: Open each page in a new tab to explore the full experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Screenshots Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-2xl font-bold text-white">MyKliq App Screenshots</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowGallery(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="relative">
                <div className="aspect-[9/16] max-h-[60vh] mx-auto bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <img 
                    src={demoScreenshots[currentScreenshot].url}
                    alt={demoScreenshots[currentScreenshot].title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Images className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">Screenshot Coming Soon</p>
                    <p className="text-sm mt-2">{demoScreenshots[currentScreenshot].title}</p>
                  </div>
                </div>

                <button
                  onClick={prevScreenshot}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={nextScreenshot}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 text-center">
                <h4 className="text-xl font-semibold text-white">{demoScreenshots[currentScreenshot].title}</h4>
                <p className="text-gray-400 mt-2">{demoScreenshots[currentScreenshot].description}</p>
              </div>

              <div className="flex justify-center gap-2 mt-6">
                {demoScreenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreenshot(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentScreenshot ? 'bg-purple-500' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-gray-500 text-sm mt-4">
                {currentScreenshot + 1} of {demoScreenshots.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </ForcedLightSurface>
  );
}