import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Store, Filter, MoveVertical, Save, ChevronUp, ChevronDown } from 'lucide-react';

// Components 
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import FormSelect from '../components/FormSelect';
import CustomAlert from '../components/CustomAlert';

export default function Shops() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');
  
  const [routes, setRoutes] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [displayedShops, setDisplayedShops] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState('all');
  const [isReordering, setIsReordering] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);

    const loadData = async () => {
      const loadedRoutes = await db.routes.toArray();
      const loadedShops = await db.shops.toArray();
      
      loadedShops.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      setRoutes(loadedRoutes);
      setAllShops(loadedShops);
      setDisplayedShops(loadedShops);
      setIsChecking(false);
    };

    loadData();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  useEffect(() => {
    if (selectedRouteId === 'all') {
      setDisplayedShops(allShops);
      setIsReordering(false); 
    } else {
      const filtered = allShops.filter(s => String(s.routeId) === String(selectedRouteId));
      filtered.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setDisplayedShops(filtered);
    }
  }, [selectedRouteId, allShops]);

  // ==========================================
  // අලුත් ක්‍රමය: ඉහළට සහ පහළට මාරු කිරීම
  // ==========================================
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newShops = [...displayedShops];
    const temp = newShops[index];
    newShops[index] = newShops[index - 1];
    newShops[index - 1] = temp;
    setDisplayedShops(newShops);
  };

  const handleMoveDown = (index) => {
    if (index === displayedShops.length - 1) return;
    const newShops = [...displayedShops];
    const temp = newShops[index];
    newShops[index] = newShops[index + 1];
    newShops[index + 1] = temp;
    setDisplayedShops(newShops);
  };

  const saveOrder = async () => {
    try {
      const updatePromises = displayedShops.map((shop, index) => {
        return db.shops.update(shop.id, { orderIndex: index });
      });
      await Promise.all(updatePromises);
      
      showAlert(t.orderSavedSuccess || 'කඩවල් වල පිළිවෙල සාර්ථකව සුරැකුවා!', 'success');
      setIsReordering(false);
      
      const updatedShops = await db.shops.toArray();
      setAllShops(updatedShops);
      
    } catch (error) {
      showAlert(t.saveError || 'Error saving order', 'error');
    }
  };

  const routeOptions = [
    { label: t.allRoutes, value: 'all' },
    ...routes.map(route => ({ label: route.routeName, value: route.id }))
  ];

  if (isChecking) return <LoadingScreen />;

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      <CustomAlert 
        message={alertConfig.message} 
        type={alertConfig.type} 
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={closeAlert} 
        language={language}
      />

      <div className={`flex-none flex items-center justify-center px-4 py-6 ${theme.colors.navBg} z-10 border-b ${theme.colors.navBorder} transition-colors duration-300`}>
        <h1 className={`${theme.fonts.header} ${theme.colors.headerText} tracking-wide flex items-center gap-2`}>
          <Store size={24} className="text-[#14348c] dark:text-blue-400" /> {t.shopsTabTitle}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 hide-scrollbar">
        
        <div className="mb-6 space-y-4">
          
          <FormSelect
            label={t.filterByRoute}
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            disabled={isReordering}
            options={routeOptions}
            icon={Filter}
          />

          {selectedRouteId !== 'all' && displayedShops.length > 1 && (
            <div className="flex justify-end">
              {isReordering ? (
                <button onClick={saveOrder} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition-colors text-sm">
                  <Save size={18} /> {t.saveOrderBtn}
                </button>
              ) : (
                <button onClick={() => setIsReordering(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition-colors text-sm">
                  <MoveVertical size={18} /> {t.reorderShopsBtn}
                </button>
              )}
            </div>
          )}
        </div>

        {displayedShops.length === 0 ? (
          <p className={`text-sm ${theme.colors.mutedText} text-center py-6 ${theme.colors.cardBg} rounded-xl border ${theme.colors.inputBorder}`}>
            {t.noItems || "කඩවල් කිසිවක් හමු නොවීය."}
          </p>
        ) : (
          <div className="space-y-3 relative">
            {displayedShops.map((shop, index) => {
              return (
                <div 
                  key={shop.id}
                  onClick={() => !isReordering && navigate(`/shop-history/${shop.id}`)}
                  className={`flex items-center p-4 rounded-xl border ${theme.colors.inputBorder} ${theme.colors.cardBg} shadow-sm transition-colors ${!isReordering ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800' : ''}`}
                >
                  {/* Up / Down Buttons */}
                  {isReordering && (
                    <div className="flex flex-col gap-2 mr-3 px-1 border-r border-gray-200 dark:border-gray-700 pr-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg transition-colors ${index === 0 ? 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600' : 'bg-blue-50 text-[#14348c] active:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400'}`}
                      >
                        <ChevronUp size={20} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                        disabled={index === displayedShops.length - 1}
                        className={`p-1.5 rounded-lg transition-colors ${index === displayedShops.length - 1 ? 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600' : 'bg-blue-50 text-[#14348c] active:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400'}`}
                      >
                        <ChevronDown size={20} strokeWidth={3} />
                      </button>
                    </div>
                  )}

                  <div className={`flex items-center gap-4`}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold text-[16px] ${theme.colors.inputText}`}>{shop.shopName}</h3>
                      <p className={`text-[12px] font-medium mt-0.5 ${theme.colors.mutedText}`}>{shop.address || shop.phone}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}