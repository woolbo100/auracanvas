export interface Wallpaper {
  id: string;
  slug: string;
  title_ko: string;
  title_en: string;
  category: string;
  price: number;
  thumbnailUrl: string;
  imageUrl: string;
  locked: boolean;
  featured: boolean;
  sortOrder: number;
  isActive: boolean;
  meaning?: string;
  description?: string;
  ritual_steps?: string[];
}

export const CATEGORIES = ["Abundance", "Love", "Energy", "Healing"];

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "1",
    slug: "888-abundance",
    title_ko: "888 풍요의 활성화",
    title_en: "888 Abundance Activation",
    price: 8.88,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    category: "Abundance",
    locked: true,
    featured: true,
    sortOrder: 1,
    isActive: true,
    meaning: "The frequency of infinite flow and material prosperity.",
    description: "Align your digital altar with the vibration of 888. This activation art is designed to open channels of prosperity.",
    ritual_steps: ["Set as your focus mode background.", "Recite: 'I am a magnet for infinite abundance.'"]
  },
  {
    id: "2",
    slug: "222-love",
    title_ko: "222 사랑의 정렬",
    title_en: "222 Love Alignment",
    price: 7.77,
    thumbnailUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    category: "Love",
    locked: true,
    featured: false,
    sortOrder: 2,
    isActive: true,
    meaning: "Harmony, trust, and the balance of divine partnerships.",
    description: "222 is the number of balance and manifestation in relationships.",
    ritual_steps: ["Place on your most-used device.", "Feel the warmth of universal love surrounding you."]
  }
];
