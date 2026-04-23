import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Grid, 
  Library, 
  Search, 
  ShoppingCart, 
  Download, 
  X, 
  Smartphone, 
  Monitor,
  CheckCircle2,
  Heart,
  ArrowLeft,
  ArrowRight,
  LogIn,
  ShieldCheck,
  Loader2,
  Lock,
  Frame,
  Gem
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Masonry from 'react-masonry-css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { WALLPAPERS, Wallpaper, CATEGORIES } from './constants';
import { cn } from './lib/utils';
import { 
  db, 
  auth, 
  googleProvider 
} from './firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { AdminDashboard } from './components/AdminDashboard';

// --- Types & Constants ---

const ADMIN_EMAIL = "buzasun@gmail.com";
const TAB_PATHS: Record<string, string> = {
  Home: '/',
  Frequencies: '/frequencies',
  About: '/about',
  FAQ: '/faq',
  Privacy: '/privacy',
  Terms: '/terms',
  Contact: '/contact',
  'My Library': '/library',
};

const getTabFromPath = (pathname: string) => {
  switch (pathname) {
    case '/frequencies':
      return 'Frequencies';
    case '/about':
      return 'About';
    case '/faq':
      return 'FAQ';
    case '/privacy':
      return 'Privacy';
    case '/terms':
      return 'Terms';
    case '/contact':
      return 'Contact';
    case '/library':
      return 'My Library';
    default:
      return 'Home';
  }
};

const LANGUAGES = {
  EN: {
    brand: "AuraCanvas",
    tagline: "The Digital Sanctuary of Intent",
    heroTitle: "This is not just art. <br /> Choose what you want to <span class='aura-gold-text'>attract.</span>",
    heroSubtitle: "Premium digital ritual tools designed to align your consciousness with the vibrations of Abundance, Love, and Energy.",
    enterGallery: "Enter the Gallery",
    categoryAll: "All Frequencies",
    acquisition: "Activation",
    acquirePiece: "Begin Activation",
    investment: "Energy Exchange",
    downloadArt: "Activate Frequency",
    successTitle: "The Alignment is Complete",
    successSubtitle: "Your ritual art is now synchronized with your intent. Choose your mode of activation below.",
    footerText: "Premium digital art designed to align your space,\nyour focus, and your energy.",
    copyright: "© 2026 AuraCanvas. Manifested with Intent.",
    adminPanel: "Gallery Control",
    signIn: "Connect Soul",
    signOut: "Disconnect",
    categories: "Frequencies",
    myLibrary: "My Sanctuary",
    home: "Gallery"
  },
  KO: {
    brand: "AuraCanvas",
    tagline: "의도가 깃든 디지털 성소",
    heroTitle: "이건 단순한 이미지가 아닙니다. <br /> <span class='whitespace-nowrap'>당신의 <span class='aura-gold-text'>투사체를</span> 선택하세요.</span>",
    heroSubtitle: "당신의 의식을 풍요, 사랑, 에너지의 파동과 정렬하도록 설계된 프리미엄 디지털 의식 도구입니다.",
    enterGallery: "갤러리 입장하기",
    categoryAll: "모든 주파수",
    acquisition: "활성화",
    acquirePiece: "의식 시작하기",
    investment: "에너지 교환",
    downloadArt: "주파수 완성",
    successTitle: "정렬이 완료되었습니다",
    successSubtitle: "작품이 당신의 의도와 동기화되었습니다. 아래에서 완성 방식을 선택하세요.",
    footerText: "의식 있는 영혼을 위한 프리미엄 디지털 아트. 모든 점은 기도이며, 모든 선은 정렬입니다.",
    copyright: "© 2026 AuraCanvas. 현실로 구현.",
    adminPanel: "갤러리 관리",
    signIn: "영혼 연결",
    signOut: "연결 해제",
    categories: "에너지 주파수",
    myLibrary: "나의 성소",
    home: "갤러리"
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, user, onLogin, onAdminToggle, isAdminView, lang }: { 
  activeTab: string, 
  setActiveTab: (t: string) => void,
  user: User | null,
  onLogin: () => void,
  onAdminToggle: () => void,
  isAdminView: boolean,
  lang: any
}) => {
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className={cn(
        "hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-deep-black/80 backdrop-blur-md z-50 items-center justify-between px-12 transition-all duration-700",
        isScrolled 
          ? "border-b border-gold/20 shadow-[0_15px_40px_-10px_rgba(201,169,91,0.2)]" 
          : "border-b border-gold/5 shadow-none"
      )}>
        <div className="flex items-center gap-3 cursor-pointer group/logo" onClick={() => { setActiveTab('Home'); if(isAdminView) onAdminToggle(); }}>
          <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30 animate-pulse-gold group-hover/logo:shadow-[0_0_20px_rgba(219,198,126,0.4)] transition-all duration-500">
            <ShieldCheck className="text-gold w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover/logo:text-gold transition-colors duration-500">{lang.brand}</span>
        </div>
        <div className="flex items-center gap-10">
          {[
            { id: 'Home', label: "HOME" },
            { id: 'Frequencies', label: "FREQUENCIES" },
            { id: 'About', label: "ABOUT AURA" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(isAdminView) onAdminToggle(); }}
              className={cn(
                "text-xs uppercase tracking-[0.2em] font-medium transition-all hover:text-gold",
                activeTab === item.id && !isAdminView ? "text-gold border-b border-gold pb-1" : "text-white/60"
              )}
            >
              {item.label}
            </button>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 text-white/40 hover:text-gold"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              {lang.adminPanel}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-6">
          <button className="p-2 hover:text-gold transition-colors text-white/60">
            <Search className="w-5 h-5" />
          </button>
          {user ? (
            <div className="flex items-center gap-4">
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-gold/20" />
              <button onClick={() => signOut(auth)} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-gold">{lang.signOut}</button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={onLogin} 
              className="flex items-center gap-2 bg-gold text-deep-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all"
            >
              <LogIn className="w-3 h-3" />
              {lang.signIn}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-deep-black border-t border-gold/10 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {[
          { id: 'Home', icon: Home, label: "HOME" },
          { id: 'Frequencies', icon: Grid, label: "FREQUENCIES" },
          { id: 'About', icon: Heart, label: "ABOUT AURA" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if(isAdminView) onAdminToggle(); }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-full h-full min-h-[48px] transition-all duration-300",
              activeTab === item.id && !isAdminView ? "text-gold" : "text-white/40"
            )}
          >
            {activeTab === item.id && !isAdminView && (
              <motion.div 
                layoutId="mobile-nav-glow"
                className="absolute inset-0 bg-gold/5 blur-xl rounded-full"
              />
            )}
            <item.icon className="w-5 h-5 relative z-10" />
            <span className="text-[9px] uppercase tracking-widest font-medium relative z-10">{item.label}</span>
          </button>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full min-h-[48px] text-white/40"
            )}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-widest font-medium">Admin</span>
          </Link>
        )}
      </nav>
    </>
  );
};

const MockupOverlay = ({ 
  wallpaper, 
  onClose, 
  onPurchase,
  lang,
  user,
  isPurchasing,
  setIsPurchasing,
  handlePurchaseSuccess,
  currentLang,
  isUnlocked
}: { 
  wallpaper: Wallpaper, 
  onClose: () => void,
  onPurchase: () => void,
  lang: any,
  user: User | null,
  isPurchasing: boolean,
  setIsPurchasing: (v: boolean) => void,
  handlePurchaseSuccess: (wp: Wallpaper) => void,
  currentLang: string,
  isUnlocked: boolean,
  description?: string;
  ritual_steps?: string[];
  mockups?: {
    space?: { imageUrl: string };
    focus?: { imageUrl: string };
    pocket?: { imageUrl: string };
  };
}) => {
  const handleReturnToGallery = () => {
    if (window.history.state?.auraMockupOpen) {
      window.history.back();
      return;
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-deep-black/98 backdrop-blur-xl flex flex-col items-center justify-start overflow-y-auto pt-20 pb-40"
    >
      <div className="fixed top-4 left-4 right-4 z-[115]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-deep-black/30 px-3 py-3 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <button
            onClick={handleReturnToGallery}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.26em] text-white/75 transition-all hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </button>

          <button 
            onClick={handleReturnToGallery}
            className="p-3 bg-white/5 rounded-full text-white hover:bg-gold/20 transition-colors border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      >
        <X className="w-6 h-6" />
      </button>

        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 w-full max-w-7xl px-6">
        {/* Radiating Aura Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-gold/5 rounded-full blur-[150px] animate-pulse-gold pointer-events-none" />

        {/* Phone Mockup - iPhone 15 Pro style */}
        <div className={cn(
          "aura-piece relative w-full max-w-[340px] aspect-[9/19.5] bg-charcoal rounded-[3.5rem] border-[12px] border-charcoal shadow-[0_60px_120px_rgba(0,0,0,0.9),0_0_60px_rgba(219,198,126,0.15)] overflow-hidden shrink-0 outline outline-1 outline-white/10 group/mockup hover:shadow-[0_60px_140px_rgba(0,0,0,1),0_0_100px_rgba(219,198,126,0.3)] transition-all duration-700",
          isUnlocked ? "is-unlocked" : "is-locked"
        )}>
          {/* Enhanced Aura Glow */}
          <div className="absolute inset-0 bg-gold/20 blur-[60px] rounded-[3rem] opacity-0 group-hover/mockup:opacity-100 transition-opacity duration-1000 animate-aura-float" />
          
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-charcoal rounded-b-2xl z-30 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/5 rounded-full" />
          </div>
          
          <img 
            src={wallpaper.thumbnailUrl} 
            alt="Mockup"
            className="aura-card-image w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          <div className="aura-unlock-flash" />
          <div className="aura-unlock-message">
            {currentLang === 'EN' ? 'Activation complete' : '활성화 완료'}
          </div>

          {wallpaper.locked && (
            <div className="aura-lock-overlay">
              <div className="aura-lock-seal">
                <ShieldCheck className="aura-lock-icon" />
              </div>
              <span className="relative z-10 text-[9px] font-bold uppercase tracking-[0.5em] text-gold/60">
                Energy Locked
              </span>
            </div>
          )}
          
          {/* Phone UI Overlay (Clock & Icons) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-20 px-8 z-20">
            <div className="text-center text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              <div className="text-8xl font-serif font-light mb-1 tracking-tight">11:11</div>
              <div className="text-[10px] uppercase tracking-[0.5em] opacity-60 font-bold">Manifesting Now</div>
            </div>
            
            <div className="w-full grid grid-cols-4 gap-4 mb-8 opacity-30">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-square bg-white/20 backdrop-blur-md rounded-2xl border border-white/10" />
              ))}
            </div>
          </div>

          {/* Bezel inner shadow */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-10" />
        </div>
        
        {/* Details & Info */}
        <div className="flex flex-col gap-10 text-white max-w-lg text-center lg:text-left">
          <div className="space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <span className="text-gold uppercase tracking-[0.5em] text-[10px] font-bold px-4 py-1.5 bg-gold/10 rounded-full border border-gold/20 animate-pulse-gold">
                {wallpaper.category} Activation
              </span>
            </div>
            <h2 className="text-6xl lg:text-7xl font-serif font-bold leading-[0.9] tracking-tight">
              {currentLang === 'EN' ? wallpaper.title_en : (wallpaper.title_ko || wallpaper.title_en)}
            </h2>
            <p className="text-white/50 leading-relaxed font-light text-xl italic max-w-md">
              This is not decoration. It is alignment.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold/60">Ritual Guide</h4>
            <ul className="space-y-3">
              <li className="flex gap-4 text-sm font-light text-white/50 text-left">
                <span className="text-gold font-serif italic">1.</span>
                <span>Set it as your background or place it in your space.</span>
              </li>
              <li className="flex gap-4 text-sm font-light text-white/50 text-left">
                <span className="text-gold font-serif italic">2.</span>
                <span>Pause for a moment.</span>
              </li>
              <li className="flex gap-4 text-sm font-light text-white/50 text-left">
                <span className="text-gold font-serif italic">3.</span>
                <span>Let the frequency settle into your awareness.</span>
              </li>
            </ul>
          </div>

          <div className="py-12 border-y border-white/10 space-y-10">
            <div className="text-center lg:text-left">
              <h3 className="text-[11px] uppercase tracking-[0.4em] font-bold gold-metal-text mb-3">Included in this activation</h3>
              <p className="text-sm font-light text-white/50">This activation includes all available formats for one complete experience.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-10">
              {/* Phone */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-gold/60" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest gold-metal-text">Phone</span>
                  <span className="block text-[8px] uppercase tracking-wider text-white/30 font-medium">Included Format</span>
                </div>
              </div>

              {/* Desktop */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-gold/60" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest gold-metal-text">Desktop</span>
                  <span className="block text-[8px] uppercase tracking-wider text-white/30 font-medium">Included Format</span>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Frame className="w-4 h-4 text-gold/60" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest gold-metal-text">Canvas</span>
                  <span className="block text-[8px] uppercase tracking-wider text-white/30 font-medium">Included Format</span>
                </div>
              </div>

              {/* Talisman */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Gem className="w-4 h-4 text-gold/60" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest gold-metal-text">Talisman</span>
                  <span className="block text-[8px] uppercase tracking-wider text-white/30 font-medium">Included Format</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Mockup Section */}
      <section className="aura-usage-section w-full max-w-7xl mx-auto px-6 mt-24 lg:mt-32 mb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">Where This Energy Lives</h2>
          <p className="text-gold/60 uppercase tracking-[0.3em] text-[10px]">The same energy, delivered across all included formats.</p>
        </div>

        <div className="aura-usage-grid">
          {/* Mockup Card 1: Canvas / Wall */}
          <div className="aura-usage-card group/usage flex flex-col min-h-[400px]">
            <div className="aura-usage-image w-full">
              {/* Wall Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-deep-black rounded-xl opacity-30" />
              {/* Canvas Frame */}
              <div className="relative w-[85%] max-w-[240px] aspect-[3/4] bg-charcoal shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-[3px] border-[#2A2A2A] rounded-sm group-hover/usage:-translate-y-2 transition-transform duration-500 overflow-hidden mx-auto mt-4">
                {/* Canvas Inner Image */}
                <div className="absolute inset-0 opacity-0 group-hover/usage:opacity-100 transition-opacity duration-700 blur-[4px] group-hover/usage:blur-0">
                  {wallpaper.mockups?.space?.imageUrl ? (
                    <img src={wallpaper.mockups.space.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Space Mockup" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center" />
                  )}
                </div>
                {/* Unified Lock Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
                  {/* Lock Seal - Retreats on hover */}
                  <div className="w-14 h-14 rounded-full bg-[rgba(20,16,24,0.58)] backdrop-blur-[12px] border border-[rgba(231,215,162,0.18)] flex items-center justify-center mb-5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] group-hover/usage:opacity-[0.42] group-hover/usage:scale-[0.94] transition-all duration-500 ease-out">
                    <ShieldCheck className="w-6 h-6 text-gold/80" />
                  </div>
                  {/* Lock Text - Reveals on hover */}
                  <span className="text-[11px] font-light uppercase tracking-[0.34em] opacity-0 group-hover/usage:opacity-100 translate-y-2 group-hover/usage:translate-y-0 transition-all duration-500 ease-out">
                    <span className="gold-metal-text">Canvas</span>
                  </span>
                </div>
                {/* Ambient Light */}
                <div className="absolute inset-x-0 -top-10 h-10 bg-gold/10 blur-xl rounded-full opacity-0 group-hover/usage:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>
            </div>
            <div className="aura-usage-content text-center mt-auto">
              <h3>Space Activation</h3>
              <p>Let your space quietly reflect the energy you are calling in.</p>
            </div>
          </div>

          {/* Mockup Card 2: Desktop / Monitor */}
          <div className="aura-usage-card group/usage flex flex-col min-h-[400px]">
            <div className="aura-usage-image w-full flex-col justify-end">
              {/* Desk Background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl opacity-30" />
              
              {/* Computer Assembly (Monitor + Stand) */}
              <div className="relative w-full mb-14 mx-auto mt-auto group-hover/usage:-translate-y-3 transition-transform duration-500 z-10 flex flex-col items-center">
                {/* Monitor Frame */}
                <div className="relative w-[90%] max-w-[280px] aspect-video bg-[#1A1A1A] rounded-md border-2 border-[#333] shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col">
                  <div className="absolute inset-0 opacity-0 group-hover/usage:opacity-100 transition-opacity duration-700 blur-[4px] group-hover/usage:blur-0">
                    {wallpaper.mockups?.focus?.imageUrl ? (
                      <img src={wallpaper.mockups.focus.imageUrl} className="absolute inset-0 w-full h-full object-cover z-10" alt="Focus Mockup" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-[rgba(20,16,24,0.58)] backdrop-blur-[12px] border border-[rgba(231,215,162,0.18)] flex items-center justify-center mb-5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] group-hover/usage:opacity-[0.42] group-hover/usage:scale-[0.94] transition-all duration-500 ease-out">
                      <ShieldCheck className="w-6 h-6 text-gold/80" />
                    </div>
                    <span className="text-[11px] font-light uppercase tracking-[0.34em] opacity-0 group-hover/usage:opacity-100 translate-y-2 group-hover/usage:translate-y-0 transition-all duration-500 ease-out">
                      <span className="gold-metal-text">Desktop</span>
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover/usage:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />
                </div>
                {/* Stand Neck & Base */}
                <div className="w-4 h-5 bg-[#2A2A2A] -mt-[2px]" />
                <div className="w-20 h-1.5 bg-[#3A3A3A] rounded-t-sm" />
              </div>
            </div>
            <div className="aura-usage-content text-center mt-auto">
              <h3>Focus Alignment</h3>
              <p>Stay connected to the frequency, even in your daily flow.</p>
            </div>
          </div>

          {/* Mockup Card 3: Talisman Card */}
          <div className="aura-usage-card group/usage flex flex-col min-h-[400px]">
            <div className="aura-usage-image w-full perspective-1000">
              {/* Table Surface */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent)] rounded-xl" />
              {/* Physical Card */}
              <div className="relative w-[70%] max-w-[200px] aspect-[2/3] bg-charcoal rounded-xl border border-gold/20 shadow-[15px_20px_40px_rgba(0,0,0,0.8)] rotate-[12deg] group-hover/usage:rotate-6 group-hover/usage:-translate-y-4 group-hover/usage:shadow-[20px_30px_50px_rgba(0,0,0,0.9)] transition-all duration-700 overflow-hidden mx-auto mt-8">
                 <div className="absolute inset-1 border-[2px] border-gold/10 rounded-lg pointer-events-none z-20" />
                 {/* Physical Card Content Image */}
                 <div className="absolute inset-0 opacity-0 group-hover/usage:opacity-100 transition-opacity duration-700 blur-[4px] group-hover/usage:blur-0">
                   {wallpaper.mockups?.pocket?.imageUrl ? (
                     <img src={wallpaper.mockups.pocket.imageUrl} className="absolute inset-0 w-full h-full object-cover z-10" alt="Pocket Mockup" />
                   ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent z-10" />
                    )}
                 </div>
                 {/* Unified Lock Overlay */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
                   {/* Lock Seal - Retreats on hover */}
                   <div className="w-14 h-14 rounded-full bg-[rgba(20,16,24,0.58)] backdrop-blur-[12px] border border-[rgba(231,215,162,0.18)] flex items-center justify-center mb-5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] group-hover/usage:opacity-[0.42] group-hover/usage:scale-[0.94] transition-all duration-500 ease-out">
                     <ShieldCheck className="w-6 h-6 text-gold/80" />
                   </div>
                   {/* Lock Text - Reveals on hover */}
                   <span className="text-[11px] font-light uppercase tracking-[0.34em] opacity-0 group-hover/usage:opacity-100 translate-y-2 group-hover/usage:translate-y-0 transition-all duration-500 ease-out">
                     <span className="gold-metal-text">Talisman</span>
                   </span>
                 </div>
                 {/* Gold Foil reflection */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover/usage:translate-x-full duration-1000 transition-transform pointer-events-none z-30" />
              </div>
            </div>
            <div className="aura-usage-content text-center mt-auto">
              <h3>Pocket Ritual</h3>
              <p>Carry the energy with you, wherever you go.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Bar (Glassmorphism) */}
      <div className="fixed bottom-0 left-0 right-0 z-[120] p-6 lg:p-10 bg-gradient-to-t from-deep-black via-deep-black/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-charcoal/60 backdrop-blur-3xl border border-gold/30 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-medium">Energy Exchange</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold gold-metal-heading">${wallpaper.price}</span>
              </div>
              <span className="text-[11px] mt-2 font-bold uppercase tracking-widest gold-metal-text">One-time purchase / All formats included</span>
            </div>
            
            <div className="w-full md:w-auto min-w-[240px] flex flex-col gap-2">
              <p className="text-center md:text-right text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">You already feel it. All formats are included.</p>
              {!isPurchasing ? (
                <button
                  onClick={() => setIsPurchasing(true)}
                  className="group/btn relative w-full bg-gold text-deep-black h-16 rounded-2xl font-bold uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_30px_rgba(219,198,126,0.4)] active:scale-95 overflow-hidden"
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full -translate-x-full group-hover/btn:animate-shimmer pointer-events-none" />
                  
                  <ShoppingCart className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{lang.acquirePiece}</span>
                </button>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <PayPalButtons 
                    style={{ layout: "horizontal", height: 55, shape: "pill", label: "pay", color: "gold" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          amount: {
                            currency_code: "USD",
                            value: wallpaper.price.toString(),
                          },
                        }],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (actions.order) {
                        await actions.order.capture();
                        handlePurchaseSuccess(wallpaper);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4 opacity-40">
            <ShieldCheck className="w-3 h-3 text-gold" />
            <span className="text-[8px] uppercase tracking-[0.3em] text-white">Secure Encrypted Alignment</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SuccessModal = ({ onClose, lang, wallpaper }: { onClose: () => void, lang: any, wallpaper: Wallpaper | null }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadSingle = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    if (!wallpaper) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const files = wallpaper.files || {
        phone: wallpaper.imageUrl,
        focus: wallpaper.imageUrl,
        space: wallpaper.imageUrl,
        pocket: wallpaper.imageUrl,
      };

      const fetchFile = async (url: string, name: string) => {
        if (!url) return;
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(name, blob);
        } catch (e) {
          console.warn("Could not fetch " + url + " for ZIP, falling back to direct download.");
          handleDownloadSingle(url, name);
        }
      };

      await Promise.all([
        fetchFile(files.phone || wallpaper.imageUrl, `${wallpaper.slug}_Phone.jpg`),
        fetchFile(files.focus || wallpaper.imageUrl, `${wallpaper.slug}_Focus.jpg`),
        fetchFile(files.space || wallpaper.imageUrl, `${wallpaper.slug}_Space.jpg`),
        fetchFile(files.pocket || wallpaper.imageUrl, `${wallpaper.slug}_Pocket.jpg`),
      ]);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${wallpaper.slug}_Complete_Set.zip`);
    } catch (error) {
      console.error("ZIP Generation failed", error);
      alert("Failed to generate ZIP. Files will be downloaded individually.");
      const files = wallpaper.files || {
        phone: wallpaper.imageUrl, focus: wallpaper.imageUrl, space: wallpaper.imageUrl, pocket: wallpaper.imageUrl
      };
      handleDownloadSingle(files.phone || wallpaper.imageUrl, `${wallpaper.slug}_Phone.jpg`);
      handleDownloadSingle(files.focus || wallpaper.imageUrl, `${wallpaper.slug}_Focus.jpg`);
      handleDownloadSingle(files.space || wallpaper.imageUrl, `${wallpaper.slug}_Space.jpg`);
      handleDownloadSingle(files.pocket || wallpaper.imageUrl, `${wallpaper.slug}_Pocket.jpg`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-deep-black/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,91,0.08),transparent_50%)] pointer-events-none" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
        className="relative max-w-2xl w-full py-16"
      >
        <div className="text-center mb-12 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20 shadow-[0_0_40px_rgba(219,198,126,0.15)]"
          >
            <ShieldCheck className="w-8 h-8 text-gold drop-shadow-[0_0_10px_rgba(219,198,126,0.5)]" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Activation Complete</h2>
          <p className="text-gold/80 uppercase tracking-[0.3em] text-[11px] font-bold">The energy is now yours.</p>
        </div>

        <div className="bg-charcoal/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative z-10 text-center mb-10">
            <h3 className="text-xl font-serif text-white mb-2">Your full set is ready.</h3>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.2em]">All formats are included in your activation.</p>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="w-full bg-gold text-deep-black h-16 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_30px_rgba(219,198,126,0.3)] mb-10 relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full -translate-x-full group-hover/btn:animate-shimmer pointer-events-none" />
            {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 relative z-10" />}
            <span className="relative z-10">{isZipping ? "Preparing Zip..." : "Download Complete Set (ZIP)"}</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {[
              { label: "Phone Ritual", desc: "Set as your daily background.", icon: Smartphone, key: "phone" },
              { label: "Focus Mode", desc: "Keep the frequency in your workspace.", icon: Monitor, key: "focus" },
              { label: "Space Activation", desc: "Print and place in your environment.", icon: Library, key: "space" },
              { label: "Pocket Ritual", desc: "Carry it with you.", icon: ShieldCheck, key: "pocket" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-gold/80 border border-gold/10">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-1">{item.label}</h4>
                    <p className="text-[9px] text-white/40 tracking-wider">{item.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadSingle(wallpaper?.files?.[item.key as keyof typeof wallpaper.files] || wallpaper?.imageUrl || '', `${wallpaper?.slug}_${item.label.replace(/\s+/g, '_')}.jpg`)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-8 mt-4 text-center">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold/80 mb-6">How to use this activation</h4>
            <ul className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
              {[
                { step: "1", text: "Choose where you want to place it." },
                { step: "2", text: "Take a brief moment to pause." },
                { step: "3", text: "Let the energy settle." }
              ].map((item, idx) => (
                <li key={idx} className="flex flex-col items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold font-serif italic flex items-center justify-center text-xs">{item.step}</span>
                  <span className="text-[10px] text-white/50 tracking-wide font-light max-w-[120px]">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue your journey
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Footer = ({ lang, currentLang, setLang, setActiveTab }: { lang: any, currentLang: string, setLang: (l: string) => void, setActiveTab: (tab: string) => void }) => {
  const footerTabMap: Record<string, string> = {
    About: 'About',
    FAQ: 'FAQ',
    Privacy: 'Privacy',
    Terms: 'Terms',
    Contact: 'Contact',
  };

  const handleFooterNavigate = (item: string) => {
    const targetTab = footerTabMap[item];
    if (!targetTab) return;

    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-charcoal border-t border-gold/10 pt-24 pb-32 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
              <ShieldCheck className="text-gold w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-3xl tracking-tight text-white">{lang.brand}</span>
          </div>
          <p className="max-w-sm whitespace-pre-line text-[15px] font-light leading-relaxed text-white/60 mb-10">
            {lang.footerText}
          </p>
          <div className="flex gap-6 text-white/40">
            {['Instagram', 'Pinterest', 'Twitter'].map(social => (
              <a key={social} href="#" className="text-[10px] uppercase tracking-[0.3em] hover:text-gold transition-colors">{social}</a>
            ))}
          </div>
        </div>
        
        <div>
          <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-8">
            <span className="gold-metal-text">Frequencies</span>
          </h5>
          <ul className="flex flex-col gap-4 text-xs font-light text-white/60">
            {['Abundance', 'Love', 'Energy', 'Healing'].map(item => (
              <li key={item}><a href="#" className="hover:text-gold transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-8">
            <span className="gold-metal-text">The Gallery</span>
          </h5>
          <ul className="flex flex-col gap-4 text-xs font-light text-white/60">
            {['About', 'FAQ', 'Privacy', 'Terms', 'Contact'].map(item => (
              <li key={item}>
                {item === 'About' || item === 'FAQ' || item === 'Privacy' || item === 'Terms' || item === 'Contact' ? (
                  <button
                    type="button"
                    onClick={() => handleFooterNavigate(item)}
                    className="hover:text-gold transition-colors"
                  >
                    {item}
                  </button>
                ) : (
                  <a href="#" className="hover:text-gold transition-colors">{item}</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">{lang.copyright}</p>
        
        {/* Language Switcher */}
        <div className="flex items-center gap-4 bg-deep-black/50 p-1 rounded-full border border-white/10">
          <button 
            onClick={() => setLang('EN')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
              currentLang === 'EN' ? "bg-gold text-deep-black" : "text-white/40 hover:text-white"
            )}
          >
            ENGLISH
          </button>
          <button 
            onClick={() => setLang('KO')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
              currentLang === 'KO' ? "bg-gold text-deep-black" : "text-white/40 hover:text-white"
            )}
          >
            한국어
          </button>
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] text-white/30">
          <span>Digital Soul</span>
          <span>Global Energy</span>
        </div>
      </div>
    </footer>
  );
};

const ContactSection = () => {
  return (
    <section className="px-6 pt-28 pb-24 lg:px-16 lg:pt-36 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-4xl text-center"
      >
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/8 shadow-[0_0_40px_rgba(201,169,91,0.08)]">
          <ShieldCheck className="h-6 w-6 text-gold" />
        </div>

        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em]">
          <span className="gold-metal-text">AuraCanvas Support</span>
        </p>
        <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight md:text-6xl">
          <span className="gold-metal-heading">Contact</span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-white/62 md:text-xl">
          We are here to support your journey.
        </p>

        <div className="relative overflow-hidden rounded-[2rem] border border-gold/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-8 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

          <p className="mx-auto max-w-xl text-base font-light leading-8 text-white/72 md:text-lg">
            For all inquiries, please contact us via email.
            <br />
            We typically respond within 24-48 hours.
          </p>

          <a
            href="mailto:buzasun@gmail.com"
            className="mx-auto mt-10 inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/12 px-8 py-4 font-medium text-gold transition-all duration-300 hover:border-gold/50 hover:bg-gold/18 hover:text-[#f7e6b7] hover:shadow-[0_0_30px_rgba(201,169,91,0.14)]"
          >
            buzasun@gmail.com
          </a>

          <p className="mx-auto mt-8 max-w-xl text-sm font-light leading-7 text-white/52">
            Please include your order details if your inquiry is related to a purchase.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-md border-t border-white/8 pt-10">
          <p className="font-serif text-2xl text-white">AuraCanvas</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.34em] text-gold/68">
            The digital sanctuary of intent.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

const FAQ_ITEMS = [
  {
    question: "What do I receive after purchase?",
    answer: "You will receive a full digital set including:",
    list: [
      "Phone wallpaper (mobile)",
      "Desktop version (focus mode)",
      "Printable artwork (space activation)",
      "Pocket talisman card"
    ]
  },
  {
    question: "Is this a physical product?",
    answer: "No. All products are digital downloads.",
    extra: "Nothing will be shipped."
  },
  {
    question: "Can I use this on multiple devices?",
    answer: "Yes. You can use the files across your personal devices."
  },
  {
    question: "Can I print the artwork?",
    answer: 'Yes. The "Space Activation" version is designed for printing.'
  },
  {
    question: "Will I receive all formats with one purchase?",
    answer: "Yes.",
    extra: "One-time purchase includes all formats."
  },
  {
    question: "Can I share the files?",
    answer: "No.",
    extra: "All files are for personal use only and may not be shared or resold."
  },
  {
    question: "Do you offer refunds?",
    answer: "Due to the nature of digital products, all sales are final."
  },
  {
    question: "How do I download my files?",
    answer: "After purchase, you will be redirected to a download page.",
    extra: "You may also receive access via email."
  },
  {
    question: "I lost my files. Can I download again?",
    answer: "Yes. You can access your files again through your activation page or contact support."
  }
];

const FAQSection = () => {
  return (
    <section className="px-6 pt-28 pb-24 lg:px-16 lg:pt-36 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-14 text-center">
          <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/8 shadow-[0_0_40px_rgba(201,169,91,0.08)]">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em]">
            <span className="gold-metal-text">AuraCanvas Guide</span>
          </p>
          <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight md:text-6xl">
            <span className="gold-metal-heading">FAQ</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/62 md:text-xl">
            Clear answers for a calm and confident purchase experience.
          </p>
        </div>

        <div className="space-y-5">
          {FAQ_ITEMS.map((item, index) => (
            <motion.article
              key={item.question}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-7 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
              <h2 className="mb-4 font-serif text-2xl text-white md:text-[1.85rem]">
                {item.question}
              </h2>
              <p className="text-base font-light leading-8 text-white/72">
                {item.answer}
              </p>
              {item.list && (
                <ul className="mt-5 space-y-3 text-white/64">
                  {item.list.map((listItem) => (
                    <li key={listItem} className="flex items-start gap-3 text-sm leading-7 md:text-[15px]">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/80" />
                      <span>{listItem}</span>
                    </li>
                  ))}
                </ul>
              )}
              {item.extra && (
                <p className="mt-4 text-sm font-light leading-7 text-gold/72 md:text-[15px]">
                  {item.extra}
                </p>
              )}
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative mt-8 overflow-hidden rounded-[1.9rem] border border-gold/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold/70">
            Contact
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base font-light leading-8 text-white/68">
            For any questions, please contact:
          </p>
          <a
            href="mailto:buzasun@gmail.com"
            className="mx-auto mt-6 inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/12 px-8 py-4 font-medium text-gold transition-all duration-300 hover:border-gold/50 hover:bg-gold/18 hover:text-[#f7e6b7] hover:shadow-[0_0_30px_rgba(201,169,91,0.14)]"
          >
            buzasun@gmail.com
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We may collect:",
    list: [
      "Email address",
      "Payment-related information (processed via PayPal or third-party services)"
    ],
    extra: "We do not store full payment details."
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to:",
    list: [
      "Deliver purchased digital products",
      "Provide customer support",
      "Improve our services"
    ]
  },
  {
    title: "3. Third-Party Services",
    body: "Payments are processed securely through third-party providers (e.g., PayPal).",
    extra: "We do not control how these services handle your data."
  },
  {
    title: "4. Data Protection",
    body: "We take reasonable measures to protect your information.",
    extra: "However, no method of transmission over the internet is 100% secure."
  },
  {
    title: "5. Cookies",
    body: "We may use cookies to improve your browsing experience."
  }
];

const PrivacySection = () => {
  return (
    <section className="px-6 pt-28 pb-24 lg:px-16 lg:pt-36 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-14 text-center">
          <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/8 shadow-[0_0_40px_rgba(201,169,91,0.08)]">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold/70">
            AuraCanvas Policy
          </p>
          <h1 className="mb-5 font-serif text-5xl font-bold tracking-tight text-white md:text-6xl">
            Privacy Policy
          </h1>
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">
            Last updated: April 23, 2026
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/62 md:text-xl">
            At AuraCanvas, your privacy is important to us.
          </p>
        </div>

        <div className="space-y-5">
          {PRIVACY_SECTIONS.map((section, index) => (
            <motion.article
              key={section.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-7 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
              <h2 className="mb-4 font-serif text-2xl text-white md:text-[1.85rem]">
                {section.title}
              </h2>
              <p className="text-base font-light leading-8 text-white/72">
                {section.body}
              </p>
              {section.list && (
                <ul className="mt-5 space-y-3 text-white/64">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-7 md:text-[15px]">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.extra && (
                <p className="mt-4 text-sm font-light leading-7 text-gold/72 md:text-[15px]">
                  {section.extra}
                </p>
              )}
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative mt-8 overflow-hidden rounded-[1.9rem] border border-gold/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold/70">
            6. Contact
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base font-light leading-8 text-white/68">
            If you have any questions about this policy, contact us at:
          </p>
          <a
            href="mailto:buzasun@gmail.com"
            className="mx-auto mt-6 inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/12 px-8 py-4 font-medium text-gold transition-all duration-300 hover:border-gold/50 hover:bg-gold/18 hover:text-[#f7e6b7] hover:shadow-[0_0_30px_rgba(201,169,91,0.14)]"
          >
            buzasun@gmail.com
          </a>
        </motion.div>

        <div className="mx-auto mt-14 max-w-md border-t border-white/8 pt-10 text-center">
          <p className="font-serif text-2xl text-white">AuraCanvas</p>
        </div>
      </motion.div>
    </section>
  );
};

const TERMS_SECTIONS = [
  {
    title: "1. Digital Products",
    body: "All products sold on this site are digital downloads. No physical items will be shipped."
  },
  {
    title: "2. Personal Use Only",
    body: "All purchases are for personal use only.",
    list: [
      "Resell, redistribute, or share the files",
      "Use the products for commercial resale",
      "Upload the files to any public platform"
    ],
    listIntro: "You may not:"
  },
  {
    title: "3. No Refund Policy",
    body: "Due to the nature of digital products, all sales are final.",
    extra: "Once a product has been accessed or downloaded, we do not offer refunds or exchanges."
  },
  {
    title: "4. No Guarantees",
    body: "Our products are designed as creative and inspirational tools.",
    extra: "We do not guarantee specific outcomes, results, or changes."
  },
  {
    title: "5. Intellectual Property",
    body: "All content, designs, and images are owned by AuraCanvas.",
    extra: "Unauthorized use, duplication, or distribution is strictly prohibited."
  },
  {
    title: "6. Limitation of Liability",
    body: "AuraCanvas is not responsible for any direct or indirect damages resulting from the use of our products."
  }
];

const TermsSection = () => {
  return (
    <section className="px-6 pt-28 pb-24 lg:px-16 lg:pt-36 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-14 text-center">
          <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/8 shadow-[0_0_40px_rgba(201,169,91,0.08)]">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.45em] text-gold/70">
            AuraCanvas Terms
          </p>
          <h1 className="mb-5 font-serif text-5xl font-bold tracking-tight text-white md:text-6xl">
            Terms
          </h1>
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">
            Last updated: April 23, 2026
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/62 md:text-xl">
            Welcome to AuraCanvas.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base font-light leading-8 text-white/56 md:text-lg">
            By purchasing or accessing our products, you agree to the following terms.
          </p>
        </div>

        <div className="space-y-5">
          {TERMS_SECTIONS.map((section, index) => (
            <motion.article
              key={section.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-7 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
              <h2 className="mb-4 font-serif text-2xl text-white md:text-[1.85rem]">
                {section.title}
              </h2>
              <p className="text-base font-light leading-8 text-white/72">
                {section.body}
              </p>
              {section.listIntro && (
                <p className="mt-4 text-sm font-light leading-7 text-white/62 md:text-[15px]">
                  {section.listIntro}
                </p>
              )}
              {section.list && (
                <ul className="mt-4 space-y-3 text-white/64">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-7 md:text-[15px]">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.extra && (
                <p className="mt-4 text-sm font-light leading-7 text-gold/72 md:text-[15px]">
                  {section.extra}
                </p>
              )}
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative mt-8 overflow-hidden rounded-[1.9rem] border border-gold/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold/70">
            7. Contact
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base font-light leading-8 text-white/68">
            If you have any questions, please contact us at:
          </p>
          <a
            href="mailto:buzasun@gmail.com"
            className="mx-auto mt-6 inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/12 px-8 py-4 font-medium text-gold transition-all duration-300 hover:border-gold/50 hover:bg-gold/18 hover:text-[#f7e6b7] hover:shadow-[0_0_30px_rgba(201,169,91,0.14)]"
          >
            buzasun@gmail.com
          </a>
        </motion.div>

        <div className="mx-auto mt-14 max-w-md border-t border-white/8 pt-10 text-center">
          <p className="font-serif text-2xl text-white">AuraCanvas</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.34em] text-gold/68">
            "The digital sanctuary of intent."
          </p>
        </div>
      </motion.div>
    </section>
  );
};

// --- Main App ---

function MainContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [currentLang, setCurrentLang] = useState('EN');
  const lang = LANGUAGES[currentLang as keyof typeof LANGUAGES];
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [showMockup, setShowMockup] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Firebase State
  const [user, setUser] = useState<User | null>(null);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(WALLPAPERS);
  const [categories, setCategories] = useState<{id: string, name: string}[]>(
    CATEGORIES.map((name, i) => ({ id: `cat-${i}`, name }))
  );
  const [loading, setLoading] = useState(true);
  const [myLibrary, setMyLibrary] = useState<Wallpaper[]>([]);
  const [recentlyUnlockedIds, setRecentlyUnlockedIds] = useState<string[]>([]);
  const frequenciesSectionRef = useRef<HTMLElement | null>(null);
  const gallerySectionRef = useRef<HTMLElement | null>(null);
  const currentPath = location.pathname.startsWith('/art/')
    ? (((location.state as { backgroundPath?: string } | null)?.backgroundPath) || '/')
    : location.pathname;
  const activeTab = getTabFromPath(currentPath);
  const setActiveTab = useCallback((tab: string) => {
    navigate(TAB_PATHS[tab] || '/', { state: null });
  }, [navigate]);

  const isWallpaperUnlocked = useCallback((wp: Wallpaper) => {
    if (!wp.locked) return true;
    if (recentlyUnlockedIds.includes(wp.id)) return true;
    return myLibrary.some((owned) => owned.id === wp.id);
  }, [myLibrary, recentlyUnlockedIds]);

  const handlePurchaseSuccess = async (wp: Wallpaper) => {
    if (!user) {
      alert("Please login to save your purchase to your library.");
    }
    
    try {
      // Record Order
      await addDoc(collection(db, 'orders'), {
        user_id: user?.uid || 'anonymous',
        wallpaper_id: wp.id,
        amount: wp.price,
        timestamp: serverTimestamp(),
        status: 'completed'
      });

      // Record Sale for Analytics
      await addDoc(collection(db, 'sales'), {
        wallpaper_id: wp.id,
        amount: wp.price,
        timestamp: serverTimestamp(),
        buyer_email: user?.email || 'anonymous'
      });

      // Automatically trigger download
      if (wp.imageUrl) {
        const link = document.createElement('a');
        link.href = wp.imageUrl;
        link.download = `${wp.title_en.replace(/\s+/g, '_')}_AuraCanvas.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setIsPurchasing(false);
      setRecentlyUnlockedIds((prev) => prev.includes(wp.id) ? prev : [...prev, wp.id]);

      setTimeout(() => {
        setIsSuccess(true);
      }, 950);

      setTimeout(() => {
        setRecentlyUnlockedIds((prev) => prev.filter((id) => id !== wp.id));
      }, 2600);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      // Fetch user's library if logged in
      if (u) {
        const qLibrary = query(collection(db, 'orders'), where('user_id', '==', u.uid));
        const unsubscribeLibrary = onSnapshot(qLibrary, (snapshot) => {
          const purchasedIds = snapshot.docs.map(doc => doc.data().wallpaper_id);
          const purchasedWallpapers = wallpapers.filter(wp => purchasedIds.includes(wp.id));
          setMyLibrary(purchasedWallpapers);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        });
        return () => unsubscribeLibrary();
      } else {
        setMyLibrary([]);
      }
    });
    return () => unsubscribe();
  }, [wallpapers]);

  useEffect(() => {
    const qCategories = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as {id: string, name: string}));
      if (docs.length > 0) {
        setCategories(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribeCategories();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'products'), 
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );
    
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper));
      if (docs.length > 0) {
        setWallpapers(docs);
      } else {
        setWallpapers(WALLPAPERS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e?: React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handlePullToRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const closeMockupOverlay = useCallback(() => {
    setShowMockup(false);
    setIsPurchasing(false);
    setSelectedWallpaper(null);
    if (slug) {
      const backgroundPath = (location.state as { backgroundPath?: string } | null)?.backgroundPath || '/';
      navigate(backgroundPath, { replace: true, state: null });
    }
  }, [slug, location.state, navigate]);

  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => { startY = e.touches[0].pageY; };
    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0].pageY > startY + 100 && !refreshing) {
        handlePullToRefresh();
      }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [refreshing, handlePullToRefresh]);

  const handleAuraMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty("--mx", `${x}px`);
    e.currentTarget.style.setProperty("--my", `${y}px`);
  };

  const resetAuraMove = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mx", `50%`);
    e.currentTarget.style.setProperty("--my", `50%`);
  };

  const openWallpaperDetail = useCallback((wp: Wallpaper) => {
    navigate(`/art/${wp.slug}`, {
      state: {
        backgroundPath: location.pathname,
      }
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/' && (location.state as { scrollToGallery?: boolean } | null)?.scrollToGallery) {
      requestAnimationFrame(() => {
        gallerySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      navigate('/', { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!slug) {
      setShowMockup(false);
      setSelectedWallpaper(null);
      setIsPurchasing(false);
      return;
    }

    const wallpaper = wallpapers.find((wp) => wp.slug === slug);
    if (wallpaper) {
      setSelectedWallpaper(wallpaper);
      setShowMockup(true);
      return;
    }

    if (!loading) {
      navigate('/', { replace: true });
    }
  }, [slug, wallpapers, loading, navigate]);

  return (
    <PayPalScriptProvider options={{ 
      "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "ATNUPKM6CKGqJaD7mEkPXmHWoZf_TYIY1F8Md2gwbFWmRSHwyKAmIzjrVJ2MZt4DI5QzZSTrfGvpKMJf",
      currency: "USD"
    }}>
      <div className="aura-site-bg min-h-screen text-white font-sans selection:bg-gold selection:text-deep-black">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          onLogin={handleLogin}
          onAdminToggle={() => {}}
          isAdminView={false}
          lang={lang}
        />

        <main className="relative z-10 pb-32">
          {activeTab === 'Home' && (
            <div className="relative">
              <section className="aura-hero" onMouseMove={handleAuraMove} onMouseLeave={resetAuraMove}>
                <div className="aura-hero-bg-flow" />
                <div className="aura-hero-aurora" />
                <div className="aura-hero-mist" />
                <div className="aura-hero-vignette" />
                <div className="aura-hero-ripple" />
                <div className="aura-hero-gold-trace" />
                <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 lg:pt-32 text-center lg:px-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                  >
                    <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-6 py-2 text-[10px] font-bold uppercase tracking-[0.6em] shadow-[0_0_20px_rgba(219,198,126,0.08)] backdrop-blur-xl">
                      <span className="h-2 w-2 rounded-full bg-gold/80" />
                      <span className="gold-metal-text">{lang.tagline}</span>
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-auto mb-10 max-w-5xl text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.06] tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)] break-keep"
                    dangerouslySetInnerHTML={{ __html: lang.heroTitle }}
                  />

                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mx-auto mb-14 max-w-3xl text-lg font-light leading-relaxed text-white/62 lg:text-2xl"
                  >
                    {lang.heroSubtitle}
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => {
                      requestAnimationFrame(() => {
                        gallerySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    }}
                    className="aura-gold-btn group mx-auto"
                  >
                    <span className="relative z-10 flex items-center gap-4">
                      {lang.enterGallery}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                    </span>
                  </motion.button>

                  <motion.div
                    ref={frequenciesSectionRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="mt-32 flex items-center justify-center gap-4 overflow-x-auto pb-2 no-scrollbar"
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setActiveTab('Home');
                      }}
                      className={cn(
                        "aura-ghost-btn whitespace-nowrap",
                        selectedCategory === 'All' && "active"
                      )}
                    >
                      {lang.categoryAll}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setActiveTab('Home');
                        }}
                        className={cn(
                          "aura-ghost-btn whitespace-nowrap",
                          selectedCategory === cat.name && "active"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </motion.div>
                </div>
              </section>

              <section id="gallery-start" ref={gallerySectionRef} className="aura-gallery-section">
                <div className="mx-auto max-w-[2000px] px-6 lg:px-16">
                {/* Pull to refresh indicator */}
                <AnimatePresence>
                  {refreshing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 60, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex items-center justify-center overflow-hidden mb-8"
                    >
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category Filter */}
                {/* Adaptive Masonry Grid */}
                <Masonry
                  breakpointCols={{
                    default: 4,
                    1536: 4,
                    1280: 4,
                    1024: 3,
                    768: 2,
                    500: 2
                  }}
                  className="flex w-auto -ml-6 lg:-ml-10"
                  columnClassName="pl-6 lg:pl-10 bg-clip-padding"
                >
                  {loading && wallpapers.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 gap-4">
                      <Loader2 className="w-10 h-10 text-gold animate-spin" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Manifesting Gallery...</p>
                    </div>
                  ) : (
                    wallpapers
                      .filter(wp => selectedCategory === 'All' || wp.category === selectedCategory)
                      .map((wp) => (
                      <motion.div
                        key={wp.id}
                        layoutId={`card-${wp.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onClick={() => {
                          openWallpaperDetail(wp);
                        }}
                        className="group relative flex flex-col gap-4 cursor-pointer mb-10"
                      >
                        {/* Premium Ritual Card Container */}
                        <div className={cn(
                          "aura-card aspect-[9/16] overflow-hidden",
                          isWallpaperUnlocked(wp) ? "is-unlocked" : "is-locked"
                        )}>
                          
                          {/* Artwork Image */}
                          <div className="aura-card-media w-full h-full">
                            <img
                              src={wp.thumbnailUrl}
                              alt={wp.title_en}
                              className="aura-card-image"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="aura-unlock-flash" />
                          <div className="aura-unlock-message">
                            {currentLang === 'EN' ? 'Activation complete' : '활성화 완료'}
                          </div>

                          {/* Golden Aura Mist Layer */}
                          <div className="aura-card-gold-aura" />
                          
                          {/* Premium Lock Overlay */}
                          {wp.locked && (
                            <div className="aura-lock-overlay">
                              <div className="aura-lock-seal">
                                <ShieldCheck className="aura-lock-icon" />
                              </div>
                              <span className="text-[9px] uppercase tracking-[0.5em] text-gold/60 font-bold relative z-10">
                                Energy Locked
                              </span>
                            </div>
                          )}

                          {/* Ambient Dark Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-deep-black/90 via-transparent to-transparent opacity-80" />
                          
                          {/* Price Badge - Top Right */}
                          <div className="aura-price-badge">
                            ${wp.price}
                          </div>

                          {/* Text Information - Bottom */}
                          <div className="absolute bottom-10 left-8 right-8 flex flex-col gap-2 z-10">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] uppercase tracking-[0.4em] text-gold/60 font-bold">{wp.category}</span>
                              {wp.featured && (
                                <span className="w-1 h-1 bg-gold rounded-full" />
                              )}
                              {wp.featured && (
                                <span className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-medium">Core Piece</span>
                              )}
                            </div>
                            <h3 className="font-serif font-bold text-2xl text-ivory leading-tight group-hover:text-white transition-colors">
                              {currentLang === 'EN' ? wp.title_en : wp.title_ko}
                            </h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
                              {currentLang === 'EN' ? 'Activation Art' : '의식 활성화 도구'}
                            </p>
                          </div>

                        </div>
                      </motion.div>
                    ))
                  )}
                </Masonry>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'Frequencies' && (
            <div className="px-6 lg:px-16 max-w-7xl mx-auto pt-36 pb-20">
              <div className="aura-page-aurora" />
              <h2 className="relative z-10 text-4xl font-serif font-bold mb-12 text-gold">Explore Energies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      navigate('/', { state: { scrollToGallery: true } });
                    }}
                    className="aura-frequency-card group relative h-64 rounded-[3rem] overflow-hidden border border-white/10 hover:border-gold/40 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <span className="text-3xl font-serif font-bold text-white group-hover:text-gold transition-colors">{cat.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">View Collection</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'About' && (
            <div className="px-6 lg:px-16 max-w-4xl mx-auto pt-40 pb-24 text-center">
              <div className="aura-page-aurora" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
                <h1 className="mb-10 font-serif text-5xl font-bold tracking-tight text-gold md:text-6xl">
                  ABOUT AURA
                </h1>
                <ShieldCheck className="w-8 h-8 text-gold mx-auto mb-6 opacity-80" />
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-relaxed">We believe reality begins within.</h2>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-12 text-white/60 font-light leading-relaxed text-base md:text-lg">
                <p>
                  There are moments in life when everything feels uncertain<br/>
                  love, money, direction, timing.
                </p>
                <p>
                  But beneath all of it, there is something deeper.<br/>
                  A quiet force that shapes everything you experience.
                </p>
                <p className="font-serif text-white/80 text-xl md:text-2xl">
                  Your awareness.<br/>
                  Your energy.<br/>
                  Your inner state.
                </p>
                <p>
                  Raising your awareness changes your reality.
                </p>
                <p>
                  When your level of consciousness shifts,<br/>
                  your decisions change.<br/>
                  Your perception changes.<br/>
                  And eventually?봸our life follows.
                </p>
                <p>
                  Not because something outside has changed,<br/>
                  but because you have.
                </p>
                <div className="w-12 h-[1px] bg-gold/20 mx-auto my-16" />
                <p>
                  AURACANVAS was created to make the invisible - visible.
                </p>
                <p>
                  We transform abstract inner states<br/>
                  energy, intention, emotional frequency<br/>
                  into visual forms you can see, feel, and connect with.
                </p>
                <p>
                  Each image is more than just art.<br/>
                  It is a symbol.<br/>
                  A focus point.<br/>
                  A tool for alignment.
                </p>
                <p>
                  A tool for your mind, your focus, your intention.
                </p>
                <p>
                  Some call it a placebo.<br/>
                  We call it a conscious trigger.
                </p>
                <p>
                  Because when you choose to focus your mind,<br/>
                  to hold an intention,<br/>
                  to believe in a possibility<br/>
                  your subconscious begins to move.
                </p>
                <p>
                  And when your inner world shifts,<br/>
                  your outer world has no choice but to follow.
                </p>
                <p className="font-serif text-white/90 text-xl md:text-2xl my-12">
                  <strong>This is not about magic.<br/>It is about direction.</strong>
                </p>
                <p>
                  AURACANVAS is designed for those who are ready to:<br/><br/>
                  shift their inner state<br/>
                  release limiting patterns<br/>
                  reconnect with their desired reality
                </p>
                <p>
                  Not by force,<br/>
                  but by alignment.
                </p>
                <p className="font-serif text-gold text-xl md:text-2xl my-12">
                  <strong>If you found this,<br/>you're already in the flow.</strong>
                </p>
                <p>
                  Not everyone will understand this space.<br/>
                  And that's okay.<br/><br/>
                  It is meant for those<br/>
                  who feel it.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  navigate('/', { state: { scrollToGallery: true } });
                }}
                className="mt-20 aura-gold-btn group mx-auto"
              >
                <span className="relative z-10 flex items-center gap-4">
                  Explore your energy
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </motion.button>
            </div>
          )}

          {activeTab === 'FAQ' && <FAQSection />}

          {activeTab === 'Privacy' && <PrivacySection />}

          {activeTab === 'Terms' && <TermsSection />}

          {activeTab === 'Contact' && <ContactSection />}

          {activeTab === 'My Library' && (
            <div className="px-6 lg:px-16 max-w-7xl mx-auto pt-20">
              <h2 className="text-4xl font-serif font-bold mb-12 text-gold">{lang.myLibrary}</h2>
              {myLibrary.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {myLibrary.map(wp => (
                    <div key={wp.id} className="flex flex-col gap-4">
                      <div className="relative aspect-[9/19] bg-charcoal rounded-[2.5rem] overflow-hidden border border-white/10">
                        <img src={wp.thumbnailUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-deep-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <button 
                            onClick={() => { setSelectedWallpaper(wp); setIsSuccess(true); }}
                            className="bg-gold text-deep-black px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <h3 className="font-serif font-bold text-white text-center">
                        {currentLang === 'EN' ? wp.title_en : (wp.title_ko || wp.title_en)}
                      </h3>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10">
                  <Library className="w-12 h-12 text-white/20 mx-auto mb-6" />
                  <p className="text-white/40 uppercase tracking-[0.3em] text-xs">Your sanctuary is empty.</p>
                  <button 
                    onClick={() => setActiveTab('Home')}
                    className="mt-8 text-gold text-[10px] uppercase tracking-[0.4em] font-bold hover:underline"
                  >
                    Acquire your first Talisman
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer lang={lang} currentLang={currentLang} setLang={setCurrentLang} setActiveTab={setActiveTab} />

        {/* Overlays */}
        <AnimatePresence>
          {showMockup && selectedWallpaper && (
            <MockupOverlay 
              wallpaper={selectedWallpaper} 
              onClose={closeMockupOverlay} 
              onPurchase={() => setIsPurchasing(true)}
              lang={lang}
              user={user}
              isPurchasing={isPurchasing}
              setIsPurchasing={setIsPurchasing}
              handlePurchaseSuccess={handlePurchaseSuccess}
              currentLang={currentLang}
              isUnlocked={isWallpaperUnlocked(selectedWallpaper)}
            />
          )}
        </AnimatePresence>



        <AnimatePresence>
          {isSuccess && selectedWallpaper && (
            <SuccessModal 
              onClose={() => {
                setIsSuccess(false);
                setSelectedWallpaper(null);
                setShowMockup(false);
                setIsPurchasing(false);
              }} 
              lang={lang} 
              wallpaper={selectedWallpaper}
            />
          )}
        </AnimatePresence>
      </div>
    </PayPalScriptProvider>
  );
}

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-black flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] uppercase tracking-[0.5em] text-gold animate-pulse">Aligning Gallery</span>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-deep-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mb-8 border border-gold/20 animate-pulse-gold">
          <ShieldCheck className="text-gold w-12 h-12" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-4 text-white">Gallery Control</h1>
        <p className="text-white/40 mb-12 max-w-md font-light italic">Only the Guardian of the Gallery may enter this space.</p>
        <button 
          type="button"
          onClick={handleLogin}
          className="bg-gold text-deep-black px-12 py-5 rounded-full text-xs uppercase tracking-[0.4em] font-bold hover:bg-white transition-all shadow-[0_0_30px_rgba(219,198,126,0.4)]"
        >
          Connect Guardian Soul
        </button>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => signOut(auth)} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<MainContent />} />
        <Route path="/frequencies" element={<MainContent />} />
        <Route path="/about" element={<MainContent />} />
        <Route path="/faq" element={<MainContent />} />
        <Route path="/privacy" element={<MainContent />} />
        <Route path="/terms" element={<MainContent />} />
        <Route path="/contact" element={<MainContent />} />
        <Route path="/library" element={<MainContent />} />
        <Route path="/art/:slug" element={<MainContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
