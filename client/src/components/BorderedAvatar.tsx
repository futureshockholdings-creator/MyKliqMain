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
    wrapper: "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-1 rounded-full animate-pulse shadow-lg shadow-cyan-400/50",
    avatar: ""
  },
  "Fire Frame": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff0000,#ff4400,#ff8800,#ffaa00,#ff6600,#ff2200,#ff0000)] p-1 rounded-full shadow-lg shadow-orange-500/60",
    avatar: ""
  },
  "Ice Crystal": {
    wrapper: "bg-[conic-gradient(from_0deg,#00d4ff,#00ffff,#80e5ff,#b3f0ff,#66d9ff,#00bbff,#00d4ff)] p-1 rounded-full shadow-lg shadow-cyan-400/60",
    avatar: ""
  },
  "Galaxy Swirl": {
    wrapper: "bg-[conic-gradient(from_0deg,#4400ff,#8800ff,#bb00ff,#ff00ff,#cc00ff,#6600ff,#4400ff)] p-1 rounded-full shadow-lg shadow-purple-500/60",
    avatar: ""
  },
  "Cherry Blossom": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff69b4,#ff85c1,#ffa0ce,#ffb6db,#ff9bcc,#ff7abe,#ff69b4)] p-1 rounded-full shadow-lg shadow-pink-400/60",
    avatar: ""
  },
  "Lightning Strike": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffff00,#ffffff,#ffff66,#ffffaa,#ffff88,#ffffcc,#ffff00)] p-1 rounded-full animate-pulse shadow-lg shadow-yellow-300/70",
    avatar: ""
  },
  "Royal Purple": {
    wrapper: "bg-[conic-gradient(from_0deg,#6600cc,#8800ee,#aa00ff,#ffcc00,#dd00ff,#7700dd,#6600cc)] p-1 rounded-full shadow-lg shadow-purple-600/60",
    avatar: ""
  },
  "Bronze Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#cd7f32,#b87333,#a0522d,#d4a574,#c9985f,#be8c4a,#cd7f32)] p-1 rounded-full shadow-lg shadow-amber-700/60",
    avatar: ""
  },
  "Silver Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#c0c0c0,#d3d3d3,#e8e8e8,#f5f5f5,#dddddd,#cccccc,#c0c0c0)] p-1 rounded-full shadow-lg shadow-gray-400/60",
    avatar: ""
  },
  "Gold Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#ffed4e,#fff68f,#ffffcc,#ffeb3b,#ffc107,#ffd700)] p-1 rounded-full shadow-lg shadow-yellow-500/60",
    avatar: ""
  },
  "Diamond": {
    wrapper: "bg-[conic-gradient(from_0deg,#b9f2ff,#e0f7ff,#ffffff,#f0faff,#d4f1ff,#c4ecff,#b9f2ff)] p-1 rounded-full animate-pulse shadow-lg shadow-blue-200/70",
    avatar: ""
  },
  "Legend Crown": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#ffed4e,#ff6b00,#ffd700,#ffaa00,#ff8800,#ffd700)] p-1 rounded-full animate-pulse shadow-lg shadow-yellow-400/70",
    avatar: ""
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

  // CSS-based border with wrapper
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

  // Image-based border fallback (for future borders with actual images)
  if (borderImageUrl && !borderStyle) {
    return (
      <div className="relative inline-block">
        <Avatar className={cn(sizeClass, className)}>
          <AvatarImage src={src} alt={alt} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <img 
          src={borderImageUrl} 
          alt={borderName || "border"}
          className={cn("absolute inset-0 pointer-events-none", sizeClass)}
        />
      </div>
    );
  }

  // Default border (no special border)
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
