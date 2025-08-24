import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Instagram, 
  Youtube, 
  Twitch,
  MessageCircle,
  Heart,
  Share,
  ExternalLink,
  Clock
} from "lucide-react";

interface DemoPost {
  id: string;
  platform: string;
  username: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  postUrl: string;
}

const demoData: DemoPost[] = [
  {
    id: "1",
    platform: "instagram",
    username: "alex_adventures",
    content: "Just finished an amazing hike! The view from the top was absolutely breathtaking 🏔️ #hiking #nature #adventure",
    mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    likes: 127,
    comments: 23,
    shares: 8,
    timestamp: "2 hours ago",
    postUrl: "https://instagram.com/p/demo123"
  },
  {
    id: "2",
    platform: "youtube",
    username: "TechReviewsDaily",
    content: "New video is live! Reviewing the latest smartphone features and comparing battery life across different models.",
    mediaUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
    likes: 89,
    comments: 15,
    shares: 12,
    timestamp: "4 hours ago",
    postUrl: "https://youtube.com/watch?v=demo456"
  },
  {
    id: "3",
    platform: "twitch",
    username: "GamerJess",
    content: "Starting my evening stream! Playing the new RPG everyone's been talking about. Come hang out! 🎮",
    likes: 45,
    comments: 8,
    shares: 3,
    timestamp: "6 hours ago",
    postUrl: "https://twitch.tv/demo789"
  }
];

const platformInfo = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  youtube: {
    name: "YouTube", 
    icon: Youtube,
    color: "bg-red-600"
  },
  twitch: {
    name: "Twitch",
    icon: Twitch,
    color: "bg-purple-600"
  },
  discord: {
    name: "Discord",
    icon: MessageCircle,
    color: "bg-indigo-600"
  }
};

export function SocialFeedDemo() {
  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Social Media Feed
          </CardTitle>
          <p className="text-purple-200 text-sm">
            See all your connected social media content in one place
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoData.map((post) => {
            const platform = platformInfo[post.platform as keyof typeof platformInfo];
            const Icon = platform?.icon || MessageCircle;
            
            return (
              <div 
                key={post.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} />
                      <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">@{post.username}</h4>
                        <div className={`p-1 rounded ${platform?.color || 'bg-gray-600'}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-purple-300 text-xs">
                        <Clock className="w-3 h-3" />
                        {post.timestamp}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-200 border-purple-300">
                    {platform?.name || post.platform}
                  </Badge>
                </div>

                {/* Content */}
                <p className="text-white mb-3 text-sm leading-relaxed">
                  {post.content}
                </p>

                {/* Media */}
                {post.mediaUrl && (
                  <div className="mb-3">
                    <img 
                      src={post.mediaUrl} 
                      alt="Post media"
                      className="rounded-lg w-full max-h-48 object-cover"
                    />
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-purple-200 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="w-4 h-4" />
                      {post.shares}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(post.postUrl, '_blank')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            );
          })}
          
          <div className="text-center py-4">
            <p className="text-purple-200 text-sm mb-2">
              This is a preview of how your social media feed will look
            </p>
            <p className="text-purple-300 text-xs">
              Connect your accounts in Settings to see your real content here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}