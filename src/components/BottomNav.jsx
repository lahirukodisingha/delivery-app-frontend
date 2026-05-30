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
    
    // නවීන පෙනුම සඳහා කාලය මදක් අඩු කර ඇත (350ms -> 250ms)
    setTimeout(() => {
      navigate(path);
    }, 250); 
  };

  return (
    // Glassmorphism effect එක මෙතනට එකතු කර ඇත (backdrop-blur)
    <div className="relative flex-none bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl h-[75px] w-full flex items-center shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] z-50 transition-colors duration-300 rounded-t-3xl">
      
      {/* Animated Indicator Container */}
      <div 
        className="absolute top-0 left-0 w-1/5 h-full flex justify-center pointer-events-none z-0"
        style={{ 
          transform: `translateX(${activeIndex * 100}%)`,
          // Premium Apple-style spring animation curve
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
        }}
      >
        {/* Floating Active Circle (කැත දාර ඉවත් කර, Border එකක් මගින් Cutout එක පෙන්වීම) */}
        <div className="absolute top-[-24px] w-[60px] h-[60px] rounded-full bg-gradient-to-tr from-[#14348c] to-[#4070f4] dark:from-blue-600 dark:to-blue-400 shadow-[0_8px_20px_rgba(20,52,140,0.5)] border-[6px] border-white dark:border-gray-900 transition-colors duration-300" />
      </div>

      {/* Navigation Buttons */}
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeIndex === index;

        return (
          <button 
            key={item.path} 
            onClick={() => handleNavClick(item.path, index)} 
            className="flex-1 h-full relative z-10 flex flex-col items-center justify-center focus:outline-none group"
          >
            {/* Icon Animation */}
            <div 
              className="flex items-center justify-center transition-all duration-500 ease-out"
              style={{
                transform: isActive ? 'translateY(-26px)' : 'translateY(2px)',
              }}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-[#14348c] dark:group-hover:text-blue-400'}`} 
              />
            </div>
            
            {/* Label Animation */}
            <span 
              className={`absolute bottom-3 text-[11px] font-bold tracking-wide transition-all duration-300 ${
                isActive ? 'text-[#14348c] dark:text-blue-400 opacity-100' : 'text-gray-400 dark:text-gray-500 opacity-0 translate-y-4'
              }`}
            >
              {item.label}
            </span>
            
            {/* Active Glow Effect (පහලින් එන කුඩා එළිය) */}
            {isActive && (
              <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#14348c] dark:bg-blue-400 shadow-[0_0_8px_rgba(20,52,140,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}