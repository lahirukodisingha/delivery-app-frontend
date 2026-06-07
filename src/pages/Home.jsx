import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../config/theme'; 
import { translations } from '../config/translations'; 
import { db } from '../db/database';
import { 
  Menu, Bell, Plus, User, MapPin, PackagePlus, LogOut, X, Check, Store, Building2, Circle, CheckCircle2, ChevronRight, ChevronDown, CheckCheck, Info, Megaphone
} from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

// ලංකාවේ වේලාවට අනුව නිවැරදි දිනය ලබාගැනීම
const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [driverName, setDriverName] = useState('');
  const [profilePic, setProfilePic] = useState(null); 
  const [isChecking, setIsChecking] = useState(true);
  
  // Menu and Notifications States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); 
  const [notifications, setNotifications] = useState([]); 
  
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  
  // Onboarding State
  const [onboarding, setOnboarding] = useState({
    profile: false,
    business: false,
    routes: false,
    shops: false,
    items: false,
    isCompleted: false,
    progressPercent: 0
  });

  const [globalNotice, setGlobalNotice] = useState('');

  // අලුත් සැකසුම් ලබා ගැනීමේ useEffect එක
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('appSettings', JSON.stringify(data)); // අලුත්ම දත්ත සේව් කිරීම
          setGlobalNotice(data.global_notice || '');
        }
      } catch (error) {
        // Offline නම් LocalStorage එකෙන් ලබාගැනීම
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setGlobalNotice(parsed.global_notice || '');
        }
      }
    };
    fetchGlobalSettings();
  }, []);
  
  const [language, setLanguage] = useState('si');
  
  const [activeRouteName, setActiveRouteName] = useState('');
  const [routeShops, setRouteShops] = useState([]);
  const [visitedShopIds, setVisitedShopIds] = useState([]);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  const navigate = useNavigate();
  const todayStr = getLocalDate();

  // Load Main Data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);

    if (!token || !userStr) {
      navigate('/', { replace: true });
    } else {
      const user = JSON.parse(userStr);
      setDriverName(user.username); 
      
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('visited_') && key !== `visited_${todayStr}`) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      const loadDashboardData = async () => {
        const profileData = await db.profile.get(1);
        if (profileData && profileData.profilePic) {
          setProfilePic(profileData.profilePic);
        }

        const bCount = await db.settings.count();
        const rCount = await db.routes.count();
        const sCount = await db.shops.count();
        const iCount = await db.items.count();
        
        const isProfileDone = profileData ? profileData.passwordChanged === true : false;
        const isBusinessDone = bCount > 0;
        const isRoutesDone = rCount > 0;
        const isShopsDone = sCount > 0;
        const isItemsDone = iCount > 0;

        const completedCount = [isProfileDone, isBusinessDone, isRoutesDone, isShopsDone, isItemsDone].filter(Boolean).length;
        const isAllCoreCompleted = isBusinessDone && isRoutesDone && isShopsDone && isItemsDone;

        setOnboarding({
          profile: isProfileDone,
          business: isBusinessDone,
          routes: isRoutesDone,
          shops: isShopsDone,
          items: isItemsDone,
          isCompleted: isAllCoreCompleted,
          progressPercent: (completedCount / 5) * 100
        });

        if (isAllCoreCompleted) {
          const savedVisited = JSON.parse(localStorage.getItem(`visited_${todayStr}`) || '[]');
          setVisitedShopIds(savedVisited);

          const activeRouteId = localStorage.getItem('activeRouteId');
          if (activeRouteId) {
            const route = await db.routes.get(parseInt(activeRouteId));
            if (route) setActiveRouteName(route.routeName);

            const allShops = await db.shops.toArray();
            let filteredShops = allShops.filter(s => String(s.routeId) === String(activeRouteId));
            
            filteredShops.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            filteredShops = filteredShops.map((shop, index) => ({ ...shop, displayNum: index + 1 }));
            
            setRouteShops(filteredShops);
          }
        }

        setIsChecking(false);
      };

      loadDashboardData();
    }
  }, [navigate, todayStr]);

  // Load Notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const dummyNotifs = [
          { 
            id: 1, 
            title: language === 'si' ? 'පද්ධති යාවත්කාලීන කිරීමක්!' : 'System Update!', 
            message: language === 'si' ? 'අද රාත්‍රී 10:00 ට පද්ධතිය විනාඩි 30කට අක්‍රිය වේ. කරුණාකර ඊට පෙර ඔබගේ වැඩකටයුතු අවසන් කරන්න.' : 'System will be down for 30 mins at 10:00 PM tonight.', 
            date: todayStr, 
            isRead: false 
          },
          { 
            id: 2, 
            title: language === 'si' ? 'නව විශේෂාංගයක් (Expense Tracker)' : 'New Feature Added!', 
            message: language === 'si' ? 'දැන් ඔබට දෛනික ආදායම් සහ වියදම් වෙන වෙනම සටහන් කළ හැක. වැඩි විස්තර සඳහා More පිටුවට යන්න.' : 'You can now track your daily expenses.', 
            date: '2026-05-29', 
            isRead: false 
          }
        ];
        
        setNotifications(dummyNotifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    loadNotifications();
  }, [language, todayStr]);

  const handleNotifClick = (id) => {
    setExpandedNotifId(prevId => prevId === id ? null : id);
    setNotifications(prevNotifs => 
      prevNotifs.map(n => n.id === id && !n.isRead ? { ...n, isRead: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setExpandedNotifId(null);
  };

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleLogout = () => {
    setIsMenuOpen(false); 
    showAlert(
      t.logoutConfirm,
      'confirm',
      true, 
      async () => {
        try {
          await Promise.all([
            db.settings.clear(), db.profile.clear(), db.routes.clear(),
            db.shops.clear(), db.items.clear(), db.bills.clear(),
            db.billItems.clear(), db.expenses.clear()
          ]);
        } catch (dbError) {
          console.error("Error clearing local database:", dbError);
        }
        
        Object.keys(localStorage).forEach(key => {
          if(key.startsWith('visited_')) localStorage.removeItem(key);
        });
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        navigate('/', { replace: true });
      }
    );
  };

  const handleToggleVisit = (shopId) => {
    let newVisited;
    if (visitedShopIds.includes(shopId)) {
      newVisited = visitedShopIds.filter(id => id !== shopId);
    } else {
      newVisited = [...visitedShopIds, shopId];
    }
    setVisitedShopIds(newVisited);
    localStorage.setItem(`visited_${todayStr}`, JSON.stringify(newVisited));
  };

  const today = new Date();
  const locale = language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-IN' : 'en-US';
  const formattedDate = `${today.getFullYear()} ${today.toLocaleString(locale, { month: 'long' })} ${today.getDate()}`;

  if (isChecking) return <LoadingScreen />;

  const pendingShops = routeShops.filter(shop => !visitedShopIds.includes(shop.id));
  const completedShops = routeShops.filter(shop => visitedShopIds.includes(shop.id));
  const displayShopsList = [...pendingShops, ...completedShops];

  const onboardingSteps = [
    { id: 'profile', title: t.stepProfile, icon: User, isDone: onboarding.profile, path: '/profile' },
    { id: 'business', title: t.stepBusiness, icon: Building2, isDone: onboarding.business, path: '/settings' },
    { id: 'route', title: t.stepRoute, icon: MapPin, isDone: onboarding.routes, path: '/add-route' },
    { id: 'shop', title: t.stepShop, icon: Store, isDone: onboarding.shops, path: '/add-shop' },
    { id: 'item', title: t.stepItem, icon: PackagePlus, isDone: onboarding.items, path: '/add-item' }
  ];

  return (
    <div className={`h-dvh ${theme.colors.background} transition-colors duration-300 flex flex-col relative overflow-hidden`}>
      
      <CustomAlert 
        message={alertConfig.message} 
        type={alertConfig.type} 
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={closeAlert} 
        language={language}
      />

      {/* Overlays for Menu & Notifications */}
      {(isMenuOpen || isNotifOpen) && (
        <div 
          className="absolute inset-0 bg-black/50 dark:bg-black/70 z-[60] transition-opacity"
          onClick={() => { setIsMenuOpen(false); setIsNotifOpen(false); }}
        />
      )}
      
      {/* ======================= SIDE MENU PANEL ======================= */}
      <div className={`absolute top-0 left-0 h-full w-[280px] ${theme.colors.navBg} z-[70] transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col`}>
        
        <div className={`p-6 ${theme.colors.buttonBg} flex justify-between items-center text-white flex-none`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <div>
              <p className="text-[12px] text-blue-100 opacity-90 leading-tight pb-1.5">{t.welcome}</p>
              <h2 className="text-[16px] font-bold leading-tight">{driverName}</h2>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="p-1.5 bg-black/10 rounded-full hover:bg-black/20 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <button onClick={() => { setIsMenuOpen(false); navigate('/profile'); }} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${theme.colors.inputText} font-bold text-[15px] border-b ${theme.colors.navBorder} transition-colors`}>
            <User size={22} className="text-[#14348c] dark:text-blue-400" /> {t.profile}
          </button>
          
          <button onClick={() => { setIsMenuOpen(false); navigate('/settings'); }} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${theme.colors.inputText} font-bold text-[15px] border-b ${theme.colors.navBorder} transition-colors`}>
            <Building2 size={22} className="text-orange-500" /> {t.businessProfile || "ව්‍යාපාරික තොරතුරු"}
          </button>
          
          <button onClick={() => { setIsMenuOpen(false); navigate('/add-route'); }} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${theme.colors.inputText} font-bold text-[15px] border-b ${theme.colors.navBorder} transition-colors`}>
            <MapPin size={22} className="text-green-600" /> {t.addRoute}
          </button>
          
          <button onClick={() => { setIsMenuOpen(false); navigate('/add-shop'); }} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${theme.colors.inputText} font-bold text-[15px] border-b ${theme.colors.navBorder} transition-colors`}>
            <Store size={22} className="text-purple-500" /> {t.addShop}
          </button>
          
          <button onClick={() => { setIsMenuOpen(false); navigate('/add-item'); }} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${theme.colors.inputText} font-bold text-[15px] transition-colors`}>
            <PackagePlus size={22} className="text-rose-500" /> {t.addItem}
          </button>
        </div>

        <div className={`p-4 pb-safe border-t ${theme.colors.navBorder} flex-none bg-gray-50/50 dark:bg-gray-900/20`}>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-3 mb-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-100 dark:border-red-900/30 transition-colors shadow-sm">
            <LogOut size={20} /> {t.logout}
          </button>
          <p className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-2 tracking-wide">
            {t.appVersion || "App Version"} 1.0.0
          </p>
        </div>
      </div>

      {/* ======================= NOTIFICATIONS PANEL ======================= */}
      <div className={`absolute top-0 right-0 h-full w-[300px] sm:w-[350px] ${theme.colors.navBg} z-[70] transform transition-transform duration-300 ease-in-out ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl flex flex-col`}>
        
        <div className={`p-5 flex justify-between items-center border-b ${theme.colors.navBorder}`}>
          <h2 className={`text-[18px] font-bold ${theme.colors.headerText} flex items-center gap-2`}>
            <Bell size={22} className="text-[#14348c] dark:text-blue-400" /> 
            {language === 'si' ? 'නිවේදන' : language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}
          </h2>
          <button onClick={() => setIsNotifOpen(false)} className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 ${theme.colors.mutedText} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        {unreadCount > 0 && (
          <div className={`px-5 py-3 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/20 border-b ${theme.colors.navBorder}`}>
            <span className="text-[12px] font-bold text-[#14348c] dark:text-blue-400">
              {unreadCount} {language === 'si' ? 'නව නිවේදන' : 'New'}
            </span>
            <button onClick={markAllAsRead} className="text-[12px] font-bold text-blue-600 dark:text-blue-300 hover:underline flex items-center gap-1">
              <CheckCheck size={14}/> {language === 'si' ? 'සියල්ල කියවූ බව සටහන් කරන්න' : 'Mark all read'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
              <Bell size={36} className={`${theme.colors.mutedText} mb-3`} />
              <p className={`text-[14px] font-medium ${theme.colors.mutedText}`}>
                {language === 'si' ? 'නිවේදන කිසිවක් නැත.' : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            notifications.map(notif => {
              const isExpanded = expandedNotifId === notif.id;
              
              return (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-xl border transition-all duration-300 ${notif.isRead ? `${theme.colors.inputBorder} ${theme.colors.cardBg} opacity-70` : 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-900/40'} shadow-sm relative overflow-hidden`}
                >
                  {!notif.isRead && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 dark:bg-blue-400"></div>}
                  
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleNotifClick(notif.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${notif.isRead ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' : 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'}`}>
                        <Info size={18} />
                      </div>
                      <div>
                        <h3 className={`text-[14px] ${notif.isRead ? 'font-medium text-gray-600 dark:text-gray-400' : 'font-extrabold text-[#14348c] dark:text-blue-300'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block mt-0.5">{notif.date}</span>
                      </div>
                    </div>
                    
                    <button className={`p-1 rounded-full text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700' : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'}`}>
                    <p className={`text-[13px] leading-relaxed ${notif.isRead ? theme.colors.mutedText : theme.colors.inputText}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* ======================= HEADER ======================= */}
      <div className={`flex-none flex items-center justify-between px-4 py-5 ${theme.colors.background} transition-colors duration-300 z-10`}>
        <button onClick={() => setIsMenuOpen(true)} className={`${theme.colors.headerText} p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition`}>
          <Menu size={28} strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h1 className={`text-[17px] font-bold ${theme.colors.headerText} tracking-wide`}>
            {t.todayIs} {formattedDate}
          </h1>
        </div>
        
        <button 
          onClick={() => setIsNotifOpen(true)} 
          className={`${theme.colors.headerText} p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition relative`}
        >
          <Bell size={28} strokeWidth={2.5} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24 hide-scrollbar">

        {/* අලුතින් එක්කළ Global Notice කොටස */}
        {globalNotice && (
          <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <Megaphone size={20} className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[13px] font-bold text-yellow-800 dark:text-yellow-200 leading-relaxed">
                {globalNotice}
              </p>
            </div>
          </div>
        )}
        
        {!onboarding.isCompleted ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Onboarding View - වෙනස් කර නොමැත */}
            <div className="bg-gradient-to-br from-[#14348c] to-[#1b43aa] rounded-3xl p-6 mb-6 shadow-lg text-white">
              <h2 className="text-[20px] font-bold mb-2">{t.onboardingWelcome}</h2>
              <p className="text-blue-100 text-[14px] leading-relaxed mb-5 opacity-90">{t.onboardingDesc}</p>
              
              <div className="w-full bg-blue-900/50 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-green-400 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${onboarding.progressPercent}%` }}
                ></div>
              </div>
              <p className="text-[12px] font-bold text-blue-200 text-right">
                {Math.round(onboarding.progressPercent)}% {t.onboardingCompleted}
              </p>
            </div>

            <div className="space-y-3">
              {onboardingSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => navigate(step.path)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                      step.isDone 
                        ? `bg-gray-50 dark:bg-gray-800/40 border-transparent shadow-none opacity-60` 
                        : `bg-white dark:bg-gray-800 border-blue-100 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-500`
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        step.isDone ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-50 text-[#14348c] dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        <StepIcon size={20} />
                      </div>
                      <div>
                        <p className={`text-[12px] font-bold mb-0.5 ${step.isDone ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {t.step} {index + 1}
                        </p>
                        <h3 className={`text-[15px] font-bold ${step.isDone ? 'text-gray-500 dark:text-gray-400 line-through' : theme.colors.inputText}`}>
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    
                    {step.isDone ? <CheckCircle2 size={24} className="text-green-500" /> : <Circle size={24} className="text-gray-300 dark:text-gray-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="mb-3 flex justify-between items-end mt-4">
              <h2 className={`${theme.fonts.label} ${theme.colors.labelText}`}>
                {t.todaysRoute} {activeRouteName ? `- ${activeRouteName}` : ''}
              </h2>
              {activeRouteName && (
                <span className="text-base font-bold text-gray-500 dark:text-gray-400">
                  ({completedShops.length}/{routeShops.length})
                </span>
              )}
            </div>

            {!activeRouteName ? (
              <div className={`p-6 rounded-xl border-2 border-dashed ${theme.colors.inputBorder} text-center mb-6`}>
                <MapPin size={32} className={`${theme.colors.mutedText} mx-auto mb-3`} />
                <p className={`${theme.colors.inputText} font-medium mb-4`}>{t.noActiveRoute}</p>
                <button 
                  onClick={() => navigate('/routes')}
                  className={`px-6 py-2.5 bg-blue-100 dark:bg-blue-900/50 text-[#14348c] dark:text-blue-300 font-bold rounded-full text-sm transition-colors`}
                >
                  {t.selectRouteBtn}
                </button>
              </div>
            ) : routeShops.length === 0 ? (
              <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} p-6 text-center mb-6`}>
                <Store size={28} className={`${theme.colors.mutedText} mx-auto mb-2`} />
                <p className={`${theme.colors.mutedText} text-sm font-medium`}>{t.noShopsInRoute}</p>
              </div>
            ) : (
              // =================================================================
              // අලුත් කළ කඩවල් ලැයිස්තුව (ක්ලික් කළ විට කෙලින්ම Add Bill වෙත යයි)
              // =================================================================
              <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden mb-6 transition-all duration-500`}>
                {displayShopsList.map((shop) => {
                  const isVisited = visitedShopIds.includes(shop.id);
                  
                  return (
                    <div 
                      key={shop.id} 
                      className={`flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 transition-all duration-500
                        ${isVisited ? 'bg-gray-50 dark:bg-gray-800/30' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 w-full">
                        
                        {/* 1. අතින් ටික් එක දාන/අයින් කරන කොටස (පරණ විදිහටම ඇත) */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // කඩේ ක්ලික් එකෙන් මේක වෙන් කරගැනීමට
                            handleToggleVisit(shop.id);
                          }}
                          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                            ${isVisited 
                              ? 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600 shadow-inner' 
                              : `bg-transparent ${theme.colors.inputBorder} text-[#14348c] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30`
                            }
                          `}
                        >
                          {isVisited ? <Check size={20} strokeWidth={3} /> : shop.displayNum}
                        </button>

                        {/* 2. කඩේ නම ක්ලික් කර බිලට යෑමේ කොටස */}
                        <div 
                          onClick={() => {
                            // කඩේට ගියා කියලා ටික් එක වැටිලා නැත්නම් විතරක් ඔටෝ ටික් එක දානවා
                            if (!isVisited) {
                              handleToggleVisit(shop.id);
                            }
                            
                            // ඊළඟට Add Bill පිටුවට අදාල කඩේ ID එකත් අරගෙන යනවා
                            navigate('/add-bill', { state: { preSelectedShopId: shop.id } });
                          }}
                          className={`transition-all duration-300 flex-1 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 p-2 -my-2 rounded-lg ${isVisited ? 'opacity-40 grayscale' : 'opacity-100'}`}
                        >
                          <p className={`font-bold ${theme.colors.inputText} text-[16px] ${isVisited ? 'line-through' : ''}`}>
                            {shop.shopName}
                          </p>
                          <p className={`text-[13px] font-medium ${theme.colors.mutedText} mt-0.5`}>
                            {shop.address || shop.phone}
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* යට තිබුණු "නව බිලක් එක් කරන්න" (Add Bill) බොත්තම ඉවත් කර ඇත */}
          </div>
        )}

      </div>

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}