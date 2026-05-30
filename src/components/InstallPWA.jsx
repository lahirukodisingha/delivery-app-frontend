import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { theme } from '../config/theme';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // බ්‍රවුසරයෙන් ඇප් එක ඉන්ස්ටෝල් කරන්න පුළුවන් ද කියලා අහන ඉවෙන්ට් එක
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e); // ඒ ඉවෙන්ට් එක සේව් කරගන්නවා
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // ඉන්ස්ටෝල් කරන පැනල් එක පෙන්වීම
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // ඉන්ස්ටෝල් කරන්න බැරි උපාංග වල (හෝ දැනටමත් ඉන්ස්ටෝල් කර ඇති විට) බොත්තම සඟවයි
  if (!deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick} 
      className={`flex items-center gap-2 ${theme.colors.buttonBg} text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:opacity-90 transition`}
    >
      <Download size={20} /> ඇප් එක Download කරන්න
    </button>
  );
}