import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BorderedAvatarProps {
  src: string | undefined;
  alt?: string;
  fallback: string;
  className?: string;
  borderImageUrl?: string | null;
  borderName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const borderStyles: Record<string, { wrapper?: string; avatar: string }> = {
  "Rainbow Sparkle": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff0000,#ff7700,#ffdd00,#00ff00,#0099ff,#4400ff,#ff00ff,#ff0000)] p-1 rounded-full animate-pulse",
    avatar: ""
  },
  "Neon Glow": {
    avatar: "ring-4 ring-cyan-400 ring-offset-2 ring-offset-transparent shadow-lg shadow-cyan-400/50 animate-pulse"
  },
  "Fire Frame": {
    avatar: "ring-4 ring-orange-500 ring-offset-2 ring-offset-transparent shadow-lg shadow-orange-500/50"
  },
  "Ice Crystal": {
    avatar: "ring-4 ring-blue-300 ring-offset-2 ring-offset-transparent shadow-lg shadow-blue-300/50"
  },
  "Galaxy Swirl": {
    avatar: "ring-4 ring-purple-500 ring-offset-2 ring-offset-transparent shadow-lg shadow-purple-500/50"
  },
  "Cherry Blossom": {
    avatar: "ring-4 ring-pink-400 ring-offset-2 ring-offset-transparent shadow-lg shadow-pink-400/50"
  },
  "Lightning Strike": {
    avatar: "ring-4 ring-yellow-300 ring-offset-2 ring-offset-transparent shadow-lg shadow-yellow-300/50 animate-pulse"
  },
  "Royal Purple": {
    avatar: "ring-4 ring-purple-700 ring-offset-2 ring-offset-transparent shadow-lg shadow-purple-700/50"
  },
  "Bronze Medal": {
    avatar: "ring-4 ring-amber-700 ring-offset-2 ring-offset-transparent shadow-lg shadow-amber-700/50"
  },
  "Silver Medal": {
    avatar: "ring-4 ring-gray-400 ring-offset-2 ring-offset-transparent shadow-lg shadow-gray-400/50"
  },
  "Gold Medal": {
    avatar: "ring-4 ring-yellow-500 ring-offset-2 ring-offset-transparent shadow-lg shadow-yellow-500/50"
  },
  "Diamond": {
    avatar: "ring-4 ring-blue-200 ring-offset-2 ring-offset-transparent shadow-lg shadow-blue-200/50 animate-pulse"
  },
  "Legend Crown": {
    avatar: "ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent shadow-lg shadow-yellow-400/50 animate-pulse"
  },
};

export function BorderedAvatar({
  src,
  alt,
  fallback,
  className,
  borderImageUrl,
  borderName,
  size = "md",
}: BorderedAvatarProps) {
  const sizeClass = sizeClasses[size];
  const borderStyle = borderName && borderStyles[borderName] ? borderStyles[borderName] : null;

  if (borderStyle?.wrapper) {
    return (
      <div className={borderStyle.wrapper}>
        <Avatar className={cn(sizeClass, className)}>
          <AvatarImage src={src} alt={alt} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <Avatar className={cn(
        sizeClass, 
        borderStyle ? borderStyle.avatar : "border-2 border-primary",
        className
      )}>
        <AvatarImage src={src} alt={alt} className="object-cover" />
        <AvatarFallback className="bg-muted text-foreground">
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
