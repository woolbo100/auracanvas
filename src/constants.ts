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
  description?: string;
  ritual_steps?: string[];
}

export const CATEGORIES = ["Abundance", "Love", "Energy", "Healing"];

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "1",
    title: "888 Abundance Activation",
    artist: "Aura AI",
    price: 8.88,
    thumb_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    category: "Abundance",
    status: 'active',
    created_at: null,
    meaning: "The frequency of infinite flow and material prosperity.",
    description: "Align your digital altar with the vibration of 888. This activation art is designed to open channels of prosperity and attract continuous wealth into your life.",
    ritual_steps: ["Set as your focus mode background.", "Breathe deeply while visualizing golden light entering your space.", "Recite: 'I am a magnet for infinite abundance.'"]
  },
  {
    id: "2",
    title: "222 Love Alignment",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    category: "Love",
    status: 'active',
    created_at: null,
    meaning: "Harmony, trust, and the balance of divine partnerships.",
    description: "222 is the number of balance and manifestation in relationships. Use this ritual art to invite harmonious connections and stabilize your emotional aura.",
    ritual_steps: ["Place on your most-used device.", "Focus on the center of the image for 2 minutes.", "Feel the warmth of universal love surrounding you."]
  },
  {
    id: "3",
    title: "111 New Beginning",
    artist: "Aura AI",
    price: 4.44,
    thumb_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800",
    category: "Energy",
    status: 'active',
    created_at: null,
    meaning: "Rapid manifestation and the power of pure intent.",
    description: "When 111 appears, the gateway of manifestation is open. This art serves as a catalyst for your newest intentions and boldest dreams.",
    ritual_steps: ["Set your intention clearly before activating.", "Use this art as a prompt for morning journaling.", "Take action on your ideas immediately."]
  },
  {
    id: "4",
    title: "444 Protection Field",
    artist: "Aura AI",
    price: 4.44,
    thumb_url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&q=80&w=800",
    category: "Healing",
    status: 'active',
    created_at: null,
    meaning: "The presence of divine guardians and stable foundations.",
    description: "444 is a sign that you are protected and guided. This geometric ritual art creates a stable energy field around your digital and physical space.",
    ritual_steps: ["Activate during times of stress or uncertainty.", "Imagine a sphere of light protecting your aura.", "Know that you are safe and supported."]
  },
  {
    id: "5",
    title: "777 Spiritual Awakening",
    artist: "Aura AI",
    price: 7.77,
    thumb_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    category: "Energy",
    status: 'active',
    created_at: null,
    meaning: "Divine luck and the deepening of spiritual wisdom.",
    description: "A master number for those on the path of enlightenment. 777 signifies that you are in direct alignment with the universe's magical flow.",
    ritual_steps: ["Use during meditation or contemplation.", "Observe the intricate patterns to quiet the mind.", "Expect synchronicity and miracles."]
  },
  {
    id: "6",
    title: "999 Completion Aura",
    artist: "Aura AI",
    price: 9.99,
    thumb_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
    high_res_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
    category: "Healing",
    status: 'active',
    created_at: null,
    meaning: "The end of a cycle and preparation for the new.",
    description: "999 represents the culmination of a journey. Use this art to gracefully release the old and clear space for the next chapter of your soul's evolution.",
    ritual_steps: ["Reflect on what you are ready to let go of.", "Breathe out tension and outdated beliefs.", "Welcome the wisdom of experience."]
  }
];
