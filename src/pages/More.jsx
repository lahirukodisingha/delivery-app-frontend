import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Printer, Coins, CloudLightning, ChevronRight } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';

export default function More() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/');
      return;
    }

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);
    setIsChecking(false);
  }, [navigate]);

  const t = translations[language] || translations['si'];

  if (isChecking) return <LoadingScreen />;

  // මෙනු ලැයිස්තුවේ අයිතම 3 පමණක් (Menu Items Array)
  const menuItems = [
    {
      label: t.menuExpenseTracker,
      icon: Coins,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      path: "/expenses"
    },
    {
      label: t.menuPrinterSettings,
      icon: Printer,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      path: "/printer-settings"
    },
    {
      label: t.menuBackupSync,
      icon: CloudLightning,
      color: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
      path: "/backup"
    }
  ];

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
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
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${item.bgColor} ${item.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                  <span className={`font-bold text-[15px] ${theme.colors.inputText}`}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
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