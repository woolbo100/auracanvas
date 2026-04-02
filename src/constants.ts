export interface Wallpaper {
  id: string;
  title: string;
  category: string;
  price: number;
  thumb_url: string;
  high_res_url: string;
  created_at: any;
  status: 'active' | 'inactive';
  artist?: string;
  meaning?: string;
}

export const CATEGORIES = ["Wealth", "Love", "Success", "Peace"];

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "1",
    title: "Golden Flow of Abundance",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    category: "Wealth",
    status: 'active',
    created_at: null,
    meaning: "Attracts wealth and prosperity through the celestial dragon's breath."
  },
  {
    id: "2",
    title: "Celestial Love Harmony",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    category: "Love",
    status: 'active',
    created_at: null,
    meaning: "Balances your inner energy and brings peace to your digital space."
  },
  {
    id: "3",
    title: "Success Phoenix Rise",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800",
    category: "Success",
    status: 'active',
    created_at: null,
    meaning: "Ignites passion and physical energy for a renewed sense of purpose."
  },
  {
    id: "4",
    title: "Deep Peace Focus",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&q=80&w=800",
    category: "Peace",
    status: 'active',
    created_at: null,
    meaning: "Eliminates distractions and sharpens your mental clarity."
  },
  {
    id: "5",
    title: "Emerald Prosperity",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    category: "Wealth",
    status: 'active',
    created_at: null,
    meaning: "A manifestation of growth and financial stability."
  },
  {
    id: "6",
    title: "Rose Quartz Heart",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
    category: "Love",
    status: 'active',
    created_at: null,
    meaning: "Radiates universal love and deep emotional healing."
  },
  {
    id: "7",
    title: "Victory Crown Aura",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
    category: "Success",
    status: 'active',
    created_at: null,
    meaning: "The energy of achievement and leadership."
  },
  {
    id: "8",
    title: "Zen Garden Silence",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    category: "Peace",
    status: 'active',
    created_at: null,
    meaning: "Find stillness in the digital chaos."
  }
];
