import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Package, 
  BarChart3, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Users,
  Tag,
  Grid,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { 
  db, 
  auth, 
  storage 
} from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

// --- Types ---

interface Wallpaper {
  id: string;
  slug: string;
  title_ko: string;
  title_en: string;
  badge?: string;
  category: string;
  price: number;
  description_ko?: string;
  description_en?: string;
  thumbnailUrl: string;
  imageUrl: string;
  created_at: any;
  isActive: boolean;
  locked: boolean;
  featured: boolean;
  sortOrder: number;
  artist?: string;
}

interface Sale {
  id: string;
  wallpaper_id: string;
  amount: number;
  timestamp: any;
  buyer_email: string;
}

interface Category {
  id: string;
  name: string;
  icon_url?: string;
}

// --- Components ---

export const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qWallpapers = query(collection(db, 'products'), orderBy('sortOrder', 'asc'));
    const unsubscribeWallpapers = onSnapshot(qWallpapers, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper));
      setWallpapers(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    const qSales = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(docs);
    }, (error) => {
      console.error("Error fetching sales:", error);
    });

    const qCategories = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(docs);
    }, (error) => {
      console.error("Error fetching categories:", error);
    });

    const qUsers = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(docs);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    return () => {
      unsubscribeWallpapers();
      unsubscribeSales();
      unsubscribeCategories();
      unsubscribeUsers();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView wallpapers={wallpapers} sales={sales} />;
      case 'upload': return <UploadView categories={categories} />;
      case 'inventory': return <InventoryView wallpapers={wallpapers} categories={categories} />;
      case 'sales': return <SalesView sales={sales} wallpapers={wallpapers} />;
      case 'categories': return <CategoriesView categories={categories} />;
      case 'users': return <UsersView users={users} />;
      default: return <DashboardView wallpapers={wallpapers} sales={sales} />;
    }
  };

  return (
    <div className="flex h-screen bg-deep-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal border-r border-white/5 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30 animate-pulse-gold">
            <ShieldCheck className="text-gold w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-white">Aura Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold text-white/40 hover:bg-white/5 hover:text-white transition-all border border-transparent mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sanctuary
          </Link>
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'upload', label: 'Manifest Art', icon: UploadCloud },
            { id: 'inventory', label: 'Sanctuary', icon: Package },
            { id: 'categories', label: 'Energies', icon: Grid },
            { id: 'sales', label: 'Exchanges', icon: TrendingUp },
            { id: 'users', label: 'Seekers', icon: Users },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold transition-all border border-transparent",
                activeTab === item.id 
                  ? "bg-gold/10 text-gold border-gold/20 shadow-[0_0_20px_rgba(219,198,126,0.1)]" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs uppercase tracking-widest font-bold text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-16 bg-deep-black">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-gold animate-pulse">Aligning Sanctuary</span>
            </div>
          ) : renderContent()}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Views ---

const DashboardView = ({ wallpapers, sales }: { wallpapers: Wallpaper[], sales: Sale[] }) => {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const activeWallpapers = wallpapers.filter(w => w.isActive).length;

  // Process data for trend chart
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent';
    acc[date] = (acc[date] || 0) + sale.amount;
    return acc;
  }, {});

  const trendData = Object.keys(salesByDate).map(date => ({
    date,
    revenue: salesByDate[date]
  })).reverse().slice(-7); // Last 7 days

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Sanctuary Overview</h1>
        <p className="text-white/40 mt-3 text-lg font-light italic">Welcome back, Guardian. The energies are aligning.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          label="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          trend="+12.5%" 
          color="bg-gold/10 text-gold"
        />
        <StatCard 
          label="Active Artworks" 
          value={activeWallpapers.toString()} 
          icon={ImageIcon} 
          trend="+3 new" 
          color="bg-gold/10 text-gold"
        />
        <StatCard 
          label="Total Sales" 
          value={sales.length.toString()} 
          icon={TrendingUp} 
          trend="+8.2%" 
          color="bg-gold/10 text-gold"
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-serif font-bold text-white">Revenue Manifestation</h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full border border-gold/20">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Live Flow</span>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid rgba(212, 175, 55, 0.2)', 
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#D4AF37' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#D4AF37" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-serif font-bold mb-8 text-white">Recent Exchanges</h3>
          <div className="space-y-6">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-gold/20 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 group-hover:shadow-[0_0_15px_rgba(219,198,126,0.2)] transition-all">
                    <DollarSign className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{sale.buyer_email}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                      {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gold">+${sale.amount.toFixed(2)}</span>
              </div>
            ))}
            {sales.length === 0 && <p className="text-white/20 text-center py-12 italic">No exchanges yet.</p>}
          </div>
        </div>

        <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-serif font-bold mb-8 text-white">Sanctuary Status</h3>
          <div className="space-y-6">
            {wallpapers.slice(0, 5).map((wp) => (
              <div key={wp.id} className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-gold/20 transition-all group">
                <div className="relative w-14 h-14 shrink-0">
                  <img src={wp.thumbnailUrl} className="w-full h-full object-cover rounded-2xl border border-white/10" />
                  <div className="absolute inset-0 bg-gold/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{wp.title_en}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{wp.category}</p>
                </div>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                  wp.isActive ? "bg-gold/10 text-gold border-gold/20" : "bg-white/5 text-white/30 border-white/5"
                )}>
                  {wp.isActive ? 'active' : 'hidden'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl flex items-center gap-8 hover:border-gold/20 transition-all group">
    <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border border-gold/20 transition-all group-hover:shadow-[0_0_20px_rgba(219,198,126,0.2)]", color)}>
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{label}</p>
      <div className="flex items-baseline gap-4">
        <h4 className="text-3xl font-serif font-bold text-white">{value}</h4>
        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  </div>
);

const UploadView = ({ categories }: { categories: Category[] }) => {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  
  const [spaceMockupFile, setSpaceMockupFile] = useState<File | null>(null);
  const [focusMockupFile, setFocusMockupFile] = useState<File | null>(null);
  const [pocketMockupFile, setPocketMockupFile] = useState<File | null>(null);
  
  const [spacePreview, setSpacePreview] = useState<string | null>(null);
  const [focusPreview, setFocusPreview] = useState<string | null>(null);
  const [pocketPreview, setPocketPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title_ko: '',
    title_en: '',
    badge: '',
    category: 'abundance',
    price: '8.88',
    description_ko: '',
    description_en: '',
    locked: true,
    featured: false,
    isActive: true,
    sortOrder: '0',
    artist: 'Aura AI'
  });

  const manifestCategories = [
    { value: 'abundance', label: 'Abundance' },
    { value: 'love', label: 'Love' },
    { value: 'energy', label: 'Energy' },
    { value: 'healing', label: 'Healing' }
  ] as const;

  const categoryMeta = manifestCategories.find((item) => item.value === formData.category) ?? manifestCategories[0];

  const setPreviewFromFile = (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setMainFile, setMainPreview);
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setThumbFile, setThumbPreview);
    }
  };

  const handleSpaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setSpaceMockupFile, setSpacePreview);
    }
  };

  const handleFocusFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setFocusMockupFile, setFocusPreview);
    }
  };

  const handlePocketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setPocketMockupFile, setPocketPreview);
    }
  };

  const buildSlug = () =>
    (formData.slug || formData.title_en || formData.title_ko)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const toCategoryLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile || !thumbFile || uploading) return;

    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const imageRef = ref(storage, `products/${timestamp}_image_${mainFile.name}`);
      const imageSnapshot = await uploadBytes(imageRef, mainFile);
      setProgress(45);

      const thumbnailRef = ref(storage, `products/${timestamp}_thumbnail_${thumbFile.name}`);
      const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbFile);
      setProgress(85);

      const imageUrl = await getDownloadURL(imageSnapshot.ref);
      const thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);

      let spaceUrl = '';
      if (spaceMockupFile) {
        const spaceRef = ref(storage, `products/${timestamp}_space_${spaceMockupFile.name}`);
        const spaceSnap = await uploadBytes(spaceRef, spaceMockupFile);
        spaceUrl = await getDownloadURL(spaceSnap.ref);
      }
      let focusUrl = '';
      if (focusMockupFile) {
        const focusRef = ref(storage, `products/${timestamp}_focus_${focusMockupFile.name}`);
        const focusSnap = await uploadBytes(focusRef, focusMockupFile);
        focusUrl = await getDownloadURL(focusSnap.ref);
      }
      let pocketUrl = '';
      if (pocketMockupFile) {
        const pocketRef = ref(storage, `products/${timestamp}_pocket_${pocketMockupFile.name}`);
        const pocketSnap = await uploadBytes(pocketRef, pocketMockupFile);
        pocketUrl = await getDownloadURL(pocketSnap.ref);
      }

      const mockups: any = {};
      if (spaceUrl) mockups.space = { imageUrl: spaceUrl };
      if (focusUrl) mockups.focus = { imageUrl: focusUrl };
      if (pocketUrl) mockups.pocket = { imageUrl: pocketUrl };

      await addDoc(collection(db, 'products'), {
        slug: buildSlug(),
        title_ko: formData.title_ko,
        title_en: formData.title_en,
        badge: formData.badge.trim(),
        category: toCategoryLabel(formData.category),
        price: parseFloat(formData.price),
        description_ko: formData.description_ko,
        description_en: formData.description_en,
        thumbnailUrl,
        imageUrl,
        ...(Object.keys(mockups).length > 0 ? { mockups } : {}),
        locked: formData.locked,
        featured: formData.featured,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
        artist: formData.artist,
        created_at: serverTimestamp()
      });

      setProgress(100);
      setSuccess(true);
      setMainFile(null);
      setThumbFile(null);
      setSpaceMockupFile(null);
      setFocusMockupFile(null);
      setPocketMockupFile(null);
      setMainPreview(null);
      setThumbPreview(null);
      setSpacePreview(null);
      setFocusPreview(null);
      setPocketPreview(null);
      setFormData({
        slug: '',
        title_ko: '',
        title_en: '',
        badge: '',
        category: 'abundance',
        price: '8.88',
        description_ko: '',
        description_en: '',
        locked: true,
        featured: false,
        isActive: true,
        sortOrder: '0',
        artist: 'Aura AI'
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleField = (key: 'locked' | 'featured' | 'isActive') => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header>
        <div className="inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/10 px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-gold">
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          Manifest Chamber
        </div>
        <h1 className="mt-6 text-5xl font-serif font-bold text-white tracking-tight">Manifest Art Activation</h1>
        <p className="mt-3 text-lg font-light italic text-white/40">
          Craft a collectible product ritual with premium visuals, aligned metadata, and sanctuary-ready presence.
        </p>
      </header>

      <form onSubmit={handleUpload} className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <div className="rounded-[2.5rem] border border-gold/15 bg-[radial-gradient(circle_at_top,rgba(201,169,91,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Essence Metadata</p>
                <h2 className="mt-3 text-3xl font-serif text-white">Product Identity</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
                {categoryMeta.label} Frequency
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">상품명 (영문)</label>
                <input required type="text" value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} placeholder="e.g. 888 Abundance Activation" className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-white outline-none transition-all focus:border-gold/50" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">상품명 (한글)</label>
                <input required type="text" value={formData.title_ko} onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })} placeholder="예: 888 풍요 활성화" className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 font-sans text-white outline-none transition-all focus:border-gold/50" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">뱃지 (예: 888)</label>
                <input type="text" value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })} placeholder="e.g. 888" className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-white outline-none transition-all focus:border-gold/50" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">슬러그 (URL 식별자)</label>
                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="비워두면 자동 생성됩니다" className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-white/70 outline-none transition-all focus:border-gold/50" />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Manifest Details</p>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">설명 (영문)</label>
                <textarea required rows={4} value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} placeholder="상품 카드에 표시될 영문 설명을 입력하세요." className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 outline-none transition-all focus:border-gold/50" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">설명 (한글)</label>
                <textarea required rows={4} value={formData.description_ko} onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })} placeholder="상품 카드에 표시될 짧은 한국어 설명을 입력하세요." className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-6 font-sans text-white/80 outline-none transition-all focus:border-gold/50" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">카테고리</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-6 text-white outline-none transition-all focus:border-gold/50">
                  {manifestCategories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-charcoal">
                      {cat.value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">가격 (USD)</label>
                <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-white outline-none transition-all focus:border-gold/50" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">정렬 순서</label>
                <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-white outline-none transition-all focus:border-gold/50" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-gold/10 bg-deep-black/40 p-5 md:grid-cols-3">
              <button type="button" onClick={() => toggleField('locked')} className={cn('rounded-[1.5rem] border px-5 py-5 text-left transition-all', formData.locked ? 'border-gold/30 bg-gold/10 shadow-[0_0_24px_rgba(201,169,91,0.12)]' : 'border-white/10 bg-white/5')}>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Locked</p>
                <p className={cn('mt-3 text-lg font-serif', formData.locked ? 'text-gold' : 'text-white/70')}>{formData.locked ? 'Sealed' : 'Open'}</p>
              </button>
              <button type="button" onClick={() => toggleField('featured')} className={cn('rounded-[1.5rem] border px-5 py-5 text-left transition-all', formData.featured ? 'border-gold/30 bg-gold/10 shadow-[0_0_24px_rgba(201,169,91,0.12)]' : 'border-white/10 bg-white/5')}>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Featured</p>
                <p className={cn('mt-3 text-lg font-serif', formData.featured ? 'text-gold' : 'text-white/70')}>{formData.featured ? 'Core Piece' : 'Standard'}</p>
              </button>
              <button type="button" onClick={() => toggleField('isActive')} className={cn('rounded-[1.5rem] border px-5 py-5 text-left transition-all', formData.isActive ? 'border-gold/30 bg-gold/10 shadow-[0_0_24px_rgba(201,169,91,0.12)]' : 'border-white/10 bg-white/5')}>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">isActive</p>
                <p className={cn('mt-3 text-lg font-serif', formData.isActive ? 'text-gold' : 'text-white/70')}>{formData.isActive ? 'Live' : 'Dormant'}</p>
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Visual Assets</p>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">대표 이미지 업로드 (imageUrl)</label>
                <button type="button" onClick={() => document.getElementById('manifest-main-upload')?.click()} className="group relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-dashed border-gold/20 bg-[radial-gradient(circle_at_top,rgba(201,169,91,0.18),transparent_45%),rgba(255,255,255,0.03)]">
                  {mainPreview ? (
                    <>
                      <img src={mainPreview} alt="Main preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold">Change image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                        <ImageIcon className="h-8 w-8 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Representative Aura</p>
                        <p className="mt-2 text-[11px] text-white/30">Upload the full product artwork shown after activation.</p>
                      </div>
                    </div>
                  )}
                </button>
                <input id="manifest-main-upload" type="file" accept="image/*" onChange={handleMainFileChange} className="hidden" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">썸네일 업로드 (thumbnailUrl)</label>
                <button type="button" onClick={() => document.getElementById('manifest-thumb-upload')?.click()} className="group relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03]">
                  {thumbPreview ? (
                    <>
                      <img src={thumbPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold">Change thumbnail</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                        <UploadCloud className="h-8 w-8 text-white/40" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Thumbnail Seal</p>
                        <p className="mt-2 text-[11px] text-white/30">Upload the gallery preview image used before activation.</p>
                      </div>
                    </div>
                  )}
                </button>
                <input id="manifest-thumb-upload" type="file" accept="image/*" onChange={handleThumbFileChange} className="hidden" />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Usage Mockups</p>
            <p className="mt-2 text-[11px] text-white/40">These images appear in the "Where This Energy Lives" section of the product detail page.</p>
            
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold text-center block">공간 연출 이미지 (Space)</label>
                <p className="text-center text-[9px] text-white/40 mb-2">(벽 액자 / 캔버스 용)</p>
                <button type="button" onClick={() => document.getElementById('manifest-space-upload')?.click()} className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {spacePreview ? (
                    <>
                      <img src={spacePreview} alt="Space preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                      <UploadCloud className="h-6 w-6 text-white/40" />
                      <p className="text-[9px] font-bold text-white/50">비율 3:4 or 4:5</p>
                    </div>
                  )}
                </button>
                <input id="manifest-space-upload" type="file" accept="image/*" onChange={handleSpaceFileChange} className="hidden" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold text-center block">작업 화면 이미지 (Focus)</label>
                <p className="text-center text-[9px] text-white/40 mb-2">(모니터 / 데스크 용)</p>
                <button type="button" onClick={() => document.getElementById('manifest-focus-upload')?.click()} className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {focusPreview ? (
                    <>
                      <img src={focusPreview} alt="Focus preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                      <UploadCloud className="h-6 w-6 text-white/40" />
                      <p className="text-[9px] font-bold text-white/50">비율 16:9 or 4:3</p>
                    </div>
                  )}
                </button>
                <input id="manifest-focus-upload" type="file" accept="image/*" onChange={handleFocusFileChange} className="hidden" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold text-center block">부적 이미지 (Pocket)</label>
                <p className="text-center text-[9px] text-white/40 mb-2">(카드 / 부적 용)</p>
                <button type="button" onClick={() => document.getElementById('manifest-pocket-upload')?.click()} className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {pocketPreview ? (
                    <>
                      <img src={pocketPreview} alt="Pocket preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                      <UploadCloud className="h-6 w-6 text-white/40" />
                      <p className="text-[9px] font-bold text-white/50">비율 2:3</p>
                    </div>
                  )}
                </button>
                <input id="manifest-pocket-upload" type="file" accept="image/*" onChange={handlePocketFileChange} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-5">
          <div className="rounded-[2.75rem] border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(201,169,91,0.22),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold">Activation Preview</p>
                <h2 className="mt-3 text-3xl font-serif text-white">{formData.title_en || 'Untitled Manifest'}</h2>
              </div>
              {formData.badge && <div className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold text-gold">{formData.badge}</div>}
            </div>

            <div className="mt-8 rounded-[2.25rem] border border-white/10 bg-deep-black/60 p-5">
              <div className="relative aspect-[9/14] overflow-hidden rounded-[1.75rem] bg-white/5">
                {thumbPreview || mainPreview ? (
                  <img src={thumbPreview || mainPreview || ''} alt="Manifest preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-10 text-center text-white/25">Your collectible preview will awaken here.</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/15 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-gold/80">
                    <span>{categoryMeta.label}</span>
                    {formData.featured && <span className="h-1 w-1 rounded-full bg-gold" />}
                    {formData.featured && <span>Featured</span>}
                  </div>
                  <p className="mt-3 text-2xl font-serif text-white">{formData.title_ko || formData.title_en || 'AuraCanvas Manifest'}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-white/55">{formData.description_ko || formData.description_en || 'Short description will appear here.'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Price</span>
                <span className="text-2xl font-serif text-gold">${Number(formData.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Status</span>
                <span>{formData.isActive ? 'Live in Sanctuary' : 'Hidden draft'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Seal</span>
                <span>{formData.locked ? 'Locked access' : 'Open access'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Sort Order</span>
                <span>{formData.sortOrder || '0'}</span>
              </div>
            </div>

            <button type="submit" disabled={uploading || !mainFile || !thumbFile} className="aura-gold-btn relative mt-8 w-full overflow-hidden disabled:opacity-50">
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gold/20">
                  <div className="h-full w-full origin-left bg-gold/30 transition-transform duration-300" style={{ transform: `scaleX(${progress / 100})` }} />
                </div>
              )}
              <UploadCloud className="relative z-10 h-6 w-6" />
              <span className="relative z-10">{uploading ? `Manifesting ${Math.round(progress)}%` : 'Activate Manifest'}</span>
            </button>

            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.25em] text-white/35">Saves representative image, thumbnail, and product metadata to Firestore.</p>
          </div>

          {success && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
              Product successfully manifested into the sanctuary.
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};

const InventoryView = ({ wallpapers, categories }: { wallpapers: Wallpaper[], categories: Category[] }) => {
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);

  const handleDelete = async (wp: Wallpaper) => {
    if (confirm("Are you sure you want to remove this piece from the sanctuary?")) {
      try {
        // 1. Delete from Storage
        // We use the full URL to get the reference
        const thumbRef = ref(storage, wp.thumbnailUrl);
        const imageRef = ref(storage, wp.imageUrl);
        
        try {
          await deleteObject(thumbRef);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.error("Error deleting from storage:", storageError);
        }

        // 2. Delete from Firestore
        await deleteDoc(doc(db, 'products', wp.id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const toggleStatus = async (wp: Wallpaper) => {
    try {
      await updateDoc(doc(db, 'products', wp.id), { isActive: !wp.isActive });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Sanctuary Inventory</h1>
          <p className="text-white/40 mt-3 text-lg font-light italic">Manage the talismans currently dwelling in the gallery.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">{wallpapers.length} Talismans</span>
        </div>
      </header>

      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Talisman</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Energy</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Exchange</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Essence</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {wallpapers.map((wp) => (
              <tr key={wp.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-gold/30 transition-all">
                      <img src={wp.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors">{wp.title_en}</p>
                      <p className="text-[10px] text-white/40 font-light italic font-sans">{wp.title_ko}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{wp.category}</span>
                </td>
                <td className="px-10 py-6">
                  <span className="text-lg font-serif font-bold text-gold">${wp.price.toFixed(2)}</span>
                </td>
                <td className="px-10 py-6">
                  <button 
                    onClick={() => toggleStatus(wp)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all border",
                      wp.isActive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {wp.isActive ? 'LIVE' : 'HIDDEN'}
                  </button>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <button 
                      onClick={() => setEditingWallpaper(wp)}
                      className="p-3 text-white/20 hover:text-gold hover:bg-gold/10 rounded-xl transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(wp)}
                      className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingWallpaper && (
          <EditModal 
            wallpaper={editingWallpaper} 
            categories={categories}
            onClose={() => setEditingWallpaper(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EditModal = ({ wallpaper, categories, onClose }: { wallpaper: Wallpaper, categories: Category[], onClose: () => void }) => {
  const [formData, setFormData] = useState({
    slug: wallpaper.slug,
    title_ko: wallpaper.title_ko,
    title_en: wallpaper.title_en,
    category: wallpaper.category,
    price: wallpaper.price.toString(),
    description_ko: wallpaper.description_ko || '',
    description_en: wallpaper.description_en || '',
    locked: wallpaper.locked,
    featured: wallpaper.featured,
    sortOrder: wallpaper.sortOrder.toString(),
    artist: wallpaper.artist || ''
  });
  const [saving, setSaving] = useState(false);

  const [spaceMockupFile, setSpaceMockupFile] = useState<File | null>(null);
  const [focusMockupFile, setFocusMockupFile] = useState<File | null>(null);
  const [pocketMockupFile, setPocketMockupFile] = useState<File | null>(null);
  
  const [spacePreview, setSpacePreview] = useState<string | null>(wallpaper.mockups?.space?.imageUrl || null);
  const [focusPreview, setFocusPreview] = useState<string | null>(wallpaper.mockups?.focus?.imageUrl || null);
  const [pocketPreview, setPocketPreview] = useState<string | null>(wallpaper.mockups?.pocket?.imageUrl || null);

  const setPreviewFromFile = (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSpaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setSpaceMockupFile, setSpacePreview);
    }
  };

  const handleFocusFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setFocusMockupFile, setFocusPreview);
    }
  };

  const handlePocketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith('image/')) {
      setPreviewFromFile(selected, setPocketMockupFile, setPocketPreview);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let mockups: any = { ...wallpaper.mockups };
      const timestamp = Date.now();
      
      if (spaceMockupFile) {
        const spaceRef = ref(storage, `products/${timestamp}_space_${spaceMockupFile.name}`);
        const spaceSnap = await uploadBytes(spaceRef, spaceMockupFile);
        mockups.space = { imageUrl: await getDownloadURL(spaceSnap.ref) };
      }
      if (focusMockupFile) {
        const focusRef = ref(storage, `products/${timestamp}_focus_${focusMockupFile.name}`);
        const focusSnap = await uploadBytes(focusRef, focusMockupFile);
        mockups.focus = { imageUrl: await getDownloadURL(focusSnap.ref) };
      }
      if (pocketMockupFile) {
        const pocketRef = ref(storage, `products/${timestamp}_pocket_${pocketMockupFile.name}`);
        const pocketSnap = await uploadBytes(pocketRef, pocketMockupFile);
        mockups.pocket = { imageUrl: await getDownloadURL(pocketSnap.ref) };
      }

      // clean up empty mockups
      if (!mockups.space?.imageUrl) delete mockups.space;
      if (!mockups.focus?.imageUrl) delete mockups.focus;
      if (!mockups.pocket?.imageUrl) delete mockups.pocket;

      await updateDoc(doc(db, 'products', wallpaper.id), {
        slug: formData.slug,
        title_ko: formData.title_ko,
        title_en: formData.title_en,
        category: formData.category,
        price: parseFloat(formData.price),
        description_ko: formData.description_ko,
        description_en: formData.description_en,
        locked: formData.locked,
        featured: formData.featured,
        sortOrder: parseInt(formData.sortOrder),
        artist: formData.artist,
        ...(Object.keys(mockups).length > 0 ? { mockups } : {})
      });
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-deep-black/90 backdrop-blur-3xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-charcoal w-full max-w-2xl rounded-[3rem] p-10 lg:p-14 shadow-2xl border border-white/10 my-auto"
      >
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-3xl font-serif font-bold text-white">Refine Product</h3>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">상품명 (영문)</label>
              <input 
                required
                type="text" 
                value={formData.title_en}
                onChange={e => setFormData({...formData, title_en: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">상품명 (KO)</label>
              <input 
                required
                type="text" 
                value={formData.title_ko}
                onChange={e => setFormData({...formData, title_ko: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white focus:border-gold/50 outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">슬러그 (URL 식별자)</label>
              <input 
                type="text" 
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white/60 focus:border-gold/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">아티스트</label>
              <input 
                type="text" 
                value={formData.artist}
                onChange={e => setFormData({...formData, artist: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white/60 focus:border-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">카테고리</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white focus:border-gold/50 outline-none transition-all appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} className="bg-charcoal">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">가격 (USD)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">정렬 순서</label>
              <input 
                type="number" 
                value={formData.sortOrder}
                onChange={e => setFormData({...formData, sortOrder: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">설명 (영문)</label>
            <textarea 
              rows={2}
              value={formData.description_en}
              onChange={e => setFormData({...formData, description_en: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white/80 focus:border-gold/50 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">설명 (KO)</label>
            <textarea 
              rows={2}
              value={formData.description_ko}
              onChange={e => setFormData({...formData, description_ko: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white/80 focus:border-gold/50 outline-none transition-all resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setFormData({...formData, locked: !formData.locked})}
              className={cn(
                "h-12 rounded-xl text-[10px] font-bold transition-all border",
                formData.locked ? "bg-gold/20 border-gold/40 text-gold" : "bg-white/5 border-white/10 text-white/20"
              )}
            >
              LOCKED: {formData.locked ? 'YES' : 'NO'}
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, featured: !formData.featured})}
              className={cn(
                "h-12 rounded-xl text-[10px] font-bold transition-all border",
                formData.featured ? "bg-gold/20 border-gold/40 text-gold" : "bg-white/5 border-white/10 text-white/20"
              )}
            >
              FEATURED: {formData.featured ? 'YES' : 'NO'}
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Usage Mockups</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/60 text-center block">공간 연출 이미지 (Space)</label>
                <button type="button" onClick={() => document.getElementById('edit-space-upload')?.click()} className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {spacePreview ? (
                    <>
                      <img src={spacePreview} alt="Space preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                      <UploadCloud className="h-5 w-5 text-white/40" />
                      <p className="text-[8px] uppercase tracking-[0.1em] text-white/30">벽 액자 / 캔버스</p>
                    </div>
                  )}
                </button>
                <input id="edit-space-upload" type="file" accept="image/*" onChange={handleSpaceFileChange} className="hidden" />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/60 text-center block">작업 화면 이미지 (Focus)</label>
                <button type="button" onClick={() => document.getElementById('edit-focus-upload')?.click()} className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {focusPreview ? (
                    <>
                      <img src={focusPreview} alt="Focus preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                      <UploadCloud className="h-5 w-5 text-white/40" />
                      <p className="text-[8px] uppercase tracking-[0.1em] text-white/30">모니터 / 데스크</p>
                    </div>
                  )}
                </button>
                <input id="edit-focus-upload" type="file" accept="image/*" onChange={handleFocusFileChange} className="hidden" />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-[0.2em] text-white/60 text-center block">부적 이미지 (Pocket)</label>
                <button type="button" onClick={() => document.getElementById('edit-pocket-upload')?.click()} className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
                  {pocketPreview ? (
                    <>
                      <img src={pocketPreview} alt="Pocket preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-deep-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-gold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                      <UploadCloud className="h-5 w-5 text-white/40" />
                      <p className="text-[8px] uppercase tracking-[0.1em] text-white/30">카드 / 부적</p>
                    </div>
                  )}
                </button>
                <input id="edit-pocket-upload" type="file" accept="image/*" onChange={handlePocketFileChange} className="hidden" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-16 rounded-2xl font-bold text-white/40 uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-2 h-16 bg-gold text-deep-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-[0_0_30px_rgba(219,198,126,0.2)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Refine Manifestation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CategoriesView = ({ categories }: { categories: Category[] }) => {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'categories'), { name: newName.trim() });
      setNewName('');
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Dissolve this energy category? This will not remove the talismans within it.")) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Energy Domains</h1>
        <p className="text-white/40 mt-3 text-lg font-light italic">Define the mystical themes that organize the sanctuary.</p>
      </header>

      <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <form onSubmit={handleAdd} className="flex gap-6">
          <input 
            required
            type="text" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New Domain Name (e.g. Cosmic Harmony)"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
          />
          <button 
            disabled={adding}
            className="px-10 bg-gold text-deep-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(219,198,126,0.2)]"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Manifest'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between group hover:border-gold/30 transition-all backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 group-hover:shadow-[0_0_15px_rgba(219,198,126,0.2)] transition-all">
                <Grid className="w-6 h-6 text-gold" />
              </div>
              <span className="font-serif font-bold text-xl text-white group-hover:text-gold transition-colors">{cat.name}</span>
            </div>
            <button 
              onClick={() => handleDelete(cat.id)}
              className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/20 italic">
            No energy domains have been manifested yet.
          </div>
        )}
      </div>
    </div>
  );
};

const UsersView = ({ users }: { users: any[] }) => {
  const toggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'client' : 'admin';
    if (user.email === 'buzasun@gmail.com') {
      alert("The primary Guardian's role cannot be altered.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Seekers of Light</h1>
        <p className="text-white/40 mt-3 text-lg font-light italic">Manage the souls who have entered the sanctuary.</p>
      </header>

      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Seeker</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Essence (Email)</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Status</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 group-hover:shadow-[0_0_15px_rgba(219,198,126,0.2)] transition-all overflow-hidden">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-gold" />}
                    </div>
                    <span className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors">{u.displayName || 'Anonymous Seeker'}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="text-sm text-white/40 font-light italic">{u.email}</span>
                </td>
                <td className="px-10 py-6">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border",
                    u.role === 'admin' ? "bg-gold/10 text-gold border-gold/20" : "bg-white/5 text-white/30 border-white/5"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <button 
                    onClick={() => toggleRole(u)}
                    className="text-[10px] font-bold text-gold uppercase tracking-widest hover:text-white transition-colors bg-gold/5 px-4 py-2 rounded-xl border border-gold/10 hover:border-gold/30"
                  >
                    Shift Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SalesView = ({ sales, wallpapers }: { sales: Sale[], wallpapers: Wallpaper[] }) => {
  // Process data for charts
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent';
    acc[date] = (acc[date] || 0) + sale.amount;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    revenue: salesByDate[date]
  })).reverse();

  const bestSellers = wallpapers.map(wp => ({
    title: wp.title_en,
    sales: sales.filter(s => s.wallpaper_id === wp.id).length
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Abundance Analytics</h1>
        <p className="text-white/40 mt-3 text-lg font-light italic">Track the flow of energy and prosperity within the sanctuary.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-serif font-bold mb-10 text-white">Revenue Manifestation</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid rgba(212, 175, 55, 0.2)', 
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-serif font-bold mb-10 text-white">Most Revered Art</h3>
          <div className="space-y-8">
            {bestSellers.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-white">{item.title}</span>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{item.sales} sales</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.sales / (bestSellers[0].sales || 1)) * 100}%` }}
                    className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                  />
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && <p className="text-white/20 text-center py-12 italic">No sales data yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-charcoal p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
        <h3 className="text-xl font-serif font-bold mb-10 text-white">Recent Exchanges</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Buyer</th>
                <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold">Exchange</th>
                <th className="px-10 py-6 text-[10px] uppercase tracking-[0.4em] font-bold text-gold text-right">Moment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-10 py-6 text-sm font-bold text-white">{sale.buyer_email}</td>
                  <td className="px-10 py-6 text-lg font-serif font-bold text-gold">${sale.amount.toFixed(2)}</td>
                  <td className="px-10 py-6 text-sm text-white/40 font-light italic text-right">
                    {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleString() : 'Just now'}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-10 py-20 text-center text-white/20 italic">No exchanges recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

