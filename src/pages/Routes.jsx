import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Map, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

// Components (පොදු කොටස්)
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';

export default function Routes() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  
  const [routes, setRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [language, setLanguage] = useState('si');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);

    const loadData = async () => {
      // ඩේටාබේස් එකෙන් රූට් ටික ගන්නවා
      const allRoutes = await db.routes.toArray();
      setRoutes(allRoutes);
      
      // දැනට On කරලා තියෙන රූට් එක ලෝකල් ස්ටෝරේජ් එකෙන් ගන්නවා
      const savedActiveRoute = localStorage.getItem('activeRouteId');
      if (savedActiveRoute) {
        setActiveRouteId(parseInt(savedActiveRoute));
      }
      
      setIsChecking(false);
    };

    loadData();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  // ටොගල් (On/Off) බටන් එක එබුවම වෙන දේ
  const handleToggleRoute = (routeId) => {
    if (activeRouteId === routeId) {
      // දැනට On තියෙන එකම එබුවොත්, ඒක Off වෙනවා (කිසිම රූට් එකක් නෑ)
      setActiveRouteId(null);
      localStorage.removeItem('activeRouteId');
    } else {
      // අලුත් රූට් එකක් On කරනවා (අනිත් ඒවා ඔටෝ Off වෙනවා)
      setActiveRouteId(routeId);
      localStorage.setItem('activeRouteId', routeId.toString());
    }
  };

  // Reusable Loading Screen Component එක භාවිතය
  if (isChecking) return <LoadingScreen />;

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      {/* Top Header (මෙය Main Tab එකක් නිසා Back Button එකක් නැත. එමනිසා PageHeader එක වෙනුවට මෙයම තබා ඇත) */}
      <div className={`flex-none flex items-center justify-center px-4 py-6 ${theme.colors.navBg} z-10 border-b ${theme.colors.navBorder} transition-colors duration-300`}>
        <h1 className={`${theme.fonts.header} ${theme.colors.headerText} tracking-wide flex items-center gap-2`}>
          <Map size={24} className="text-[#14348c] dark:text-blue-400" /> {t.routesTabTitle}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 hide-scrollbar">
        
        <p className={`text-sm ${theme.colors.mutedText} mb-6 font-medium text-center transition-colors`}>
          {t.selectTodayRoute}
        </p>

        {routes.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center shadow-sm transition-colors">
            <AlertCircle size={32} className="mx-auto text-blue-400 mb-3" />
            <p className={`text-sm ${theme.colors.inputText}`}>{t.noRoutesAdded}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => {
              const isActive = activeRouteId === route.id;

              return (
                <div 
                  key={route.id} 
                  className={`p-4 rounded-xl border-2 transition-all duration-300 shadow-sm flex items-center justify-between
                    ${isActive 
                      ? 'border-[#14348c] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/30' 
                      : `${theme.colors.inputBorder} ${theme.colors.cardBg}`
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isActive ? 'bg-[#14348c] text-white dark:bg-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-[16px] ${isActive ? 'text-[#14348c] dark:text-blue-300' : theme.colors.inputText}`}>
                        {route.routeName}
                      </h3>
                      <p className={`text-[12px] font-bold mt-0.5 ${isActive ? 'text-green-600 dark:text-green-400 flex items-center gap-1' : theme.colors.mutedText}`}>
                        {isActive && <CheckCircle2 size={12} />}
                        {isActive ? t.activeStatus : t.inactiveStatus}
                      </p>
                    </div>
                  </div>

                  {/* iOS Style Toggle Switch */}
                  <button 
                    onClick={() => handleToggleRoute(route.id)}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ease-in-out focus:outline-none shadow-inner
                      ${isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out
                      ${isActive ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reusable Bottom Navigation Component එක භාවිතය */}
      <BottomNav language={language} />

    </div>
  );
}