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

const iconSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

const streakBorderIcons: Record<string, { emoji: string; bg: string }> = {
  "Bronze Medal": {
    emoji: "🥉",
    bg: "bg-gradient-to-br from-amber-400 to-amber-600"
  },
  "Silver Medal": {
    emoji: "🥈",
    bg: "bg-gradient-to-br from-gray-200 to-gray-400"
  },
  "Gold Medal": {
    emoji: "🥇",
    bg: "bg-gradient-to-br from-yellow-200 to-yellow-400"
  },
  "Diamond": {
    emoji: "💎",
    bg: "bg-gradient-to-br from-cyan-100 to-blue-300"
  },
  "Legend Crown": {
    emoji: "👑",
    bg: "bg-gradient-to-br from-yellow-200 to-orange-300"
  },
  "Rainbow Sparkle": {
    emoji: "🌈",
    bg: "bg-gradient-to-br from-purple-300 to-pink-400"
  },
  "Dragon Scale": {
    emoji: "🐉",
    bg: "bg-gradient-to-br from-red-500 to-orange-600"
  },
  "Phoenix Fire": {
    emoji: "🔥",
    bg: "bg-gradient-to-br from-orange-400 to-red-500"
  },
  "Starlight": {
    emoji: "⭐",
    bg: "bg-gradient-to-br from-yellow-200 to-amber-400"
  },
  "Moonbeam": {
    emoji: "🌙",
    bg: "bg-gradient-to-br from-purple-300 to-blue-400"
  },
  "Tropical Paradise": {
    emoji: "🌺",
    bg: "bg-gradient-to-br from-pink-400 to-purple-500"
  },
  "Inferno Blaze": {
    emoji: "🔥",
    bg: "bg-gradient-to-br from-orange-400 to-red-600"
  },
  "Electric Storm": {
    emoji: "⚡",
    bg: "bg-gradient-to-br from-blue-300 to-purple-500"
  },
  "Molten Lava": {
    emoji: "🌋",
    bg: "bg-gradient-to-br from-orange-500 to-red-700"
  },
  "Cosmic Nebula": {
    emoji: "🌌",
    bg: "bg-gradient-to-br from-purple-400 to-pink-600"
  },
  "Divine Radiance": {
    emoji: "✨",
    bg: "bg-gradient-to-br from-yellow-200 to-amber-400"
  },
  "Shadow Realm": {
    emoji: "💀",
    bg: "bg-gradient-to-br from-purple-600 to-gray-900"
  },
  "Enchanted Forest": {
    emoji: "🍃",
    bg: "bg-gradient-to-br from-green-400 to-emerald-600"
  },
  "Celestial Throne": {
    emoji: "👼",
    bg: "bg-gradient-to-br from-blue-200 to-purple-400"
  },
  "Infinity Spiral": {
    emoji: "♾️",
    bg: "bg-gradient-to-br from-purple-400 to-blue-600"
  },
  "Supernova Burst": {
    emoji: "💥",
    bg: "bg-gradient-to-br from-yellow-300 to-orange-500"
  },
  "Eternal Flame": {
    emoji: "🕯️",
    bg: "bg-gradient-to-br from-yellow-300 to-orange-400"
  },
  "Universe Core": {
    emoji: "🌟",
    bg: "bg-gradient-to-br from-blue-300 to-purple-500"
  },
  "Million Kliq Club": {
    emoji: "💎",
    bg: "bg-gradient-to-br from-yellow-200 via-purple-500 to-pink-500"
  },
  "Black History Month": {
    emoji: "✊🏿",
    bg: "bg-white"
  },
  "Mental Health Awareness": {
    emoji: "💚",
    bg: "bg-white"
  },
  "Pride Month": {
    emoji: "🏳️‍🌈",
    bg: "bg-white"
  },
  "4th of July": {
    emoji: "🗽",
    bg: "bg-white"
  },
  "National Suicide Prevention": {
    emoji: "💛",
    bg: "bg-white"
  },
  "Autism Awareness": {
    emoji: "🧩",
    bg: "bg-white"
  },
  "Hispanic Heritage": {
    emoji: "❤️",
    bg: "bg-white"
  },
  "Breast Cancer Awareness": {
    emoji: "💗",
    bg: "bg-white"
  },
  "Alzheimers Awareness": {
    emoji: "💜",
    bg: "bg-white"
  },
  "Interaction": {
    emoji: "🎯",
    bg: "bg-gradient-to-br from-blue-300 to-cyan-400"
  },
  "Social Butterfly": {
    emoji: "🦋",
    bg: "bg-gradient-to-br from-pink-300 to-purple-400"
  },
  "Kliq MVP": {
    emoji: "🏆",
    bg: "bg-gradient-to-br from-yellow-300 to-amber-500"
  },
  // Mood-Based Engagement Reward Borders
  "Emotionally Aware": {
    emoji: "💭",
    bg: "bg-gradient-to-br from-turquoise-300 to-cyan-400"
  },
  "Mood Warrior": {
    emoji: "🎭",
    bg: "bg-gradient-to-br from-orange-300 to-purple-400"
  },
  "Zen Master": {
    emoji: "🧘",
    bg: "bg-gradient-to-br from-lavender-200 to-purple-300"
  },
  // Horoscope-Based Engagement Reward Borders
  "Head in the Clouds": {
    emoji: "☁️",
    bg: "bg-gradient-to-br from-sky-200 to-blue-300"
  },
  "Clarity": {
    emoji: "🔮",
    bg: "bg-gradient-to-br from-yellow-200 to-amber-300"
  },
  "Stargazer": {
    emoji: "⭐",
    bg: "bg-gradient-to-br from-navy-400 to-blue-500"
  },
  // Bible Verse-Based Engagement Reward Borders
  "Saved": {
    emoji: "🙏",
    bg: "bg-gradient-to-br from-wheat-200 to-amber-300"
  },
  "Faithful": {
    emoji: "✝️",
    bg: "bg-gradient-to-br from-white to-blue-100"
  },
  "Blessed": {
    emoji: "🕊️",
    bg: "bg-gradient-to-br from-yellow-200 to-white"
  },
};

const borderStyles: Record<string, { wrapper?: string; avatar: string }> = {
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
  // 50 Koin Tier
  "Ocean Wave": {
    wrapper: "bg-[conic-gradient(from_0deg,#00d4ff,#0099cc,#00b8d4,#00acc1,#00d4ff)] p-1 rounded-full shadow-[0_0_18px_rgba(0,212,255,0.6),inset_0_0_12px_rgba(0,184,212,0.3)]",
    avatar: ""
  },
  "Sunset Glow": {
    wrapper: "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-1 rounded-full shadow-[0_0_20px_rgba(255,105,180,0.7)]",
    avatar: ""
  },
  "Emerald Ring": {
    wrapper: "bg-[conic-gradient(from_0deg,#00ff88,#00cc66,#00ffaa,#00dd77,#00ff88)] p-1 rounded-full shadow-[0_0_18px_rgba(0,255,136,0.6)]",
    avatar: ""
  },
  "Rose Gold": {
    wrapper: "bg-gradient-to-r from-pink-300 via-rose-400 to-amber-300 p-1 rounded-full shadow-[0_0_15px_rgba(255,192,203,0.6)]",
    avatar: ""
  },
  "Arctic Frost": {
    wrapper: "bg-gradient-to-br from-blue-100 via-cyan-200 to-white p-1 rounded-full shadow-[0_0_18px_rgba(0,255,255,0.5)]",
    avatar: ""
  },
  // 100 Koin Tier
  "Dragon Scale": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff0000,#8b0000,#ff4500,#b22222,#ff0000)] p-[3px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_25px_rgba(255,0,0,0.8),0_0_50px_rgba(139,0,0,0.5),inset_0_0_15px_rgba(255,69,0,0.4)]",
    avatar: ""
  },
  "Phoenix Fire": {
    wrapper: "bg-[conic-gradient(from_45deg,#ff6600,#ff9900,#ffcc00,#ff6600)] p-[3px] rounded-full animate-[spin_5s_linear_infinite] shadow-[0_0_25px_rgba(255,102,0,0.8),0_0_45px_rgba(255,153,0,0.6)]",
    avatar: ""
  },
  "Starlight": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffffff,#ffffcc,#ffff99,#ffffcc,#ffffff)] p-[3px] rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_30px_rgba(255,255,255,0.9),0_0_50px_rgba(255,255,204,0.7)]",
    avatar: ""
  },
  "Moonbeam": {
    wrapper: "bg-[radial-gradient(circle,#e6e6fa,#b19cd9,#9370db)] p-[3px] rounded-full animate-[pulse_4s_ease-in-out_infinite] shadow-[0_0_25px_rgba(147,112,219,0.7),inset_0_0_15px_rgba(230,230,250,0.5)]",
    avatar: ""
  },
  "Tropical Paradise": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff1493,#00ff7f,#ffd700,#ff6347,#ff1493)] p-[3px] rounded-full animate-[spin_7s_linear_infinite] shadow-[0_0_22px_rgba(255,20,147,0.7)]",
    avatar: ""
  },
  // 250 Koin Tier
  "Inferno Blaze": {
    wrapper: "bg-[conic-gradient(from_90deg,#ff0000,#ff4500,#ff8c00,#ffa500,#ff0000)] p-[3px] rounded-full animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_35px_rgba(255,69,0,0.9),0_0_70px_rgba(255,140,0,0.7),inset_0_0_25px_rgba(255,165,0,0.5)]",
    avatar: ""
  },
  "Electric Storm": {
    wrapper: "bg-[conic-gradient(from_0deg,#00ffff,#ffffff,#0099ff,#ffffff,#00ffff)] p-[3px] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] shadow-[0_0_40px_rgba(0,255,255,1),0_0_80px_rgba(0,153,255,0.8)]",
    avatar: ""
  },
  "Crystal Aurora": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff00ff,#00ffff,#00ff00,#ffff00,#ff00ff)] p-[3px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_35px_rgba(255,0,255,0.8),0_0_70px_rgba(0,255,255,0.6)]",
    avatar: ""
  },
  "Molten Lava": {
    wrapper: "bg-[radial-gradient(circle,#ff4500,#dc143c,#8b0000)] p-[3px] rounded-full animate-[pulse_1.8s_ease-in-out_infinite] shadow-[0_0_40px_rgba(255,69,0,0.9),0_0_80px_rgba(220,20,60,0.7),inset_0_0_20px_rgba(139,0,0,0.6)]",
    avatar: ""
  },
  "Cosmic Nebula": {
    wrapper: "bg-[radial-gradient(circle_at_40%_40%,#ff1493,#9370db,#4169e1,#8a2be2)] p-[3px] rounded-full animate-[spin_12s_linear_infinite] shadow-[0_0_40px_rgba(255,20,147,0.8),0_0_80px_rgba(147,112,219,0.6)]",
    avatar: ""
  },
  // 500 Koin Tier
  "Divine Radiance": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffffff,#ffd700,#fffacd,#ffd700,#ffffff)] p-[4px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_50px_rgba(255,255,255,1),0_0_100px_rgba(255,215,0,0.9),inset_0_0_30px_rgba(255,250,205,0.7)]",
    avatar: ""
  },
  "Shadow Realm": {
    wrapper: "bg-[radial-gradient(circle,#4b0082,#2f004f,#000000)] p-[3px] rounded-full animate-[pulse_3.5s_ease-in-out_infinite] shadow-[0_0_45px_rgba(75,0,130,0.9),0_0_90px_rgba(47,0,79,0.7)]",
    avatar: ""
  },
  "Enchanted Forest": {
    wrapper: "bg-[conic-gradient(from_0deg,#00ff00,#32cd32,#9acd32,#ffd700,#00ff00)] p-[3px] rounded-full animate-[spin_8s_linear_infinite] shadow-[0_0_45px_rgba(0,255,0,0.8),0_0_90px_rgba(50,205,50,0.6),inset_0_0_25px_rgba(154,205,50,0.5)]",
    avatar: ""
  },
  "Celestial Throne": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffffff,#add8e6,#87ceeb,#add8e6,#ffffff)] p-[3px] rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_50px_rgba(255,255,255,0.9),0_0_100px_rgba(173,216,230,0.7),inset_0_0_30px_rgba(135,206,235,0.6)]",
    avatar: ""
  },
  "Blood Moon": {
    wrapper: "bg-[radial-gradient(circle,#dc143c,#8b0000,#4b0000)] p-[3px] rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_50px_rgba(220,20,60,0.9),0_0_100px_rgba(139,0,0,0.8)]",
    avatar: ""
  },
  // 1000 Koin Tier
  "Infinity Spiral": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff00ff,#00ffff,#ffff00,#00ff00,#ff00ff)] p-[4px] rounded-full animate-[spin_3s_linear_infinite] shadow-[0_0_60px_rgba(255,0,255,1),0_0_120px_rgba(0,255,255,0.9),inset_0_0_35px_rgba(255,255,0,0.7)]",
    avatar: ""
  },
  "Supernova Burst": {
    wrapper: "bg-[radial-gradient(circle,#ffffff,#ffd700,#ff8c00,#ff4500)] p-[5px] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] shadow-[0_0_70px_rgba(255,255,255,1),0_0_140px_rgba(255,215,0,1),0_0_200px_rgba(255,140,0,0.8)]",
    avatar: ""
  },
  "Time Warp": {
    wrapper: "bg-[conic-gradient(from_0deg,#9370db,#4169e1,#00ced1,#32cd32,#9370db)] p-[4px] rounded-full animate-[spin_2s_linear_infinite] shadow-[0_0_65px_rgba(147,112,219,0.9),0_0_130px_rgba(65,105,225,0.8),inset_0_0_40px_rgba(0,206,209,0.6)]",
    avatar: ""
  },
  "Eternal Flame": {
    wrapper: "bg-[conic-gradient(from_45deg,#ffd700,#ffffff,#ff8c00,#ffffff,#ffd700)] p-[4px] rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_60px_rgba(255,215,0,1),0_0_120px_rgba(255,255,255,0.9),inset_0_0_35px_rgba(255,140,0,0.7)]",
    avatar: ""
  },
  "Universe Core": {
    wrapper: "bg-[radial-gradient(circle,#ffffff,#00ffff,#ff00ff,#ffd700,#4169e1)] p-[5px] rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_70px_rgba(255,255,255,1),0_0_140px_rgba(0,255,255,0.9),0_0_200px_rgba(255,0,255,0.8),inset_0_0_40px_rgba(255,215,0,0.7)]",
    avatar: ""
  },
  // 1,000,000 Koin Tier - THE ULTIMATE GRAND PRIZE
  "Million Kliq Club": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#ffd700_0%,#ff00ff_7%,#00ffff_14%,#00ff00_21%,#ffd700_28%,#ff0000_35%,#ffffff_42%,#ff00ff_49%,#00ffff_56%,#ffd700_63%,#00ff00_70%,#ffffff_77%,#ff00ff_84%,#00ffff_91%,#ffd700_100%)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-[conic-gradient(from_180deg,#ff00ff_0%,#00ffff_20%,#ffd700_40%,#ff0000_60%,#00ff00_80%,#ff00ff_100%)] before:opacity-70 before:blur-sm before:animate-[spin_2s_linear_infinite_reverse] animate-[spin_3s_linear_infinite] shadow-[0_0_100px_rgba(255,215,0,1),0_0_150px_rgba(255,0,255,1),0_0_200px_rgba(0,255,255,1),0_0_250px_rgba(255,255,255,0.9),inset_0_0_60px_rgba(255,215,0,0.8),inset_0_0_80px_rgba(255,0,255,0.6)] after:content-[''] after:absolute after:inset-[-8px] after:rounded-full after:bg-[conic-gradient(from_90deg,transparent_0%,#ffd700_10%,transparent_20%,#ff00ff_30%,transparent_40%,#00ffff_50%,transparent_60%,#ffffff_70%,transparent_80%,#ffd700_90%,transparent_100%)] after:opacity-60 after:animate-[spin_4s_linear_infinite] after:pointer-events-none",
    avatar: ""
  },
  // Month-Specific Free Borders
  "Black History Month": {
    wrapper: "relative bg-gradient-to-br from-gray-900 via-black to-gray-800 p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Mental Health Awareness": {
    wrapper: "relative bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Pride Month": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#ff0000_0%,#ff7700_16%,#ffdd00_33%,#00ff00_50%,#0099ff_66%,#4400ff_83%,#ff0000_100%)] p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "4th of July": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#dc143c_0%,#ffffff_33%,#003478_66%,#dc143c_100%)] p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "National Suicide Prevention": {
    wrapper: "relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Autism Awareness": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#dc143c_0%,#ffd700_33%,#0066cc_66%,#dc143c_100%)] p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Hispanic Heritage": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#dc143c_0%,#ffffff_25%,#228b22_50%,#ffffff_75%,#dc143c_100%)] p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Breast Cancer Awareness": {
    wrapper: "relative bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  "Alzheimers Awareness": {
    wrapper: "relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-[4px] rounded-full before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,white_2%,transparent_4%,transparent_21%,white_23%,transparent_25%,transparent_42%,white_44%,transparent_46%,transparent_63%,white_65%,transparent_67%,transparent_84%,white_86%,transparent_88%,transparent_100%)] before:animate-[spin_12s_linear_infinite] before:opacity-80 before:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_15px_rgba(255,255,255,0.15)] after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-transparent after:via-white/10 after:to-transparent after:pointer-events-none",
    avatar: ""
  },
  // Engagement-Based Reward Borders
  "Interaction": {
    wrapper: "bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 p-[3px] rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_20px_rgba(0,191,255,0.6),0_0_40px_rgba(0,128,255,0.4),inset_0_0_15px_rgba(135,206,250,0.3)]",
    avatar: ""
  },
  "Social Butterfly": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff69b4,#ba55d3,#ff1493,#da70d6,#ff69b4)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_25px_rgba(255,105,180,0.7),0_0_50px_rgba(218,112,214,0.5),inset_0_0_20px_rgba(255,182,193,0.4)]",
    avatar: ""
  },
  "Kliq MVP": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#ffaa00,#ff8800,#ffc107,#ffd700)] p-[4px] rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_30px_rgba(255,215,0,0.9),0_0_60px_rgba(255,170,0,0.7),0_0_90px_rgba(255,193,7,0.5),inset_0_0_25px_rgba(255,235,59,0.5)]",
    avatar: ""
  },
  // Like-Based Engagement Reward Borders
  "Likeable": {
    wrapper: "bg-[radial-gradient(circle,#ffc0cb,#ffb3d9,#ff69b4)] p-[3px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(255,192,203,0.6),0_0_40px_rgba(255,179,217,0.4),inset_0_0_15px_rgba(255,105,180,0.3)]",
    avatar: ""
  },
  "Likefull": {
    wrapper: "bg-[conic-gradient(from_0deg,#dc143c,#ff1493,#c71585,#dc143c)] p-[3px] rounded-full animate-[spin_5s_linear_infinite] shadow-[0_0_25px_rgba(220,20,60,0.7),0_0_50px_rgba(255,20,147,0.5),inset_0_0_20px_rgba(199,21,133,0.4)]",
    avatar: ""
  },
  "Likey Likey": {
    wrapper: "bg-[conic-gradient(from_0deg,#8b008b,#ff00ff,#ff1493,#ff69b4,#8b008b)] p-[4px] rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_30px_rgba(139,0,139,0.9),0_0_60px_rgba(255,0,255,0.7),0_0_90px_rgba(255,20,147,0.5),inset_0_0_25px_rgba(255,105,180,0.5)]",
    avatar: ""
  },
  // Mood-Based Engagement Reward Borders
  "Emotionally Aware": {
    wrapper: "bg-[radial-gradient(circle,#40e0d0,#48d1cc,#20b2aa)] p-[3px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(64,224,208,0.6),0_0_40px_rgba(72,209,204,0.4),inset_0_0_15px_rgba(32,178,170,0.3)]",
    avatar: ""
  },
  "Mood Warrior": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff6b6b,#ffa500,#ffd700,#90ee90,#4169e1,#9370db,#ff6b6b)] p-[3px] rounded-full animate-[spin_5s_linear_infinite] shadow-[0_0_25px_rgba(255,107,107,0.7),0_0_50px_rgba(65,105,225,0.5),inset_0_0_20px_rgba(147,112,219,0.4)]",
    avatar: ""
  },
  "Zen Master": {
    wrapper: "bg-[conic-gradient(from_0deg,#e6e6fa,#dda0dd,#ba55d3,#9370db,#e6e6fa)] p-[4px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_30px_rgba(230,230,250,0.9),0_0_60px_rgba(186,85,211,0.7),0_0_90px_rgba(147,112,219,0.5),inset_0_0_25px_rgba(221,160,221,0.5)]",
    avatar: ""
  },
  // Horoscope-Based Engagement Reward Borders
  "Head in the Clouds": {
    wrapper: "bg-[radial-gradient(circle,#87ceeb,#b0e0e6,#add8e6)] p-[3px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(135,206,235,0.6),0_0_40px_rgba(176,224,230,0.4),inset_0_0_15px_rgba(173,216,230,0.3)]",
    avatar: ""
  },
  "Clarity": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#fff8dc,#fffacd,#ffd700)] p-[3px] rounded-full animate-[spin_5s_linear_infinite] shadow-[0_0_25px_rgba(255,215,0,0.7),0_0_50px_rgba(255,248,220,0.5),inset_0_0_20px_rgba(255,250,205,0.4)]",
    avatar: ""
  },
  "Stargazer": {
    wrapper: "bg-[conic-gradient(from_0deg,#000080,#191970,#4169e1,#1e90ff,#000080)] p-[4px] rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_30px_rgba(0,0,128,0.9),0_0_60px_rgba(25,25,112,0.7),0_0_90px_rgba(65,105,225,0.5),inset_0_0_25px_rgba(30,144,255,0.5)]",
    avatar: ""
  },
  // Bible Verse-Based Engagement Reward Borders 🙏✝️
  "Saved": {
    wrapper: "bg-[radial-gradient(circle,#f5deb3,#ffe4b5,#faebd7)] p-[3px] rounded-full animate-[pulse_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(245,222,179,0.6),0_0_40px_rgba(255,228,181,0.4),inset_0_0_15px_rgba(250,235,215,0.3)]",
    avatar: ""
  },
  "Faithful": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffffff,#f0f8ff,#e6f3ff,#ffffff)] p-[3px] rounded-full animate-[spin_5s_linear_infinite] shadow-[0_0_25px_rgba(255,255,255,0.8),0_0_50px_rgba(240,248,255,0.6),0_0_75px_rgba(230,243,255,0.4),inset_0_0_20px_rgba(255,255,255,0.5)]",
    avatar: ""
  },
  "Blessed": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700,#ffffff,#fffacd,#ffd700)] p-[4px] rounded-full animate-[spin_4s_linear_infinite] shadow-[0_0_35px_rgba(255,215,0,1),0_0_70px_rgba(255,255,255,0.8),0_0_105px_rgba(255,250,205,0.6),inset_0_0_30px_rgba(255,255,255,0.7)]",
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
    const { emoji, bg } = streakIcon;
    return (
      <div className={cn(
        "absolute -top-1 -left-1 rounded-full p-1 shadow-lg z-10 flex items-center justify-center",
        bg
      )}>
        <span className={cn(iconSize, "leading-none")}>{emoji}</span>
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
