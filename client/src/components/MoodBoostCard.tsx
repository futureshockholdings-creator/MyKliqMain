import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface MoodBoostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string;
    expiresAt: string;
  };
}

export function MoodBoostCard({ post }: MoodBoostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <Card 
        className="relative overflow-hidden rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fff5fa 100%)",
          borderImage: "linear-gradient(135deg, rgba(255, 20, 147, 0.5), rgba(0, 191, 255, 0.5)) 1",
        }}
        data-testid={`card-mood-boost-${post.id}`}
      >
        {/* Mood Boost Badge - Floating in top right */}
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            className="backdrop-blur-md bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white border-none shadow-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            data-testid="badge-mood-boost"
          >
            Mood Boost
          </Badge>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* "Just for you" label */}
          <div className="flex items-center gap-2 opacity-90">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600" data-testid="text-just-for-you">
              ✨ Just for you
            </span>
          </div>

          {/* Content with gradient overlay effect */}
          <div className="relative">
            <p 
              className="text-lg font-bold leading-relaxed bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
              data-testid="text-mood-boost-content"
            >
              {post.content}
            </p>
          </div>

          {/* Bottom section with subtle timestamp */}
          <div className="flex items-center justify-end text-xs pt-2 border-t border-gray-200" style={{ color: '#6b7280' }}>
            <span className="opacity-70" data-testid="text-expires-at">
              Expires in {getTimeRemaining(post.expiresAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to calculate time remaining
function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return "expired";
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
