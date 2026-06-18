import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Animation එකේ කාලසටහන (Timeline)
    const t1 = setTimeout(() => setStep(1), 800);  // ලොරිය මැදට ඇවිත් නැවතුණාම 'DeliGo' පෙන්වයි
    const t2 = setTimeout(() => setStep(2), 1600); // ඉන්පසු 'powered by apianstack' පෙන්වයි
    const t3 = setTimeout(() => setStep(3), 3000); // ලොරිය දකුණට ධාවනය වී යයි
    const t4 = setTimeout(() => setStep(4), 3500); // මුළු තිරයම බොඳ වී යයි (Fade out)
    const t5 = setTimeout(() => onComplete(), 4000); // Component එක සම්පූර්ණයෙන්ම ඉවත් කරයි

    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); 
    };
  }, [onComplete]);

  return (
    <>
      <style>
        {`
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
        `}
      </style>

      {/* දම්පාට පසුබිම (Premium Gradient) */}
      <div className={`fixed inset-0 z-[9999] bg-gradient-to-br from-violet-700 to-purple-800 flex flex-col items-center justify-center transition-opacity duration-500 ${step >= 4 ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Truck Container */}
        <div className={`relative flex items-center mb-6 
          ${step === 0 ? 'truck-in' : ''} 
          ${step > 0 && step < 3 ? 'translate-x-0' : ''} 
          ${step >= 3 ? 'truck-out' : ''}
        `}>
          
          {/* දුම් දාන Effect එක (Smoke Particles) */}
          {step < 3 && (
            <>
              <div className="absolute -left-6 bottom-1 w-4 h-4 bg-white/60 rounded-full smoke-1" />
              <div className="absolute -left-4 bottom-2 w-3 h-3 bg-white/50 rounded-full smoke-2" />
              <div className="absolute -left-8 bottom-0 w-5 h-5 bg-white/40 rounded-full smoke-3" />
            </>
          )}

          {/* ලොරිය වේගයෙන් යන බව පෙන්වන ඉරි (Speed Lines) */}
          {(step === 0 || step === 3) && (
            <>
              <div className="absolute -left-12 top-4 w-8 h-1 bg-white/50 rounded-full speed-1" />
              <div className="absolute -left-16 top-8 w-6 h-1 bg-white/40 rounded-full speed-1" style={{animationDelay: '0.2s'}} />
            </>
          )}
          
          {/* සුදු පාට ලොරිය */}
          <Truck size={80} strokeWidth={2} className="text-white relative z-10 drop-shadow-lg" />     
        </div>

        {/* Text කොටස */}
        <div className="flex flex-col items-center text-center h-24">
          <h1 className={`text-6xl font-extrabold text-white tracking-wider transition-all duration-700 ease-out transform drop-shadow-md ${step >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}`}>
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