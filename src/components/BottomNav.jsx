import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../config/translations';
import { Map, Store, Home as HomeIcon, FileText, MoreHorizontal } from 'lucide-react';

export default function BottomNav({ language = 'si' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language] || translations['si'];
  const currentPath = location.pathname;

  const navItems = [
    { path: '/routes', icon: Map, label: t.navRoutes },
    { path: '/shops', icon: Store, label: t.navShops },
    { path: '/home', icon: HomeIcon, label: t.navHome },
    { path: '/reports', icon: FileText, label: t.navReports },
    { path: '/more', icon: MoreHorizontal, label: t.navMore }
  ];

  const getInitialIndex = () => {
    const exactMatch = navItems.findIndex(item => currentPath === item.path);
    if (exactMatch !== -1) return exactMatch;
    const partialMatch = navItems.findIndex(item => currentPath.includes(item.path));
    return partialMatch !== -1 ? partialMatch : 2; 
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);

  useEffect(() => {
    setActiveIndex(getInitialIndex());
  }, [currentPath]);

  const handleNavClick = (path, index) => {
    if (activeIndex === index) return;
    
    setActiveIndex(index);
    // Timeout එක ඉවත් කර ඇත, ක්ලික් කළ විගසම navigate වේ
    navigate(path); 
  };

  return (
    <div 
      className="relative flex-none bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 w-full flex justify-around items-center z-50 transition-colors duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      style={{ 
        paddingTop: '8px',
        // Phone එකේ යටින් කැපෙන එක නතර කිරීමට Safe Area Inset යොදා ඇත
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' 
      }}
    >
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeIndex === index;

        return (
          <button 
            key={item.path} 
            onClick={() => handleNavClick(item.path, index)} 
            className="flex flex-col items-center justify-center focus:outline-none min-w-[64px] group"
          >
            {/* Icon Container with subtle active background */}
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-transparent group-hover:bg-gray-50 dark:group-hover:bg-gray-800'}`}>
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-colors duration-200 ${isActive ? 'text-[#14348c] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} 
              />
            </div>
            
            {/* Label */}
            <span 
              className={`text-[11px] font-medium mt-1 transition-colors duration-200 ${
                isActive ? 'text-[#14348c] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
