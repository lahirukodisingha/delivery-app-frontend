import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Printer, Coins, CloudLightning, ChevronRight, Lock } from 'lucide-react';
import { db } from '../db/database'; // Database එක import කරගන්නවා

// Components
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import CustomAlert from '../components/CustomAlert'; // Alert එක import කරගන්නවා

export default function More() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');
  
  // --- Onboarding Complete ද කියා බැලීමට State එකක් ---
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ message: '', type: 'success', showCancel: false, onConfirm: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/');
      return;
    }

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);

    // --- Onboarding Status එක පරීක්ෂා කිරීම ---
    const checkOnboarding = async () => {
      try {
        const profileData = await db.profile.get(1);
        const bCount = await db.settings.count();
        const rCount = await db.routes.count();
        const sCount = await db.shops.count();
        const iCount = await db.items.count();
        
        const isProfileDone = profileData ? profileData.passwordChanged === true : false;
        const isBusinessDone = bCount > 0;
        const isRoutesDone = rCount > 0;
        const isShopsDone = sCount > 0;
        const isItemsDone = iCount > 0;

        // පියවර 5 ම ඉවර නම් පමණක් True කරයි
        if (isProfileDone && isBusinessDone && isRoutesDone && isShopsDone && isItemsDone) {
          setIsOnboardingComplete(true);
        } else {
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });
  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  if (isChecking) return <LoadingScreen />;

  // ලොක් වී ඇති බොත්තමක් එබූ විට පෙන්වන Alert එක
  const handleLockedFeature = () => {
    showAlert(language === 'si' ? 'කරුණාකර පළමුව මුල් පිටුවේ ඇති පියවර සම්පූර්ණ කරන්න!' : 'Please complete the onboarding steps on the home page first!', 'error');
  };

  // මෙනු ලැයිස්තුවේ අයිතම 3 (Locked තත්ත්වයන් සමඟ)
  const menuItems = [
    {
      label: t.menuExpenseTracker,
      icon: Coins,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      path: "/expenses",
      locked: !isOnboardingComplete // පියවර අවසන් නැත්නම් Lock වේ
    },
    {
      label: t.menuPrinterSettings,
      icon: Printer,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      path: "/printer-settings",
      locked: !isOnboardingComplete // පියවර අවසන් නැත්නම් Lock වේ
    },
    {
      label: t.menuBackupSync,
      icon: CloudLightning,
      color: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
      path: "/backup",
      locked: false // මෙය හැමවිටම විවෘතව පවතී
    }
  ];

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      {/* Custom Alert */}
      <CustomAlert 
        message={alertConfig.message} type={alertConfig.type} showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm} onClose={closeAlert} language={language}
      />

      {/* Top Header */}
      <PageHeader title={t.moreTabTitle} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 hide-scrollbar">
        
        {/* මෙනු ලැයිස්තුව (Menu List Items) */}
        <div className={`${theme.colors.cardBg} rounded-2xl border ${theme.colors.inputBorder} overflow-hidden shadow-sm transition-colors`}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.locked ? handleLockedFeature : () => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 transition-colors text-left ${item.locked ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${item.locked ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : `${item.bgColor} ${item.color}`} rounded-xl flex items-center justify-center`}>
                    {item.locked ? <Lock size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`font-bold text-[15px] ${theme.colors.inputText}`}>
                    {item.label}
                  </span>
                </div>
                {item.locked ? <Lock size={18} className="text-gray-400 dark:text-gray-500" /> : <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />}
              </button>
            );
          })}
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}