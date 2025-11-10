import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Medal, Gem, Crown } from "lucide-react";

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

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

const streakBorderIcons: Record<string, { Icon: any; color: string; bg: string }> = {
  "Bronze Medal": {
    Icon: Medal,
    color: "#cd7f32",
    bg: "bg-gradient-to-br from-amber-700 to-amber-900"
  },
  "Silver Medal": {
    Icon: Medal,
    color: "#c0c0c0",
    bg: "bg-gradient-to-br from-gray-300 to-gray-500"
  },
  "Gold Medal": {
    Icon: Medal,
    color: "#ffd700",
    bg: "bg-gradient-to-br from-yellow-400 to-yellow-600"
  },
  "Diamond": {
    Icon: Gem,
    color: "#b9f2ff",
    bg: "bg-gradient-to-br from-cyan-200 to-blue-400"
  },
  "Legend Crown": {
    Icon: Crown,
    color: "#ffd700",
    bg: "bg-gradient-to-br from-yellow-400 to-orange-500"
  },
};

const borderStyles: Record<string, { wrapper?: string; avatar: string }> = {
  "Rainbow Sparkle": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff0000_0%,#ff7700_14%,#ffdd00_28%,#00ff00_42%,#0099ff_57%,#4400ff_71%,#ff00ff_85%,#ff0000_100%)] p-1 rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_20px_rgba(255,0,255,0.6),0_0_40px_rgba(0,255,255,0.4)]",
    avatar: ""
  },
  "Neon Glow": {
    wrapper: "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.8),0_0_30px_rgba(138,43,226,0.6),inset_0_0_10px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  "Fire Frame": {
    wrapper: "bg-[conic-gradient(from_45deg,#ff0000_0%,#ff4400_10%,#ff8800_20%,#ff0000_30%,#ff6600_40%,#ff2200_50%,#ff0000_60%,#ff8800_70%,#ff4400_80%,#ff0000_100%)] p-1 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(255,68,0,0.8),0_0_40px_rgba(255,136,0,0.6),inset_0_0_15px_rgba(255,200,0,0.4)]",
    avatar: ""
  },
  "Ice Crystal": {
    wrapper: "bg-[conic-gradient(from_0deg,#00d4ff_0%,#80e5ff_12.5%,#ffffff_25%,#b3f0ff_37.5%,#00ffff_50%,#66d9ff_62.5%,#ffffff_75%,#00bbff_87.5%,#00d4ff_100%)] p-[3px] rounded-full shadow-[0_0_15px_rgba(0,212,255,0.7),0_0_30px_rgba(0,255,255,0.5),inset_0_0_10px_rgba(255,255,255,0.6)]",
    avatar: ""
  },
  "Galaxy Swirl": {
    wrapper: "bg-[radial-gradient(circle_at_30%_30%,#8800ff,#4400ff_30%,#bb00ff_50%,#ff00ff_70%,#2200aa_100%)] p-1 rounded-full animate-[spin_8s_linear_infinite] shadow-[0_0_25px_rgba(136,0,255,0.8),0_0_50px_rgba(255,0,255,0.6),inset_0_0_20px_rgba(187,0,255,0.4)]",
    avatar: ""
  },
  "Cherry Blossom": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffb6db_0%,#ff69b4_8%,#ffa0ce_16%,#ff85c1_24%,#ffb6db_32%,#ff69b4_40%,#ffa0ce_48%,#ff85c1_56%,#ffb6db_64%,#ff69b4_72%,#ffa0ce_80%,#ff85c1_88%,#ffb6db_100%)] p-[3px] rounded-full shadow-[0_0_20px_rgba(255,105,180,0.6),0_0_40px_rgba(255,182,219,0.4)]",
    avatar: ""
  },
  "Lightning Strike": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffff00_0%,#ffffff_5%,#ffff66_10%,#ffff00_15%,#ffffff_20%,#ffffaa_25%,#ffff00_30%,#ffffff_35%,#ffff88_40%,#ffff00_45%,#ffffff_50%,#ffffcc_55%,#ffff00_60%,#ffffff_65%,#ffff66_70%,#ffff00_75%,#ffffff_80%,#ffffaa_85%,#ffff00_90%,#ffffff_95%,#ffff00_100%)] p-1 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] shadow-[0_0_20px_rgba(255,255,0,0.9),0_0_40px_rgba(255,255,255,0.7),0_0_60px_rgba(255,255,0,0.5)]",
    avatar: ""
  },
  "Royal Purple": {
    wrapper: "bg-[conic-gradient(from_0deg,#6600cc_0%,#ffcc00_10%,#8800ee_20%,#ffcc00_30%,#aa00ff_40%,#ffcc00_50%,#dd00ff_60%,#ffcc00_70%,#7700dd_80%,#ffcc00_90%,#6600cc_100%)] p-[3px] rounded-full shadow-[0_0_20px_rgba(170,0,255,0.7),0_0_40px_rgba(255,204,0,0.5),inset_0_0_15px_rgba(102,0,204,0.4)]",
    avatar: ""
  },
  "Bronze Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#cd7f32,#b87333,#a0522d,#d4a574,#c9985f,#be8c4a,#cd7f32)] p-1 rounded-full shadow-[0_0_15px_rgba(205,127,50,0.6),inset_0_0_10px_rgba(212,165,116,0.3)]",
    avatar: ""
  },
  "Silver Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#c0c0c0,#d3d3d3,#e8e8e8,#f5f5f5,#dddddd,#cccccc,#c0c0c0)] p-1 rounded-full shadow-[0_0_15px_rgba(192,192,192,0.6),inset_0_0_10px_rgba(245,245,245,0.4)]",
    avatar: ""
  },
  "Gold Medal": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#ffed4e,#fff68f,#ffffcc,#ffeb3b,#ffc107,#ffd700)] p-1 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.7),inset_0_0_15px_rgba(255,246,143,0.4)]",
    avatar: ""
  },
  "Diamond": {
    wrapper: "bg-[conic-gradient(from_0deg,#b9f2ff_0%,#ffffff_10%,#e0f7ff_20%,#ffffff_30%,#f0faff_40%,#ffffff_50%,#d4f1ff_60%,#ffffff_70%,#c4ecff_80%,#ffffff_90%,#b9f2ff_100%)] p-[3px] rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_25px_rgba(185,242,255,0.8),0_0_50px_rgba(255,255,255,0.6),inset_0_0_20px_rgba(255,255,255,0.7)]",
    avatar: ""
  },
  "Legend Crown": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700_0%,#ff6b00_8%,#ffed4e_16%,#ff8800_24%,#ffd700_32%,#ff6b00_40%,#ffaa00_48%,#ff8800_56%,#ffd700_64%,#ff6b00_72%,#ffed4e_80%,#ff8800_88%,#ffd700_100%)] p-1 rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_30px_rgba(255,215,0,0.8),0_0_60px_rgba(255,107,0,0.6),inset_0_0_20px_rgba(255,237,78,0.5)]",
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
  const iconSize = iconSizeClasses[size];
  const borderStyle = borderName && borderStyles[borderName] ? borderStyles[borderName] : null;
  const streakIcon = borderName && streakBorderIcons[borderName] ? streakBorderIcons[borderName] : null;

  // Render streak icon badge if applicable
  const renderStreakBadge = () => {
    if (!streakIcon) return null;
    const { Icon, bg } = streakIcon;
    return (
      <div className={cn(
        "absolute -top-1 -left-1 rounded-full p-1 shadow-lg z-10",
        bg
      )}>
        <Icon className={cn(iconSize, "text-white drop-shadow-md")} />
      </div>
    );
  };

  // CSS-based border with wrapper
  if (borderStyle?.wrapper) {
    return (
      <div className="relative inline-block">
        <div className={borderStyle.wrapper}>
          <Avatar className={cn(sizeClass, className)}>
            <AvatarImage src={src} alt={alt} className="object-cover" />
            <AvatarFallback className="bg-muted text-foreground">
              {fallback}
            </AvatarFallback>
          </Avatar>
        </div>
        {renderStreakBadge()}
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
        {renderStreakBadge()}
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
      {renderStreakBadge()}
    </div>
  );
}
