const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const newDesktopMockup = `              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl opacity-30" />
              
              {/* Computer Assembly (Monitor + Stand) */}
              <div className="relative mb-14 mx-auto mt-auto group-hover/usage:-translate-y-3 transition-transform duration-500 z-10 flex flex-col items-center">
                {/* Monitor Frame */}
                <div className="relative w-full max-w-[280px] aspect-video bg-[#1A1A1A] rounded-md border-2 border-[#333] shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col">
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
              </div>`;

// Replace lines 581 to 609 (0-indexed: 580 to 608)
// Note: lines 580 is <div className="aura-usage-image...
// We replace the content inside it.
const start = 581;
const end = 609;
lines.splice(start, end - start + 1, newDesktopMockup);

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Desktop mockup assembly fixed.');
