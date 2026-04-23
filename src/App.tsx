import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Masonry from 'react-masonry-css';
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
    footerText: "Premium digital art for the intentional soul. Every pixel is a prayer, every screen an altar.",
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
    heroTitle: "이건 단순한 이미지가 아닙니다. <br /> <span class='whitespace-nowrap'>당신이 <span class='aura-gold-text'>끌어당길 것</span>을 선택하세요.</span>",
    heroSubtitle: "당신의 의식을 풍요, 사랑, 에너지의 파동과 정렬하도록 설계된 프리미엄 디지털 의식 도구입니다.",
    enterGallery: "갤러리 입장하기",
    categoryAll: "모든 주파수",
    acquisition: "활성화",
    acquirePiece: "의식 시작하기",
    investment: "에너지 교환",
    downloadArt: "주파수 활성화",
    successTitle: "정렬이 완료되었습니다",
    successSubtitle: "작품이 당신의 의도와 동기화되었습니다. 아래에서 활성화 방식을 선택하세요.",
    footerText: "의식 있는 영혼을 위한 프리미엄 디지털 아트. 모든 픽셀은 기도이며, 모든 화면은 제단입니다.",
    copyright: "© 2026 AuraCanvas. 의지로 구현됨.",
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

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-deep-black/80 backdrop-blur-md border-b border-gold/10 z-50 items-center justify-between px-12">
        <div className="flex items-center gap-3 cursor-pointer group/logo" onClick={() => { setActiveTab('Home'); if(isAdminView) onAdminToggle(); }}>
          <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30 animate-pulse-gold group-hover/logo:shadow-[0_0_20px_rgba(219,198,126,0.4)] transition-all duration-500">
            <ShieldCheck className="text-gold w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover/logo:text-gold transition-colors duration-500">{lang.brand}</span>
        </div>
        <div className="flex items-center gap-10">
          {[
            { id: 'Home', label: lang.home },
            { id: 'Categories', label: lang.categories },
            { id: 'My Library', label: lang.myLibrary }
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
            <button onClick={onLogin} className="flex items-center gap-2 bg-gold text-deep-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all">
              <LogIn className="w-3 h-3" />
              {lang.signIn}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-deep-black border-t border-gold/10 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {[
          { id: 'Home', icon: Home, label: lang.home },
          { id: 'Categories', icon: Grid, label: lang.categories },
          { id: 'My Library', icon: Library, label: lang.myLibrary }
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
  isUnlocked: boolean
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
              "{wallpaper.meaning}"
            </p>
          </div>

          {wallpaper.description && (
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold/60">The Intent</h4>
              <p className="text-white/70 font-light leading-relaxed">{wallpaper.description}</p>
            </div>
          )}

          {wallpaper.ritual_steps && (
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold/60">Ritual Guide</h4>
              <ul className="space-y-3">
                {wallpaper.ritual_steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4 text-sm font-light text-white/50 text-left">
                    <span className="text-gold font-serif italic">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 py-8 border-y border-white/5">
            {[
              { icon: Smartphone, label: "Phone Ritual" },
              { icon: Library, label: "Focus Mode" },
              { icon: Monitor, label: "Space Activation" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 items-center lg:items-start">
                <div className="flex items-center gap-3 text-gold">
                  <item.icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                </div>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">Included</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Glassmorphism) */}
      <div className="fixed bottom-0 left-0 right-0 z-[120] p-6 lg:p-10 bg-gradient-to-t from-deep-black via-deep-black/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-charcoal/60 backdrop-blur-3xl border border-gold/30 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-medium">Energy Exchange</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold text-gold">${wallpaper.price}</span>
              </div>
            </div>
            
            <div className="w-full md:w-auto min-w-[240px]">
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
  const handleDownload = () => {
    if (wallpaper?.imageUrl) {
      const link = document.createElement('a');
      link.href = wallpaper.imageUrl;
      link.download = `${wallpaper.title_en.replace(/\s+/g, '_')}_AuraCanvas.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("High-resolution file is being prepared. Please try again in a moment.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-deep-black/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-charcoal rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-gold/20 overflow-hidden"
      >
        {/* Radiating Aura */}
        <div className="absolute -top-1/2 -left-1/2 w-[200%] aspect-square bg-gold/5 rounded-full blur-[100px] animate-pulse-gold pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
            <CheckCircle2 className="w-12 h-12 text-gold" />
          </div>
          <h3 className="text-3xl font-serif font-bold mb-3 text-white">{lang.successTitle}</h3>
          <p className="text-white/50 font-light mb-10 leading-relaxed">{lang.successSubtitle}</p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "Phone Ritual", icon: Smartphone },
              { label: "Focus Mode", icon: Library },
              { label: "Space Activation", icon: Monitor }
            ].map((btn, idx) => (
              <button 
                key={idx}
                className="w-full bg-white/5 hover:bg-gold/20 text-white h-16 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all border border-white/10"
                onClick={handleDownload}
              >
                <btn.icon className="w-4 h-4 text-gold" />
                {btn.label}
              </button>
            ))}
            <button 
              className="mt-4 text-white/40 uppercase tracking-widest text-[9px] hover:text-gold transition-colors"
              onClick={onClose}
            >
              Return to Gallery
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Footer = ({ lang, currentLang, setLang }: { lang: any, currentLang: string, setLang: (l: string) => void }) => {
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
          <p className="text-white/60 font-light leading-relaxed max-w-sm mb-10">
            {lang.footerText}
          </p>
          <div className="flex gap-6 text-white/40">
            {['Instagram', 'Pinterest', 'Twitter'].map(social => (
              <a key={social} href="#" className="text-[10px] uppercase tracking-[0.3em] hover:text-gold transition-colors">{social}</a>
            ))}
          </div>
        </div>
        
        <div>
          <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold mb-8">Frequencies</h5>
          <ul className="flex flex-col gap-4 text-xs font-light text-white/60">
            {['Abundance', 'Love', 'Energy', 'Healing'].map(item => (
              <li key={item}><a href="#" className="hover:text-gold transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold mb-8">The Gallery</h5>
          <ul className="flex flex-col gap-4 text-xs font-light text-white/60">
            {['About', 'FAQ', 'Privacy', 'Terms', 'Contact'].map(item => (
              <li key={item}><a href="#" className="hover:text-gold transition-colors">{item}</a></li>
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

// --- Main App ---

function MainContent() {
  const [currentLang, setCurrentLang] = useState('EN');
  const lang = LANGUAGES[currentLang as keyof typeof LANGUAGES];
  
  const [activeTab, setActiveTab] = useState('Home');
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
  const [loading, setLoading] = useState(false);
  const [myLibrary, setMyLibrary] = useState<Wallpaper[]>([]);
  const [recentlyUnlockedIds, setRecentlyUnlockedIds] = useState<string[]>([]);

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

  const handleLogin = async () => {
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
  }, []);

  useEffect(() => {
    if (!showMockup || !selectedWallpaper) return;

    const state = { auraMockupOpen: true };
    window.history.pushState(state, '', window.location.href);

    const handlePopState = () => {
      closeMockupOverlay();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showMockup, selectedWallpaper, closeMockupOverlay]);

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

    const moveX = ((x / rect.width) - 0.5) * 24;
    const moveY = ((y / rect.height) - 0.5) * 18;

    e.currentTarget.style.setProperty("--mx", `${moveX}px`);
    e.currentTarget.style.setProperty("--my", `${moveY}px`);
  };

  const resetAuraMove = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mx", `0px`);
    e.currentTarget.style.setProperty("--my", `0px`);
  };

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
                <div className="aura-hero-aurora" />
                <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 lg:pt-32 text-center lg:px-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                  >
                    <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-6 py-2 text-[10px] font-bold uppercase tracking-[0.6em] text-gold shadow-[0_0_20px_rgba(219,198,126,0.08)] backdrop-blur-xl">
                      <span className="h-2 w-2 rounded-full bg-gold/80" />
                      {lang.tagline}
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
                      const gallery = document.getElementById('gallery-start');
                      gallery?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="aura-gold-btn group mx-auto"
                  >
                    <span className="relative z-10 flex items-center gap-4">
                      {lang.enterGallery}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                    </span>
                  </motion.button>
                </div>
              </section>

              <section id="gallery-start" className="aura-gallery-section">
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
                <div className="flex items-center justify-center gap-4 overflow-x-auto pt-10 md:pt-16 pb-12 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('All')}
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
                      onClick={() => setSelectedCategory(cat.name)}
                      className={cn(
                        "aura-ghost-btn whitespace-nowrap",
                        selectedCategory === cat.name && "active"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

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
                          setSelectedWallpaper(wp);
                          setShowMockup(true);
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

          {activeTab === 'Categories' && (
            <div className="px-6 lg:px-16 max-w-7xl mx-auto pt-20">
              <h2 className="text-4xl font-serif font-bold mb-12 text-gold">Explore Energies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setActiveTab('Home'); }}
                    className="group relative h-64 rounded-[3rem] overflow-hidden border border-white/10 hover:border-gold/40 transition-all"
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

        <Footer lang={lang} currentLang={currentLang} setLang={setCurrentLang} />

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
