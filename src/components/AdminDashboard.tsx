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
  uploadBytesResumable, 
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
  title: string;
  category: string;
  price: number;
  description: string;
  thumb_url: string;
  high_res_url: string;
  created_at: any;
  status: 'active' | 'inactive';
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
    const qWallpapers = query(collection(db, 'wallpapers'), orderBy('created_at', 'desc'));
    const unsubscribeWallpapers = onSnapshot(qWallpapers, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper));
      setWallpapers(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching wallpapers:", error);
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
  const activeWallpapers = wallpapers.filter(w => w.status === 'active').length;

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
                  <img src={wp.thumb_url} className="w-full h-full object-cover rounded-2xl border border-white/10" />
                  <div className="absolute inset-0 bg-gold/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{wp.title}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{wp.category}</p>
                </div>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                  wp.status === 'active' ? "bg-gold/10 text-gold border-gold/20" : "bg-white/5 text-white/30 border-white/5"
                )}>
                  {wp.status}
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
  const [file, setFile] = useState<File | null>(null);
  const [highResFile, setHighResFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Wealth',
    price: '7.77',
    artist: 'Aura AI',
    description: ''
  });
  const [success, setSuccess] = useState(false);

  const ADMIN_CATEGORIES = ["Wealth", "Love", "Success", "Peace"];

  useEffect(() => {
    if (!formData.category) {
      setFormData(prev => ({ ...prev, category: ADMIN_CATEGORIES[0] }));
    }
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const generateThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, 'image/webp', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setProgress(0);

    try {
      console.log("Starting upload process...");
      const timestamp = Date.now();
      
      // 1. Generate Thumbnail
      console.log("Generating thumbnail...");
      const thumbBlob = await generateThumbnail(file);
      console.log("Thumbnail generated.");
      
      // 2. Determine High Res File
      const fileToUploadAsHighRes = highResFile || file;
      console.log("High-res file selected:", fileToUploadAsHighRes.name);
      
      // 3. Upload High Res
      const highResRef = ref(storage, `talisman-images/${timestamp}_original_${fileToUploadAsHighRes.name}`);
      console.log("High-res ref created:", highResRef.fullPath);
      
      // Use uploadBytes for a more robust upload in this environment
      console.log("Starting high-res upload...");
      const highResSnapshot = await uploadBytes(highResRef, fileToUploadAsHighRes);
      console.log("High-res uploaded.");
      setProgress(50);

      // 4. Upload Thumbnail
      const thumbRef = ref(storage, `talisman-images/${timestamp}_thumb_${file.name.split('.')[0]}.webp`);
      console.log("Thumb ref created:", thumbRef.fullPath);
      
      console.log("Starting thumbnail upload...");
      const thumbSnapshot = await uploadBytes(thumbRef, thumbBlob);
      console.log("Thumbnail uploaded.");
      setProgress(100);

      const highResURL = await getDownloadURL(highResSnapshot.ref);
      const thumbURL = await getDownloadURL(thumbSnapshot.ref);
      
      // Save to Firestore
      console.log("Saving to Firestore...");
      await addDoc(collection(db, 'wallpapers'), {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price),
        artist: formData.artist,
        description: formData.description,
        thumb_url: thumbURL,
        high_res_url: highResURL,
        created_at: serverTimestamp(),
        status: 'active'
      });
      console.log("Firestore document saved.");

      setUploading(false);
      setSuccess(true);
      setFile(null);
      setHighResFile(null);
      setPreview(null);
      setFormData({ title: '', category: ADMIN_CATEGORIES[0], price: '7.77', artist: 'Aura AI', description: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Upload error details:", error);
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">Manifest New Art</h1>
        <p className="text-white/40 mt-3 text-lg font-light italic">Bring a new talisman into the digital sanctuary.</p>
      </header>

      <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Talisman Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Ethereal Bloom"
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Artist / Channeler</label>
            <input 
              required
              type="text" 
              value={formData.artist}
              onChange={e => setFormData({...formData, artist: e.target.value})}
              placeholder="e.g. Elena Rossi"
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Energy Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all appearance-none"
              >
                {ADMIN_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-charcoal">{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Energy Exchange ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Spiritual Meaning (Description)</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the mystical story or blessing message..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-gold/50 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">High-Res File (Optional)</label>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => document.getElementById('high-res-upload')?.click()}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white/40 text-xs uppercase tracking-widest font-bold hover:border-gold/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {highResFile ? highResFile.name : 'Select High-Res File'}
              </button>
              {highResFile && (
                <button 
                  type="button"
                  onClick={() => setHighResFile(null)}
                  className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <input 
              id="high-res-upload"
              type="file" 
              accept="image/*"
              onChange={(e) => setHighResFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <button 
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-gold text-deep-black h-18 rounded-2xl font-bold uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_30px_rgba(219,198,126,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            {uploading && (
              <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                <div className="w-full h-full bg-gold/20 origin-left transition-transform duration-300" style={{ transform: `scaleX(${progress/100})` }} />
              </div>
            )}
            <UploadCloud className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{uploading ? `Manifesting ${Math.round(progress)}%` : 'Manifest Talisman'}</span>
          </button>

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-center text-xs uppercase tracking-widest font-bold"
            >
              Talisman Successfully Manifested!
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Artwork Preview</label>
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative aspect-[9/16] rounded-[3rem] border-2 border-dashed transition-all duration-500 overflow-hidden flex flex-col items-center justify-center group cursor-pointer",
              isDragging 
                ? "border-gold bg-gold/10 scale-[0.98]" 
                : "border-white/10 bg-white/5 hover:border-gold/30"
            )}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-deep-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white bg-gold/20 px-6 py-3 rounded-full backdrop-blur-md border border-gold/30">Change Artwork</span>
                </div>
              </>
            ) : (
              <div className="text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 group-hover:border-gold/30 transition-all">
                  <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-gold transition-colors" />
                </div>
                <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">Drop your high-res <br /> talisman here</p>
              </div>
            )}
            <input 
              id="file-upload"
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
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
        const thumbRef = ref(storage, wp.thumb_url);
        const highResRef = ref(storage, wp.high_res_url);
        
        try {
          await deleteObject(thumbRef);
          await deleteObject(highResRef);
        } catch (storageError) {
          console.error("Error deleting from storage:", storageError);
          // Continue with Firestore deletion even if storage fails (maybe files were already gone)
        }

        // 2. Delete from Firestore
        await deleteDoc(doc(db, 'wallpapers', wp.id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const toggleStatus = async (wp: Wallpaper) => {
    const newStatus = wp.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'wallpapers', wp.id), { status: newStatus });
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
                      <img src={wp.thumb_url} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors">{wp.title}</p>
                      <p className="text-xs text-white/40 font-light italic">{wp.artist}</p>
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
                      wp.status === 'active' 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {wp.status}
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
    title: wallpaper.title,
    category: wallpaper.category,
    price: wallpaper.price.toString(),
    artist: wallpaper.artist || '',
    description: wallpaper.description || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'wallpapers', wallpaper.id), {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price),
        artist: formData.artist,
        description: formData.description
      });
      onClose();
    } catch (error) {
      console.error("Error updating wallpaper:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-deep-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-charcoal w-full max-w-md rounded-[3rem] p-12 shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-3xl font-serif font-bold text-white">Refine Talisman</h3>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Talisman Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Artist / Channeler</label>
            <input 
              required
              type="text" 
              value={formData.artist}
              onChange={e => setFormData({...formData, artist: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Energy Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} className="bg-charcoal">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Exchange ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold">Spiritual Meaning (Description)</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-gold/50 outline-none transition-all resize-none"
            />
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
              {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Talisman'}
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
    title: wp.title,
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
