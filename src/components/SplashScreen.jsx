import { useState, useEffect, useRef } from 'react';
import { Truck } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  // පරණ පාට මතක තියාගන්න Ref එකක් (Theme color restore කරන්න)
  const originalThemeColor = useRef('#f4f7fb');

  useEffect(() => {
    // --- 1. Status Bar Color එක දම් පාට කිරීම ---
    const metaTheme = document.querySelector("meta[name='theme-color']");
    
    if (metaTheme) {
      originalThemeColor.current = metaTheme.getAttribute('content');
      // Background gradient එකේ උඩ පාටට (violet-700) ගැලපෙන Hex Code එක
      metaTheme.setAttribute('content', '#6d28d9'); 
    }

    const t1 = setTimeout(() => setStep(1), 800);  
    const t2 = setTimeout(() => setStep(2), 1600); 
    const t3 = setTimeout(() => setStep(3), 3000); 
    const t4 = setTimeout(() => setStep(4), 3500); 
    const t5 = setTimeout(() => {
      // --- 2. Splash Screen එක ඉවත් වෙද්දී මුල් වර්ණය නැවත යෙදීම ---
      if (metaTheme) {
        metaTheme.setAttribute('content', originalThemeColor.current);
      }
      onComplete();
    }, 4000); 

    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); 
      // යම් හෙයකින් අඩින් නැවතුනොත් වර්ණය නිවැරදි කිරීමට
      if (metaTheme && step < 4) {
        metaTheme.setAttribute('content', originalThemeColor.current);
      }
    };
  }, [onComplete]);

  return (
    <>
      <style>
        {`
          /* Logo එකේ ෆොන්ට් එකට වඩාත්ම සමාන Poppins ෆොන්ට් එක අන්තර්ජාලයෙන් ලබාගැනීම */
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap');

          @keyframes driveIn {
            0% { transform: translateX(-100vw) rotate(-5deg); }
            80% { transform: translateX(10px) rotate(2deg); }
            100% { transform: translateX(0) rotate(0); }
          }
          @keyframes driveOut {
            0% { transform: translateX(0) rotate(0); }
            20% { transform: translateX(-10px) rotate(-5deg); }
            100% { transform: translateX(100vw) rotate(5deg); }
          }
          @keyframes smokeEffect {
            0% { transform: scale(0.5) translate(0, 0); opacity: 0.8; }
            100% { transform: scale(2.5) translate(-20px, -10px); opacity: 0; }
          }
          @keyframes speedLine {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(-50px); opacity: 0; }
          }
          
          .truck-in { animation: driveIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
          .truck-out { animation: driveOut 0.6s cubic-bezier(0.5, 0, 0.75, 0) forwards; }
          .smoke-1 { animation: smokeEffect 0.6s infinite; animation-delay: 0s; }
          .smoke-2 { animation: smokeEffect 0.6s infinite; animation-delay: 0.2s; }
          .smoke-3 { animation: smokeEffect 0.6s infinite; animation-delay: 0.4s; }
          .speed-1 { animation: speedLine 0.5s infinite linear; }
          
          /* අලුතින් එක්කළ ෆොන්ට් පන්තිය */
          .logo-text {
            font-family: 'Poppins', sans-serif;
          }
        `}
      </style>

      <div className={`fixed inset-0 z-[9999] bg-gradient-to-br from-violet-700 to-purple-800 flex flex-col items-center justify-center transition-opacity duration-500 ${step >= 4 ? 'opacity-0' : 'opacity-100'}`}>
        
        <div className={`relative flex items-center mb-6 
          ${step === 0 ? 'truck-in' : ''} 
          ${step > 0 && step < 3 ? 'translate-x-0' : ''} 
          ${step >= 3 ? 'truck-out' : ''}
        `}>
          
          {step < 3 && (
            <>
              <div className="absolute -left-6 bottom-1 w-4 h-4 bg-white/60 rounded-full smoke-1" />
              <div className="absolute -left-4 bottom-2 w-3 h-3 bg-white/50 rounded-full smoke-2" />
              <div className="absolute -left-8 bottom-0 w-5 h-5 bg-white/40 rounded-full smoke-3" />
            </>
          )}

          {(step === 0 || step === 3) && (
            <>
              <div className="absolute -left-12 top-4 w-8 h-1 bg-white/50 rounded-full speed-1" />
              <div className="absolute -left-16 top-8 w-6 h-1 bg-white/40 rounded-full speed-1" style={{animationDelay: '0.2s'}} />
            </>
          )}
          
          <Truck size={80} strokeWidth={2} className="text-white relative z-10 drop-shadow-lg" />
        </div>

        <div className="flex flex-col items-center text-center h-24">
          <h1 className={`logo-text text-6xl font-extrabold text-white tracking-wider transition-all duration-700 ease-out transform drop-shadow-md ${step >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}`}>
            DeliGo
          </h1>
          <p className={`mt-3 text-purple-200 text-[11px] font-bold tracking-[0.3em] uppercase transition-all duration-700 ease-out transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            powered by apianstack
          </p>
        </div>
        
      </div>
    </>
  );
}