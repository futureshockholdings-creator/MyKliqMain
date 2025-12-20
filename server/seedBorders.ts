import { db } from "./db";
import { profileBorders } from "@shared/schema";
import { sql } from "drizzle-orm";

const borders = [
  // Streak Rewards
  { id: "57f33311-a66d-4ffe-a6e7-f5cbb617a8a0", name: "Bronze Medal", type: "streak_reward" as const, cost: 0, tier: 3, imageUrl: "/attached_assets/generated_images/Bronze_medal_transparent_ring_2bf14e5c.png", description: "Unlock at 3-day streak" },
  { id: "5dd1b76e-e083-4301-9fac-3829efadb32e", name: "Silver Medal", type: "streak_reward" as const, cost: 0, tier: 7, imageUrl: "/attached_assets/generated_images/Silver_medal_transparent_ring_0b30e64f.png", description: "Unlock at 7-day streak" },
  { id: "8e814906-cb8d-4876-92a8-f7751b3dee1b", name: "Gold Medal", type: "streak_reward" as const, cost: 0, tier: 30, imageUrl: "/attached_assets/generated_images/Gold_medal_transparent_ring_041f2cb8.png", description: "Unlock at 30-day streak" },
  { id: "325bb797-17f0-49be-bbbc-ccee874a5b34", name: "Diamond", type: "streak_reward" as const, cost: 0, tier: 90, imageUrl: "/attached_assets/generated_images/Diamond_transparent_ring_a375fa96.png", description: "Unlock at 90-day streak" },
  { id: "55bbcf30-5ade-4332-b52b-105ab7343eba", name: "Platinum", type: "streak_reward" as const, cost: 0, tier: 180, imageUrl: "/attached_assets/generated_images/Platinum_transparent_ring.png", description: "Awarded for 180 consecutive days" },
  { id: "5f160507-a73c-47b3-9ae5-74c33ea1e73e", name: "Titanium", type: "streak_reward" as const, cost: 0, tier: 365, imageUrl: "/attached_assets/generated_images/Titanium_transparent_ring.png", description: "Awarded for 365 consecutive days (1 year!)" },
  { id: "4421a90a-069d-43e0-a0d0-6f0f07e85713", name: "Emerald", type: "streak_reward" as const, cost: 0, tier: 730, imageUrl: "/attached_assets/generated_images/Emerald_transparent_ring.png", description: "Awarded for 730 consecutive days (2 years!)" },
  { id: "591b7fcb-1d99-4d1c-8c8b-9e24142467a4", name: "Legend Crown", type: "streak_reward" as const, cost: 0, tier: 1000, imageUrl: "/attached_assets/generated_images/Legend_crown_transparent_ring_01407bf6.png", description: "Unlock at 1000-day streak - Legendary achievement!" },

  // Purchasable - Basic (25 Koins)
  { id: "f330a175-3a40-4383-8f7f-1f4360aef3f4", name: "Fire Frame", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Fire_frame_transparent_ring_cf39de2c.png", description: "Blazing flames surrounding your profile" },
  { id: "6c4f9a30-c481-416e-8e89-bc8c82c23845", name: "Ice Crystal", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Ice_crystal_transparent_ring_a4430588.png", description: "Frozen crystalline border" },
  { id: "3c20e822-a96f-4e6d-990b-812bcb351687", name: "Galaxy Swirl", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Galaxy_swirl_transparent_ring_26cc8927.png", description: "Cosmic galaxy with swirling stars" },
  { id: "6e707d9f-e2f0-42e5-bb86-28e169e920f3", name: "Cherry Blossom", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Cherry_blossom_transparent_ring_e201ec9e.png", description: "Delicate pink cherry blossoms" },
  { id: "d3e32a4b-c290-49a7-a814-44b514ba2a98", name: "Lightning Strike", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Lightning_strike_transparent_ring_26cecb07.png", description: "Electrifying lightning bolts" },
  { id: "2cb82835-7e2e-4f52-834e-4a0232ec4470", name: "Royal Purple", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Royal_purple_transparent_ring_b8b71a1a.png", description: "Elegant purple with gold accents" },
  { id: "bf378e3d-1048-4fb0-8fae-25aa1d608246", name: "Neon Glow", type: "purchasable" as const, cost: 25, imageUrl: "/attached_assets/generated_images/Neon_glow_transparent_ring_e359ed65.png", description: "Vibrant neon border with electric glow" },
  { id: "e306ad67-4862-408d-8359-f2908a8aa64f", name: "Blood Moon", type: "purchasable" as const, cost: 25, tier: 4, imageUrl: "", description: "Crimson lunar eclipse" },

  // Purchasable - Tier 1 (50 Koins)
  { id: "d56a214c-43f4-4c73-b309-bdda99f279e2", name: "Rose Gold", type: "purchasable" as const, cost: 50, tier: 1, imageUrl: "", description: "Elegant pink and gold metallic" },
  { id: "6ae6494b-863b-4d68-84b4-08097782e9a5", name: "Emerald Ring", type: "purchasable" as const, cost: 50, tier: 1, imageUrl: "", description: "Bright green gemstone border" },
  { id: "a06f1614-ad8e-4d5e-9f94-28f05198bd9f", name: "Sunset Glow", type: "purchasable" as const, cost: 50, tier: 1, imageUrl: "", description: "Warm orange and pink gradient" },

  // Purchasable - Tier 2 (100 Koins)
  { id: "fa4d78b5-32bc-4943-ba72-32dffa467ef7", name: "Starlight", type: "purchasable" as const, cost: 100, tier: 2, imageUrl: "", description: "Twinkling white and gold stars ⭐" },
  { id: "3765dd21-214c-4cfe-bb1e-3af7992ce065", name: "Moonbeam", type: "purchasable" as const, cost: 100, tier: 2, imageUrl: "", description: "Mystical purple moonlight 🌙" },
  { id: "b6e85af2-7509-4e04-9e23-4b2856a794c4", name: "Dragon Scale", type: "purchasable" as const, cost: 100, tier: 2, imageUrl: "", description: "Fierce red dragon scales 🐉" },
  { id: "d85d7c40-5746-4b06-8928-d16f5e520569", name: "Phoenix Fire", type: "purchasable" as const, cost: 100, tier: 2, imageUrl: "", description: "Blazing orange phoenix flames 🔥" },
  { id: "e3705cbc-7b28-4384-b481-c6131aae3dd5", name: "Time Warp", type: "purchasable" as const, cost: 100, tier: 5, imageUrl: "", description: "Reality-bending spiral" },

  // Purchasable - Tier 3 (250 Koins)
  { id: "35916049-1451-4605-a497-4401dfa13fb3", name: "Cosmic Nebula", type: "purchasable" as const, cost: 250, tier: 3, imageUrl: "", description: "Deep space nebula clouds 🌌" },
  { id: "8226cf97-4bb9-4cdc-8fb4-67cf5062542f", name: "Electric Storm", type: "purchasable" as const, cost: 250, tier: 3, imageUrl: "", description: "Crackling lightning energy ⚡" },
  { id: "e3cbd940-9bb5-477a-b4ae-6f77dab0d502", name: "Crystal Aurora", type: "purchasable" as const, cost: 250, tier: 3, imageUrl: "", description: "Northern lights spectrum" },

  // Purchasable - Tier 4 (500 Koins)
  { id: "2af4eb97-1465-407e-bd5f-fa675d7d3cb5", name: "Shadow Realm", type: "purchasable" as const, cost: 500, tier: 4, imageUrl: "", description: "Dark mysterious void 💀" },
  { id: "bde06992-42b7-445c-a29a-c25d414ab1c3", name: "Lucky", type: "purchasable" as const, cost: 500, tier: 4, imageUrl: "", description: "Magical nature energy 🍃" },
  { id: "657211bd-5d80-40bb-9f6a-d510040e8b61", name: "Divine Radiance", type: "purchasable" as const, cost: 500, tier: 4, imageUrl: "", description: "Holy golden brilliance ✨" },

  // Purchasable - Tier 5 (1000 Koins)
  { id: "5e2a1769-1eff-4a22-a906-3ebf2ef2b685", name: "Infinity Spiral", type: "purchasable" as const, cost: 1000, tier: 5, imageUrl: "", description: "Endless dimensional vortex ♾️" },
  { id: "ff21f0b3-732d-433a-9e36-70449f675025", name: "Supernova Burst", type: "purchasable" as const, cost: 1000, tier: 5, imageUrl: "", description: "Explosive cosmic explosion 💥" },
  { id: "acc4fc70-4cb3-415e-8ad5-62282b421852", name: "Eternal Flame", type: "purchasable" as const, cost: 1000, tier: 5, imageUrl: "", description: "Immortal golden fire 🕯️" },
  { id: "d88b61d3-6def-4375-b999-111175d31c61", name: "Universe Core", type: "purchasable" as const, cost: 1000, tier: 5, imageUrl: "", description: "The center of all creation 🌟" },

  // Premium Borders (2500-10000 Koins)
  { id: "43355a94-4710-4476-8cb8-431aa2947f90", name: "Luminous Dawn", type: "purchasable" as const, cost: 2500, imageUrl: "", description: "A gentle sunrise glow with soft amber and rose tones" },
  { id: "8678a056-a07b-426c-89ac-509580bc352b", name: "Cyber Citrus", type: "purchasable" as const, cost: 2500, imageUrl: "", description: "Electric lime and cyan energy for the digital age" },
  { id: "4cd565db-c68f-4f76-ae67-2b79a8f19adf", name: "Ocean Gleam", type: "purchasable" as const, cost: 2500, imageUrl: "", description: "Deep blue waters with a tranquil shimmer" },
  { id: "760c6c09-a542-4c9d-a539-c4c3cdb4aa14", name: "Aurora Bloom", type: "purchasable" as const, cost: 2500, imageUrl: "", description: "Delicate purple and pink like the northern lights" },
  { id: "1fb83be7-a1bf-48ab-b547-a4659b45f4a0", name: "Solar Drift", type: "purchasable" as const, cost: 2500, imageUrl: "", description: "Warm sunshine fading into sunset embers" },
  { id: "7ac083be-36aa-4121-bbea-ed8cdeab1217", name: "Prismatic Echo", type: "purchasable" as const, cost: 5000, imageUrl: "", description: "Rotating purple spectrum with mystical shimmer" },
  { id: "8c6dbc15-316f-4974-aac1-9f86472a62ec", name: "Frostbyte Flux", type: "purchasable" as const, cost: 5000, imageUrl: "", description: "Icy cyan highlights with a digital frost effect" },
  { id: "22f62f1e-5c52-4c30-89c7-607bf0cdbcab", name: "Velvet Ember", type: "purchasable" as const, cost: 5000, imageUrl: "", description: "Smoldering red and orange with subtle rotation" },
  { id: "0625d53b-0e26-4b33-a929-60c17a91e6cb", name: "Lotus Mirage", type: "purchasable" as const, cost: 5000, imageUrl: "", description: "Soft pink and lavender dreamscape" },
  { id: "a4086098-68e3-49de-a9c7-d71874330cf8", name: "Prism Haze", type: "purchasable" as const, cost: 5000, imageUrl: "", description: "Emerald and gold light refraction" },
  { id: "a1201170-9976-4dd1-be6a-49bf3ed8fa18", name: "Celestial Loop", type: "purchasable" as const, cost: 10000, imageUrl: "", description: "Violet and fuchsia orbit with inner ring detail" },
  { id: "f1826a07-a81e-4978-af8d-c4ce1105a250", name: "Iridescent Rift", type: "purchasable" as const, cost: 10000, imageUrl: "", description: "Multi-color spectrum tear with dual layers" },
  { id: "4a64be16-9e14-498a-8064-e3cfd2572d59", name: "Velour Cascade", type: "purchasable" as const, cost: 10000, imageUrl: "", description: "Flowing rose and indigo gradient with depth" },
  { id: "2ff28f19-5974-41f4-ba80-911ecdf59354", name: "Gilded Horizon", type: "purchasable" as const, cost: 10000, imageUrl: "", description: "Golden sunrise with rotating warm tones" },
  { id: "d8e494f7-c483-489e-8e74-f306df72118c", name: "Sapphire Pulse", type: "purchasable" as const, cost: 10000, imageUrl: "", description: "Pulsing blue depths with cyan and teal" },

  // Ultra Premium (25000-100000 Koins)
  { id: "56e21e71-2024-423e-8d52-381caf32e0f3", name: "Quantum Bloom", type: "purchasable" as const, cost: 25000, imageUrl: "", description: "Purple to pink energy burst with directional light" },
  { id: "7be5608d-c462-4e98-8c36-ccdb70a9fe55", name: "Inferno Ribbon", type: "purchasable" as const, cost: 25000, imageUrl: "", description: "Red and orange flames with spiral motion" },
  { id: "5f70cb9d-8cf9-4444-b10f-1f3230f821e8", name: "Glacial Helix", type: "purchasable" as const, cost: 25000, imageUrl: "", description: "Frozen cyan swirl with icy brilliance" },
  { id: "8a78abfa-2115-4d78-a053-333b10ae6f57", name: "Shadow Prism", type: "purchasable" as const, cost: 25000, imageUrl: "", description: "Dark violet depths with purple glow" },
  { id: "bd7b695f-547d-4769-af41-9f30f4e60400", name: "Electrum Tide", type: "purchasable" as const, cost: 25000, imageUrl: "", description: "Teal and green waves of electric energy" },
  { id: "00b39c66-0ced-4b07-af81-48321a656763", name: "Nebula Veil", type: "purchasable" as const, cost: 50000, imageUrl: "", description: "Cosmic purple clouds with particle streaks" },
  { id: "90508253-57fe-4d01-85c3-84f7124463fb", name: "Auric Cyclone", type: "purchasable" as const, cost: 50000, imageUrl: "", description: "Spinning gold and fire with dual rotation" },
  { id: "c6c0c9f8-ea2a-45cc-a651-8e0667cd84de", name: "Starforge Spiral", type: "purchasable" as const, cost: 50000, imageUrl: "", description: "Brilliant white light with celestial trails" },
  { id: "6ef25fb8-478b-4829-982c-cd78eea52d3d", name: "Rose Quasar", type: "purchasable" as const, cost: 50000, imageUrl: "", description: "Pink supernova with pulsing radiance" },
  { id: "ed836138-0021-4368-952b-4681b2215307", name: "Eclipse Bloom", type: "purchasable" as const, cost: 50000, imageUrl: "", description: "Dark void illuminated by purple auroras" },
  { id: "9423e81b-7cb7-4856-9428-86b06ec342f2", name: "Photon Odyssey", type: "purchasable" as const, cost: 100000, imageUrl: "", description: "Blazing white and gold with triple-orbit halos" },
  { id: "7f6dc1c1-49b7-46d6-b8b3-bdba91dd3f72", name: "Stormsong Halo", type: "purchasable" as const, cost: 100000, imageUrl: "", description: "Cyan and teal tempest with layered rings" },
  { id: "1b076ab9-3363-4fcc-bead-7aa02a5aef71", name: "Opaline Vortex", type: "purchasable" as const, cost: 100000, imageUrl: "", description: "Lavender swirl with multi-layer shimmer" },
  { id: "2808292a-a6b2-43a8-9925-259cbdac3a23", name: "Crystalline Crown", type: "purchasable" as const, cost: 100000, imageUrl: "", description: "Diamond-white brilliance with ice fragments" },
  { id: "53e28b87-d067-434e-95d4-f7f529c80fa2", name: "Radiant Singularity", type: "purchasable" as const, cost: 100000, imageUrl: "", description: "Golden supernova with orbital light beams" },

  // Legendary (250000-1000000 Koins)
  { id: "1fdce9af-c601-4ab1-ae94-77b123e88546", name: "Eventide Regalia", type: "purchasable" as const, cost: 250000, imageUrl: "", description: "Deep purple twilight with aurora parallax" },
  { id: "25c91ca9-5d3f-481e-bcda-7051adb2dff2", name: "Astral Dominion", type: "purchasable" as const, cost: 250000, imageUrl: "", description: "Golden celestial power with nebula cycling" },
  { id: "c98533a0-2e1a-4079-a818-2c511180d043", name: "Mythos Aegis", type: "purchasable" as const, cost: 250000, imageUrl: "", description: "Crimson shield with legendary fire aura" },
  { id: "507a93ef-a062-47ca-9088-2055554880a8", name: "Mirage Sovereign", type: "purchasable" as const, cost: 250000, imageUrl: "", description: "Cyan majesty with refracted light waves" },
  { id: "c001b57f-86fb-4bcc-94b6-28d36ac1090b", name: "Empyrean Resonance", type: "purchasable" as const, cost: 250000, imageUrl: "", description: "Purple harmony with prismatic pulses" },
  { id: "529504bc-2cdc-4cab-b27d-2e3cb81ff3e9", name: "Genesis Continuum", type: "purchasable" as const, cost: 500000, imageUrl: "", description: "Creation itself - golden halos with spark trails and refracted light" },
  { id: "07eae83b-21d7-4b3b-aea0-256802ba4d09", name: "Chrono Paragon", type: "purchasable" as const, cost: 500000, imageUrl: "", description: "Master of time - indigo dimensions with tri-layered temporal rings" },
  { id: "88f0099b-3ba7-4270-8de3-1812b3a18795", name: "Million Kliq Club", type: "purchasable" as const, cost: 1000000, imageUrl: "", description: "💎 THE ULTIMATE ACHIEVEMENT - Reserved for legends who reached 1 million Kliq Koins! Triple-layered rainbow vortex with counter-rotating halos and explosive prismatic glow ✨💫🌈" },

  // Monthly Free Borders
  { id: "eb822063-70e7-423a-8422-308919c4de4c", name: "Black History Month", type: "purchasable" as const, cost: 0, availableMonth: 2, imageUrl: "", description: "Honoring the Contributions and Legacy of Black Americans ✊🏿" },
  { id: "3cfc301e-4c63-4a5c-806a-da7bbccc7a4c", name: "Autism Awareness", type: "purchasable" as const, cost: 0, availableMonth: 4, imageUrl: "", description: "Supporting Autism Awareness and Acceptance 🧩" },
  { id: "00276433-94df-4e48-abf6-cdd96691e471", name: "Mental Health Awareness", type: "purchasable" as const, cost: 0, availableMonth: 5, imageUrl: "", description: "Supporting Mental Health and Well-being 💚" },
  { id: "3fb251c2-4cdf-4b20-8366-2e74a3db8c72", name: "Pride Month", type: "purchasable" as const, cost: 0, availableMonth: 6, imageUrl: "/attached_assets/generated_images/Rainbow_sparkle_transparent_border_ring_2a2fe7c2.png", description: "Celebrating LGBTQ+ Pride and Diversity 🏳️‍🌈" },
  { id: "e784bfbe-a42f-4871-a9ce-158a179faa75", name: "4th of July", type: "purchasable" as const, cost: 0, availableMonth: 7, imageUrl: "", description: "Celebrating American Independence 🇺🇸" },
  { id: "1c311c6b-89c6-4c12-8878-d8785b1a7d64", name: "Hispanic Heritage", type: "purchasable" as const, cost: 0, availableMonth: 9, imageUrl: "", description: "Celebrating Hispanic Heritage and Culture ❤️" },
  { id: "407ffdd0-6211-4cf9-bab4-cfd457be3924", name: "National Suicide Prevention", type: "purchasable" as const, cost: 0, availableMonth: 9, imageUrl: "", description: "Supporting Suicide Prevention and Mental Health 💛" },
  { id: "8f537c00-0153-44d5-94f4-24ae0327f4c4", name: "Breast Cancer Awareness", type: "purchasable" as const, cost: 0, availableMonth: 10, imageUrl: "", description: "Supporting Breast Cancer Awareness 🎀" },
  { id: "f500e5f8-e043-4d65-b628-39693af7e165", name: "Alzheimers Awareness", type: "purchasable" as const, cost: 0, availableMonth: 11, imageUrl: "", description: "Supporting Alzheimer's Awareness and Research 💜" },

  // Reward Borders (Engagement-based)
  { id: "ead27cb3-409c-4844-810f-edc32c47ab17", name: "Emotionally Aware", type: "reward" as const, cost: 0, imageUrl: "/images/borders/emotionally-aware.png", description: "Reward for posting 100 mood updates", engagementType: "mood_updates" as const, engagementThreshold: 100 },
  { id: "f8ae6743-d3cf-47d0-be18-aedcf6f9eb4c", name: "Mood Warrior", type: "reward" as const, cost: 0, imageUrl: "/images/borders/mood-warrior.png", description: "Reward for posting 250 mood updates", engagementType: "mood_updates" as const, engagementThreshold: 250 },
  { id: "24a804d9-d8a1-48ec-bdca-d2e28aa28373", name: "Zen Master", type: "reward" as const, cost: 0, imageUrl: "/images/borders/zen-master.png", description: "Reward for posting 500 mood updates", engagementType: "mood_updates" as const, engagementThreshold: 500 },
  { id: "54204602-6ecb-450d-bffd-4cf0119e3f59", name: "Head in the Clouds", type: "reward" as const, cost: 0, imageUrl: "/images/borders/head-in-the-clouds.png", description: "Reward for posting 100 daily horoscopes", engagementType: "horoscope_posts" as const, engagementThreshold: 100 },
  { id: "6379cade-80eb-494d-b4f9-2c6028fa308e", name: "Clarity", type: "reward" as const, cost: 0, imageUrl: "/images/borders/clarity.png", description: "Reward for posting 250 daily horoscopes", engagementType: "horoscope_posts" as const, engagementThreshold: 250 },
  { id: "cbda30fc-8a33-4c65-a346-86290b951ae3", name: "Stargazer", type: "reward" as const, cost: 0, imageUrl: "/images/borders/stargazer.png", description: "Reward for posting 500 daily horoscopes", engagementType: "horoscope_posts" as const, engagementThreshold: 500 },
  { id: "a80ecdf5-9190-48b1-858c-b41f2d920c5b", name: "Likeable", type: "reward" as const, cost: 0, imageUrl: "", description: "Reward for liking 100 different posts", engagementType: "posts_liked" as const, engagementThreshold: 100 },
  { id: "39d1f0e4-9dce-47c0-8d4b-8f2e3b4c5a6d", name: "Love Giver", type: "reward" as const, cost: 0, imageUrl: "", description: "Reward for liking 250 different posts", engagementType: "posts_liked" as const, engagementThreshold: 250 },
  { id: "4a2e1f5e-0adf-48d1-9c5e-9a3e4c6d7e8f", name: "Heart of Gold", type: "reward" as const, cost: 0, imageUrl: "", description: "Reward for liking 500 different posts", engagementType: "posts_liked" as const, engagementThreshold: 500 },
];

export async function seedBorders() {
  console.log('Seeding profile borders...');
  
  let insertedCount = 0;
  let skippedCount = 0;

  for (const border of borders) {
    try {
      await db.insert(profileBorders).values({
        id: border.id,
        name: border.name,
        type: border.type,
        cost: border.cost,
        tier: border.tier || null,
        imageUrl: border.imageUrl || "",
        description: border.description,
        availableMonth: border.availableMonth || null,
        engagementType: border.engagementType || null,
        engagementThreshold: border.engagementThreshold || null,
        isActive: true,
      }).onConflictDoNothing();
      insertedCount++;
    } catch (error: any) {
      if (error.code === '23505') {
        skippedCount++;
      } else {
        console.error(`Failed to insert border ${border.name}:`, error.message);
      }
    }
  }

  console.log(`✅ Borders seeding complete: ${insertedCount} inserted, ${skippedCount} already existed`);
  return { inserted: insertedCount, skipped: skippedCount };
}

