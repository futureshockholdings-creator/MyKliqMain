import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/apiConfig";

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
  "Platinum": {
    emoji: "💿",
    bg: "bg-gradient-to-br from-gray-100 to-gray-300"
  },
  "Titanium": {
    emoji: "⚙️",
    bg: "bg-gradient-to-br from-gray-400 to-slate-600"
  },
  "Emerald": {
    emoji: "💚",
    bg: "bg-gradient-to-br from-green-400 to-emerald-600"
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
  "Electric Storm": {
    emoji: "⚡",
    bg: "bg-gradient-to-br from-blue-300 to-purple-500"
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
  "Lucky": {
    emoji: "🍀",
    bg: "bg-gradient-to-br from-green-400 to-emerald-600"
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
  // TIER 1: LUMINOUS (2,500 Koins)
  "Luminous Dawn": {
    emoji: "🌅",
    bg: "bg-gradient-to-br from-amber-300 via-rose-300 to-pink-300"
  },
  "Cyber Citrus": {
    emoji: "🍋",
    bg: "bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400"
  },
  "Ocean Gleam": {
    emoji: "🌊",
    bg: "bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-400"
  },
  "Aurora Bloom": {
    emoji: "🌸",
    bg: "bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300"
  },
  "Solar Drift": {
    emoji: "☀️",
    bg: "bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300"
  },
  // TIER 2: FLUX (5,000 Koins)
  "Prismatic Echo": {
    emoji: "🎨",
    bg: "bg-gradient-to-br from-purple-300 to-fuchsia-400"
  },
  "Frostbyte Flux": {
    emoji: "❄️",
    bg: "bg-gradient-to-br from-cyan-300 to-sky-400"
  },
  "Velvet Ember": {
    emoji: "🔥",
    bg: "bg-gradient-to-br from-red-300 to-orange-400"
  },
  "Lotus Mirage": {
    emoji: "🪷",
    bg: "bg-gradient-to-br from-pink-300 to-purple-300"
  },
  "Prism Haze": {
    emoji: "🌈",
    bg: "bg-gradient-to-br from-emerald-300 to-yellow-200"
  },
  // TIER 3: PRISM (10,000 Koins)
  "Celestial Loop": {
    emoji: "🌙",
    bg: "bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400"
  },
  "Iridescent Rift": {
    emoji: "✨",
    bg: "bg-gradient-to-br from-sky-400 to-purple-500"
  },
  "Velour Cascade": {
    emoji: "💫",
    bg: "bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-500"
  },
  "Gilded Horizon": {
    emoji: "🌄",
    bg: "bg-gradient-to-br from-amber-400 to-orange-500"
  },
  "Sapphire Pulse": {
    emoji: "💙",
    bg: "bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400"
  },
  // TIER 4: PULSE (25,000 Koins)
  "Quantum Bloom": {
    emoji: "⚛️",
    bg: "bg-gradient-to-br from-purple-500 to-pink-500"
  },
  "Inferno Ribbon": {
    emoji: "🌋",
    bg: "bg-gradient-to-br from-red-600 to-orange-500"
  },
  "Glacial Helix": {
    emoji: "🧊",
    bg: "bg-gradient-to-br from-cyan-400 to-blue-300"
  },
  "Shadow Prism": {
    emoji: "🌑",
    bg: "bg-gradient-to-br from-indigo-900 to-purple-600"
  },
  "Electrum Tide": {
    emoji: "⚡",
    bg: "bg-gradient-to-br from-teal-500 to-green-400"
  },
  // TIER 5: NOVA (50,000 Koins)
  "Nebula Veil": {
    emoji: "🌌",
    bg: "bg-gradient-to-br from-purple-600 to-blue-500"
  },
  "Auric Cyclone": {
    emoji: "🌪️",
    bg: "bg-gradient-to-br from-yellow-500 to-red-600"
  },
  "Starforge Spiral": {
    emoji: "⭐",
    bg: "bg-gradient-to-br from-indigo-100 to-blue-300"
  },
  "Rose Quasar": {
    emoji: "🌹",
    bg: "bg-gradient-to-br from-pink-400 to-rose-600"
  },
  "Eclipse Bloom": {
    emoji: "🌑✨",
    bg: "bg-gradient-to-br from-gray-900 to-purple-700"
  },
  // TIER 6: QUANTUM (100,000 Koins)
  "Photon Odyssey": {
    emoji: "💡",
    bg: "bg-gradient-to-br from-yellow-100 to-amber-400"
  },
  "Stormsong Halo": {
    emoji: "⛈️",
    bg: "bg-gradient-to-br from-cyan-500 to-emerald-500"
  },
  "Opaline Vortex": {
    emoji: "🔮",
    bg: "bg-gradient-to-br from-purple-200 to-violet-400"
  },
  "Crystalline Crown": {
    emoji: "👑",
    bg: "bg-gradient-to-br from-white to-cyan-300"
  },
  "Radiant Singularity": {
    emoji: "☀️✨",
    bg: "bg-gradient-to-br from-yellow-200 to-amber-500"
  },
  // TIER 7: ECLIPSE (250,000 Koins)
  "Eventide Regalia": {
    emoji: "🌆",
    bg: "bg-gradient-to-br from-indigo-900 to-purple-500"
  },
  "Astral Dominion": {
    emoji: "🌟",
    bg: "bg-gradient-to-br from-yellow-200 to-amber-600"
  },
  "Mythos Aegis": {
    emoji: "🛡️",
    bg: "bg-gradient-to-br from-red-700 to-orange-500"
  },
  "Mirage Sovereign": {
    emoji: "🔱",
    bg: "bg-gradient-to-br from-cyan-500 to-indigo-600"
  },
  "Empyrean Resonance": {
    emoji: "🎵",
    bg: "bg-gradient-to-br from-purple-300 to-fuchsia-500"
  },
  // TIER 8: MYTHIC (500,000 Koins)
  "Genesis Continuum": {
    emoji: "🌠",
    bg: "bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500"
  },
  "Chrono Paragon": {
    emoji: "⏳",
    bg: "bg-gradient-to-br from-indigo-200 to-blue-500"
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
  "Platinum": {
    wrapper: "bg-[conic-gradient(from_0deg,#e5e4e2_0%,#ffffff_12%,#f0f0f0_25%,#ffffff_37%,#dcdcdc_50%,#ffffff_62%,#e8e8e8_75%,#ffffff_87%,#e5e4e2_100%)] p-[3px] rounded-full animate-[spin_8s_linear_infinite] shadow-[0_0_30px_rgba(229,228,226,0.8),0_0_60px_rgba(255,255,255,0.7),inset_0_0_25px_rgba(240,240,240,0.6)]",
    avatar: ""
  },
  "Titanium": {
    wrapper: "bg-[conic-gradient(from_0deg,#878681_0%,#a9a9a9_10%,#c0c0c0_20%,#696969_30%,#808080_40%,#d3d3d3_50%,#778899_60%,#a9a9a9_70%,#708090_80%,#c0c0c0_90%,#878681_100%)] p-[3px] rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_35px_rgba(135,134,129,0.9),0_0_70px_rgba(169,169,169,0.7),inset_0_0_30px_rgba(192,192,192,0.5)]",
    avatar: ""
  },
  "Emerald": {
    wrapper: "bg-[conic-gradient(from_0deg,#50C878_0%,#00ff88_12%,#3cb371_25%,#00dd77_37%,#2e8b57_50%,#00cc66_62%,#00ff7f_75%,#00ff88_87%,#50C878_100%)] p-[4px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_40px_rgba(80,200,120,0.9),0_0_80px_rgba(0,255,136,0.7),inset_0_0_35px_rgba(60,179,113,0.6)]",
    avatar: ""
  },
  "Legend Crown": {
    wrapper: "bg-[conic-gradient(from_0deg,#ffd700_0%,#ff6b00_8%,#ffed4e_16%,#ff8800_24%,#ffd700_32%,#ff6b00_40%,#ffaa00_48%,#ff8800_56%,#ffd700_64%,#ff6b00_72%,#ffed4e_80%,#ff8800_88%,#ffd700_100%)] p-1 rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_30px_rgba(255,215,0,0.8),0_0_60px_rgba(255,107,0,0.6),inset_0_0_20px_rgba(255,237,78,0.5)]",
    avatar: ""
  },
  // 50 Koin Tier
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
  // 250 Koin Tier
  "Electric Storm": {
    wrapper: "bg-[conic-gradient(from_0deg,#00ffff,#ffffff,#0099ff,#ffffff,#00ffff)] p-[3px] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] shadow-[0_0_40px_rgba(0,255,255,1),0_0_80px_rgba(0,153,255,0.8)]",
    avatar: ""
  },
  "Crystal Aurora": {
    wrapper: "bg-[conic-gradient(from_0deg,#ff00ff,#00ffff,#00ff00,#ffff00,#ff00ff)] p-[3px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_35px_rgba(255,0,255,0.8),0_0_70px_rgba(0,255,255,0.6)]",
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
  "Lucky": {
    wrapper: "bg-[conic-gradient(from_0deg,#00ff00,#32cd32,#9acd32,#ffd700,#00ff00)] p-[3px] rounded-full animate-[spin_8s_linear_infinite] shadow-[0_0_45px_rgba(0,255,0,0.8),0_0_90px_rgba(50,205,50,0.6),inset_0_0_25px_rgba(154,205,50,0.5)]",
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
    wrapper: "bg-[conic-gradient(from_45deg,#ff4500,#ff6347,#ff8c00,#ff6347,#ff4500)] p-[4px] rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_60px_rgba(255,69,0,1),0_0_120px_rgba(255,99,71,0.9),inset_0_0_35px_rgba(255,140,0,0.7)]",
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
  // TIER 1: LUMINOUS (2,500 Koins) - Refined gradients with soft glows
  "Luminous Dawn": {
    wrapper: "bg-gradient-to-br from-amber-300 via-rose-300 to-pink-300 p-[2px] rounded-full shadow-[0_0_12px_rgba(251,191,36,0.5),inset_0_0_8px_rgba(255,255,255,0.2)]",
    avatar: ""
  },
  "Cyber Citrus": {
    wrapper: "bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 p-[2px] rounded-full shadow-[0_0_12px_rgba(74,222,128,0.5),inset_0_0_8px_rgba(255,255,255,0.2)]",
    avatar: ""
  },
  "Ocean Gleam": {
    wrapper: "bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-400 p-[2px] rounded-full shadow-[0_0_12px_rgba(96,165,250,0.5),inset_0_0_8px_rgba(255,255,255,0.2)]",
    avatar: ""
  },
  "Aurora Bloom": {
    wrapper: "bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 p-[2px] rounded-full shadow-[0_0_12px_rgba(216,180,254,0.5),inset_0_0_8px_rgba(255,255,255,0.2)]",
    avatar: ""
  },
  "Solar Drift": {
    wrapper: "bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300 p-[2px] rounded-full shadow-[0_0_12px_rgba(253,224,71,0.5),inset_0_0_8px_rgba(255,255,255,0.2)]",
    avatar: ""
  },
  // TIER 2: FLUX (5,000 Koins) - Subtle shimmer with rotating highlights
  "Prismatic Echo": {
    wrapper: "bg-[conic-gradient(from_0deg,#a78bfa,#c084fc,#e879f9,#f0abfc,#a78bfa)] p-[2px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(167,139,250,0.6),inset_0_0_10px_rgba(255,255,255,0.25)]",
    avatar: ""
  },
  "Frostbyte Flux": {
    wrapper: "bg-[conic-gradient(from_45deg,#67e8f9,#a5f3fc,#e0f2fe,#a5f3fc,#67e8f9)] p-[2px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(103,232,249,0.6),inset_0_0_10px_rgba(255,255,255,0.25)]",
    avatar: ""
  },
  "Velvet Ember": {
    wrapper: "bg-[conic-gradient(from_90deg,#f87171,#fb923c,#fbbf24,#fb923c,#f87171)] p-[2px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(248,113,113,0.6),inset_0_0_10px_rgba(255,255,255,0.25)]",
    avatar: ""
  },
  "Lotus Mirage": {
    wrapper: "bg-[conic-gradient(from_0deg,#fda4af,#fbcfe8,#e9d5ff,#fbcfe8,#fda4af)] p-[2px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(253,164,175,0.6),inset_0_0_10px_rgba(255,255,255,0.25)]",
    avatar: ""
  },
  "Prism Haze": {
    wrapper: "bg-[conic-gradient(from_135deg,#6ee7b7,#a7f3d0,#fef3c7,#a7f3d0,#6ee7b7)] p-[2px] rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(110,231,183,0.6),inset_0_0_10px_rgba(255,255,255,0.25)]",
    avatar: ""
  },
  // TIER 3: PRISM (10,000 Koins) - Dual gradients with thin inner rings
  "Celestial Loop": {
    wrapper: "relative bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 p-[3px] rounded-full before:content-[''] before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/30 shadow-[0_0_18px_rgba(167,139,250,0.7),inset_0_0_12px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  "Iridescent Rift": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#0ea5e9,#8b5cf6,#ec4899,#f59e0b,#0ea5e9)] p-[3px] rounded-full animate-[spin_8s_linear_infinite] before:content-[''] before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/30 shadow-[0_0_18px_rgba(14,165,233,0.7),inset_0_0_12px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  "Velour Cascade": {
    wrapper: "relative bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-500 p-[3px] rounded-full before:content-[''] before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/30 shadow-[0_0_18px_rgba(244,114,182,0.7),inset_0_0_12px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  "Gilded Horizon": {
    wrapper: "relative bg-[conic-gradient(from_45deg,#fbbf24,#f59e0b,#ea580c,#f59e0b,#fbbf24)] p-[3px] rounded-full animate-[spin_8s_linear_infinite] before:content-[''] before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/30 shadow-[0_0_18px_rgba(251,191,36,0.7),inset_0_0_12px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  "Sapphire Pulse": {
    wrapper: "relative bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 p-[3px] rounded-full animate-[pulse_4s_ease-in-out_infinite] before:content-[''] before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/30 shadow-[0_0_18px_rgba(59,130,246,0.7),inset_0_0_12px_rgba(255,255,255,0.3)]",
    avatar: ""
  },
  // TIER 4: PULSE (25,000 Koins) - Directional lighting with slow rotation
  "Quantum Bloom": {
    wrapper: "bg-[conic-gradient(from_0deg,#a855f7_0%,#ec4899_25%,#f97316_50%,#ec4899_75%,#a855f7_100%)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_22px_rgba(168,85,247,0.8),0_0_44px_rgba(236,72,153,0.6),inset_0_0_16px_rgba(249,115,22,0.4)]",
    avatar: ""
  },
  "Inferno Ribbon": {
    wrapper: "bg-[conic-gradient(from_90deg,#dc2626,#f97316,#fbbf24,#f97316,#dc2626)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_22px_rgba(220,38,38,0.8),0_0_44px_rgba(249,115,22,0.6),inset_0_0_16px_rgba(251,191,36,0.4)]",
    avatar: ""
  },
  "Glacial Helix": {
    wrapper: "bg-[conic-gradient(from_180deg,#06b6d4,#67e8f9,#e0f2fe,#67e8f9,#06b6d4)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_22px_rgba(6,182,212,0.8),0_0_44px_rgba(103,232,249,0.6),inset_0_0_16px_rgba(224,242,254,0.4)]",
    avatar: ""
  },
  "Shadow Prism": {
    wrapper: "bg-[conic-gradient(from_270deg,#1e1b4b,#4c1d95,#7c3aed,#4c1d95,#1e1b4b)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_22px_rgba(124,58,237,0.8),0_0_44px_rgba(76,29,149,0.6),inset_0_0_16px_rgba(30,27,75,0.4)]",
    avatar: ""
  },
  "Electrum Tide": {
    wrapper: "bg-[conic-gradient(from_45deg,#14b8a6,#10b981,#84cc16,#10b981,#14b8a6)] p-[3px] rounded-full animate-[spin_6s_linear_infinite] shadow-[0_0_22px_rgba(20,184,166,0.8),0_0_44px_rgba(16,185,129,0.6),inset_0_0_16px_rgba(132,204,22,0.4)]",
    avatar: ""
  },
  // TIER 5: NOVA (50,000 Koins) - Animated particle streaks
  "Nebula Veil": {
    wrapper: "relative bg-[radial-gradient(circle_at_30%_40%,#9333ea,#6366f1,#3b82f6,#0ea5e9)] p-[4px] rounded-full animate-[spin_10s_linear_infinite] before:content-[''] before:absolute before:inset-[-4px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,#8b5cf6_10%,transparent_20%,transparent_80%,#8b5cf6_90%,transparent_100%)] before:animate-[spin_3s_linear_infinite] before:opacity-60 shadow-[0_0_30px_rgba(147,51,234,0.8),0_0_60px_rgba(99,102,241,0.6),inset_0_0_20px_rgba(59,130,246,0.4)]",
    avatar: ""
  },
  "Auric Cyclone": {
    wrapper: "relative bg-[radial-gradient(circle,#fbbf24,#f59e0b,#ea580c,#dc2626)] p-[4px] rounded-full animate-[spin_8s_linear_infinite] before:content-[''] before:absolute before:inset-[-4px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_15%,transparent_30%,transparent_70%,#fbbf24_85%,transparent_100%)] before:animate-[spin_2.5s_linear_infinite_reverse] before:opacity-60 shadow-[0_0_30px_rgba(251,191,36,0.9),0_0_60px_rgba(245,158,11,0.7),inset_0_0_20px_rgba(234,88,12,0.5)]",
    avatar: ""
  },
  "Starforge Spiral": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#ffffff,#e0e7ff,#c7d2fe,#a5b4fc,#ffffff)] p-[4px] rounded-full animate-[pulse_3s_ease-in-out_infinite] before:content-[''] before:absolute before:inset-[-4px] before:rounded-full before:bg-[conic-gradient(from_90deg,transparent_0%,#ffffff_12%,transparent_24%,transparent_76%,#ffffff_88%,transparent_100%)] before:animate-[spin_3.5s_linear_infinite] before:opacity-70 shadow-[0_0_35px_rgba(255,255,255,0.9),0_0_70px_rgba(224,231,255,0.7),inset_0_0_25px_rgba(199,210,254,0.5)]",
    avatar: ""
  },
  "Rose Quasar": {
    wrapper: "relative bg-[radial-gradient(circle_at_50%_50%,#fda4af,#f472b6,#ec4899,#db2777)] p-[4px] rounded-full animate-[pulse_3.5s_ease-in-out_infinite] before:content-[''] before:absolute before:inset-[-4px] before:rounded-full before:bg-[conic-gradient(from_45deg,transparent_0%,#fda4af_18%,transparent_36%,transparent_64%,#fda4af_82%,transparent_100%)] before:animate-[spin_4s_linear_infinite] before:opacity-65 shadow-[0_0_32px_rgba(253,164,175,0.8),0_0_64px_rgba(244,114,182,0.6),inset_0_0_22px_rgba(236,72,153,0.4)]",
    avatar: ""
  },
  "Eclipse Bloom": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#0f172a,#581c87,#7c2d12,#581c87,#0f172a)] p-[4px] rounded-full animate-[spin_7s_linear_infinite] before:content-[''] before:absolute before:inset-[-4px] before:rounded-full before:bg-[conic-gradient(from_180deg,transparent_0%,#a855f7_20%,transparent_40%,transparent_60%,#a855f7_80%,transparent_100%)] before:animate-[spin_3s_linear_infinite_reverse] before:opacity-70 shadow-[0_0_30px_rgba(88,28,135,0.9),0_0_60px_rgba(124,45,18,0.7),inset_0_0_20px_rgba(168,85,247,0.4)]",
    avatar: ""
  },
  // TIER 6: QUANTUM (100,000 Koins) - Multi-layer orbiting glows
  "Photon Odyssey": {
    wrapper: "relative bg-[radial-gradient(circle,#ffffff,#fef3c7,#fde047,#facc15)] p-[5px] rounded-full before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_8%,transparent_16%,transparent_41%,#fbbf24_49%,transparent_57%,transparent_82%,#fbbf24_90%,transparent_98%)] before:animate-[spin_4s_linear_infinite] before:opacity-75 after:content-[''] after:absolute after:inset-[-3px] after:rounded-full after:bg-[conic-gradient(from_180deg,transparent_0%,#ffffff_12%,transparent_24%,transparent_76%,#ffffff_88%,transparent_100%)] after:animate-[spin_2s_linear_infinite_reverse] after:opacity-60 shadow-[0_0_40px_rgba(255,255,255,1),0_0_80px_rgba(254,243,199,0.9),inset_0_0_30px_rgba(253,224,71,0.6)]",
    avatar: ""
  },
  "Stormsong Halo": {
    wrapper: "relative bg-[radial-gradient(circle,#0ea5e9,#06b6d4,#14b8a6,#10b981)] p-[5px] rounded-full before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:bg-[conic-gradient(from_90deg,transparent_0%,#0ea5e9_10%,transparent_20%,transparent_45%,#06b6d4_55%,transparent_65%,transparent_90%,#0ea5e9_100%)] before:animate-[spin_3.5s_linear_infinite] before:opacity-80 after:content-[''] after:absolute after:inset-[-3px] after:rounded-full after:bg-[conic-gradient(from_270deg,transparent_0%,#14b8a6_15%,transparent_30%,transparent_70%,#14b8a6_85%,transparent_100%)] after:animate-[spin_2.2s_linear_infinite_reverse] after:opacity-65 shadow-[0_0_45px_rgba(14,165,233,0.95),0_0_90px_rgba(6,182,212,0.8),inset_0_0_35px_rgba(16,185,129,0.6)]",
    avatar: ""
  },
  "Opaline Vortex": {
    wrapper: "relative bg-[conic-gradient(from_0deg,#fae8ff,#f3e8ff,#e9d5ff,#d8b4fe,#fae8ff)] p-[5px] rounded-full animate-[spin_12s_linear_infinite] before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:bg-[conic-gradient(from_45deg,transparent_0%,#c084fc_12%,transparent_24%,transparent_36%,#c084fc_48%,transparent_60%,transparent_72%,#c084fc_84%,transparent_96%)] before:animate-[spin_4s_linear_infinite_reverse] before:opacity-70 after:content-[''] after:absolute after:inset-[-3px] after:rounded-full after:bg-[conic-gradient(from_135deg,transparent_0%,#fae8ff_18%,transparent_36%,transparent_64%,#fae8ff_82%,transparent_100%)] after:animate-[spin_2.8s_linear_infinite] after:opacity-55 shadow-[0_0_42px_rgba(250,232,255,0.9),0_0_84px_rgba(216,180,254,0.7),inset_0_0_32px_rgba(243,232,255,0.5)]",
    avatar: ""
  },
  "Crystalline Crown": {
    wrapper: "relative bg-[radial-gradient(circle,#ffffff,#e0f2fe,#bae6fd,#7dd3fc)] p-[5px] rounded-full animate-[pulse_4s_ease-in-out_infinite] before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,#ffffff_6%,transparent_12%,transparent_25%,#bae6fd_31%,transparent_37%,transparent_50%,#ffffff_56%,transparent_62%,transparent_75%,#bae6fd_81%,transparent_87%,transparent_100%)] before:animate-[spin_3.8s_linear_infinite] before:opacity-85 after:content-[''] after:absolute after:inset-[-3px] after:rounded-full after:bg-[conic-gradient(from_180deg,transparent_0%,#7dd3fc_20%,transparent_40%,transparent_60%,#7dd3fc_80%,transparent_100%)] after:animate-[spin_2.5s_linear_infinite_reverse] after:opacity-60 shadow-[0_0_50px_rgba(255,255,255,1),0_0_100px_rgba(186,230,253,0.9),inset_0_0_40px_rgba(125,211,252,0.7)]",
    avatar: ""
  },
  "Radiant Singularity": {
    wrapper: "relative bg-[radial-gradient(circle,#fef3c7,#fde047,#facc15,#eab308)] p-[5px] rounded-full animate-[pulse_2.8s_ease-in-out_infinite] before:content-[''] before:absolute before:inset-[-6px] before:rounded-full before:bg-[conic-gradient(from_0deg,#fbbf24_0%,transparent_5%,transparent_20%,#fde047_25%,transparent_30%,transparent_45%,#fbbf24_50%,transparent_55%,transparent_70%,#fde047_75%,transparent_80%,transparent_95%,#fbbf24_100%)] before:animate-[spin_3.2s_linear_infinite] before:opacity-80 after:content-[''] after:absolute after:inset-[-3px] after:rounded-full after:bg-[conic-gradient(from_90deg,transparent_0%,#fef3c7_22%,transparent_44%,transparent_56%,#fef3c7_78%,transparent_100%)] after:animate-[spin_2s_linear_infinite_reverse] after:opacity-70 shadow-[0_0_55px_rgba(254,243,199,1),0_0_110px_rgba(253,224,71,0.95),0_0_165px_rgba(251,191,36,0.8),inset_0_0_45px_rgba(234,179,8,0.7)]",
    avatar: ""
  },
  // TIER 7: ECLIPSE (250,000 Koins) - Parallax aurora/nebula with opacity cycling
  "Eventide Regalia": {
    wrapper: "relative bg-[radial-gradient(circle_at_35%_35%,#1e1b4b,#4c1d95,#7c3aed,#a855f7)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:bg-[conic-gradient(from_0deg,transparent_0%,#8b5cf6_5%,transparent_10%,transparent_23%,#a855f7_28%,transparent_33%,transparent_46%,#8b5cf6_51%,transparent_56%,transparent_69%,#a855f7_74%,transparent_79%,transparent_92%,#8b5cf6_97%,transparent_100%)] before:animate-[spin_5s_linear_infinite] before:opacity-90 after:content-[''] after:absolute after:inset-[-4px] after:rounded-full after:bg-[radial-gradient(circle,transparent_30%,#7c3aed_50%,transparent_70%)] after:animate-[pulse_3.5s_ease-in-out_infinite] after:opacity-50 shadow-[0_0_60px_rgba(124,58,237,1),0_0_120px_rgba(168,85,247,0.9),0_0_180px_rgba(139,92,246,0.7),inset_0_0_50px_rgba(76,29,149,0.6)]",
    avatar: ""
  },
  "Astral Dominion": {
    wrapper: "relative bg-[radial-gradient(circle_at_40%_40%,#fef3c7,#fde047,#eab308,#ca8a04)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:bg-[conic-gradient(from_45deg,#fbbf24_0%,transparent_8%,transparent_17%,#fde047_25%,transparent_33%,transparent_42%,#fbbf24_50%,transparent_58%,transparent_67%,#fde047_75%,transparent_83%,transparent_92%,#fbbf24_100%)] before:animate-[spin_4.5s_linear_infinite] before:opacity-85 after:content-[''] after:absolute after:inset-[-4px] after:rounded-full after:bg-[radial-gradient(circle,transparent_35%,#fef3c7_55%,transparent_75%)] after:animate-[pulse_3s_ease-in-out_infinite] after:opacity-60 shadow-[0_0_70px_rgba(254,243,199,1),0_0_140px_rgba(253,224,71,1),0_0_210px_rgba(251,191,36,0.9),inset_0_0_60px_rgba(234,179,8,0.7)]",
    avatar: ""
  },
  "Mythos Aegis": {
    wrapper: "relative bg-[radial-gradient(circle_at_30%_45%,#dc2626,#ea580c,#f97316,#fb923c)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:bg-[conic-gradient(from_90deg,transparent_0%,#dc2626_7%,transparent_14%,transparent_28%,#f97316_35%,transparent_42%,transparent_56%,#dc2626_63%,transparent_70%,transparent_84%,#f97316_91%,transparent_98%)] before:animate-[spin_4s_linear_infinite] before:opacity-88 after:content-[''] after:absolute after:inset-[-4px] after:rounded-full after:bg-[radial-gradient(circle,transparent_32%,#ea580c_52%,transparent_72%)] after:animate-[pulse_3.2s_ease-in-out_infinite] after:opacity-55 shadow-[0_0_65px_rgba(220,38,38,1),0_0_130px_rgba(249,115,22,0.95),0_0_195px_rgba(234,88,12,0.8),inset_0_0_55px_rgba(251,146,60,0.65)]",
    avatar: ""
  },
  "Mirage Sovereign": {
    wrapper: "relative bg-[radial-gradient(circle_at_38%_38%,#06b6d4,#0ea5e9,#3b82f6,#6366f1)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:bg-[conic-gradient(from_135deg,transparent_0%,#0ea5e9_6%,transparent_12%,transparent_25%,#3b82f6_31%,transparent_37%,transparent_50%,#0ea5e9_56%,transparent_62%,transparent_75%,#3b82f6_81%,transparent_87%,transparent_100%)] before:animate-[spin_4.8s_linear_infinite] before:opacity-92 after:content-[''] after:absolute after:inset-[-4px] after:rounded-full after:bg-[radial-gradient(circle,transparent_33%,#06b6d4_53%,transparent_73%)] after:animate-[pulse_3.4s_ease-in-out_infinite] after:opacity-58 shadow-[0_0_68px_rgba(6,182,212,1),0_0_136px_rgba(14,165,233,0.96),0_0_204px_rgba(59,130,246,0.85),inset_0_0_58px_rgba(99,102,241,0.68)]",
    avatar: ""
  },
  "Empyrean Resonance": {
    wrapper: "relative bg-[radial-gradient(circle_at_42%_42%,#fae8ff,#f3e8ff,#e9d5ff,#d8b4fe,#c084fc)] p-[6px] rounded-full before:content-[''] before:absolute before:inset-[-8px] before:rounded-full before:bg-[conic-gradient(from_180deg,#c084fc_0%,transparent_9%,transparent_18%,#d8b4fe_27%,transparent_36%,transparent_45%,#c084fc_54%,transparent_63%,transparent_72%,#d8b4fe_81%,transparent_90%,transparent_99%,#c084fc_100%)] before:animate-[spin_5.2s_linear_infinite] before:opacity-87 after:content-[''] after:absolute after:inset-[-4px] after:rounded-full after:bg-[radial-gradient(circle,transparent_31%,#f3e8ff_51%,transparent_71%)] after:animate-[pulse_3.6s_ease-in-out_infinite] after:opacity-62 shadow-[0_0_72px_rgba(250,232,255,1),0_0_144px_rgba(233,213,255,0.98),0_0_216px_rgba(216,180,254,0.88),inset_0_0_62px_rgba(192,132,252,0.7)]",
    avatar: ""
  },
  // TIER 8: MYTHIC (500,000 Koins) - Triple-layer halos with refracted color cycling and spark trails
  "Genesis Continuum": {
    wrapper: "relative bg-[radial-gradient(circle_at_50%_50%,#ffffff,#fef3c7,#fde047,#fbbf24,#f59e0b)] p-[7px] rounded-full before:content-[''] before:absolute before:inset-[-10px] before:rounded-full before:bg-[conic-gradient(from_0deg,#fbbf24_0%,#fde047_4%,transparent_8%,transparent_15%,#ffffff_19%,transparent_23%,transparent_30%,#fbbf24_34%,transparent_38%,transparent_45%,#fde047_49%,transparent_53%,transparent_60%,#ffffff_64%,transparent_68%,transparent_75%,#fbbf24_79%,transparent_83%,transparent_90%,#fde047_94%,transparent_98%,#fbbf24_100%)] before:animate-[spin_3.5s_linear_infinite] before:opacity-95 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:bg-[conic-gradient(from_180deg,transparent_0%,#fef3c7_12%,transparent_24%,transparent_40%,#fbbf24_52%,transparent_64%,transparent_76%,#fef3c7_88%,transparent_100%)] after:animate-[spin_2s_linear_infinite_reverse] after:opacity-80 shadow-[0_0_90px_rgba(255,255,255,1),0_0_160px_rgba(254,243,199,1),0_0_230px_rgba(253,224,71,1),0_0_300px_rgba(251,191,36,0.9),inset_0_0_70px_rgba(245,158,11,0.8)]",
    avatar: "before:content-[''] before:absolute before:inset-[-15px] before:rounded-full before:bg-[conic-gradient(from_90deg,transparent_0%,#ffffff_2%,transparent_4%,transparent_21%,#fde047_23%,transparent_25%,transparent_42%,#ffffff_44%,transparent_46%,transparent_63%,#fde047_65%,transparent_67%,transparent_84%,#ffffff_86%,transparent_88%,transparent_100%)] before:animate-[spin_5s_linear_infinite] before:opacity-70 before:pointer-events-none"
  },
  "Chrono Paragon": {
    wrapper: "relative bg-[radial-gradient(circle_at_50%_50%,#e0e7ff,#c7d2fe,#a5b4fc,#818cf8,#6366f1)] p-[7px] rounded-full before:content-[''] before:absolute before:inset-[-10px] before:rounded-full before:bg-[conic-gradient(from_45deg,#6366f1_0%,#a5b4fc_5%,transparent_10%,transparent_18%,#e0e7ff_23%,transparent_28%,transparent_36%,#6366f1_41%,transparent_46%,transparent_54%,#a5b4fc_59%,transparent_64%,transparent_72%,#e0e7ff_77%,transparent_82%,transparent_90%,#6366f1_95%,transparent_100%)] before:animate-[spin_3.8s_linear_infinite] before:opacity-93 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:bg-[conic-gradient(from_225deg,transparent_0%,#c7d2fe_14%,transparent_28%,transparent_44%,#818cf8_58%,transparent_72%,transparent_86%,#c7d2fe_100%)] after:animate-[spin_2.2s_linear_infinite_reverse] after:opacity-78 shadow-[0_0_95px_rgba(224,231,255,1),0_0_170px_rgba(199,210,254,1),0_0_245px_rgba(165,180,252,1),0_0_320px_rgba(129,140,248,0.95),inset_0_0_75px_rgba(99,102,241,0.85)]",
    avatar: "before:content-[''] before:absolute before:inset-[-15px] before:rounded-full before:bg-[conic-gradient(from_270deg,transparent_0%,#e0e7ff_3%,transparent_6%,transparent_24%,#a5b4fc_27%,transparent_30%,transparent_48%,#e0e7ff_51%,transparent_54%,transparent_72%,#a5b4fc_75%,transparent_78%,transparent_96%,#e0e7ff_99%,transparent_100%)] before:animate-[spin_5.5s_linear_infinite] before:opacity-68 before:pointer-events-none"
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
  
  // Transform URLs for production (AWS Amplify needs full backend URL for assets)
  const resolvedSrc = resolveAssetUrl(src);
  const resolvedBorderImageUrl = resolveAssetUrl(borderImageUrl);

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
            <AvatarImage src={resolvedSrc} alt={alt} className="object-cover" />
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
          <AvatarImage src={resolvedSrc} alt={alt} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <img 
          src={resolvedBorderImageUrl} 
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
        <AvatarImage src={resolvedSrc} alt={alt} className="object-cover" />
        <AvatarFallback className="bg-muted text-foreground">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {renderStreakBadge()}
    </div>
  );
}
