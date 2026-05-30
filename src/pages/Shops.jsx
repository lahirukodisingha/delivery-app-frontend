import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Store, Filter, MoveVertical, Save, GripVertical } from 'lucide-react';

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

  const [dragState, setDragState] = useState({
    isDragging: false,
    originalIndex: null, 
    draggedShop: null,   
    hoverIndex: null,    
    currentY: 0,
    currentX: 0
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

  const handleDragStart = (e, index, shop) => {
    if (!isReordering) return;
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    setDragState({
      isDragging: true,
      originalIndex: index,
      draggedShop: shop,
      hoverIndex: index,
      currentY: clientY,
      currentX: clientX
    });
    
    document.body.style.overflow = 'hidden'; 
  };

  const handleDragMove = (e) => {
    if (!dragState.isDragging) return;
    if(e.cancelable) e.preventDefault(); 

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    const elem = document.elementFromPoint(clientX, clientY);
    let newHoverIndex = dragState.hoverIndex;
    
    if (elem) {
      const row = elem.closest('[data-shop-index]');
      if (row) {
        const idx = parseInt(row.getAttribute('data-shop-index'), 10);
        if (!isNaN(idx)) newHoverIndex = idx;
      }
    }

    setDragState(prev => ({
      ...prev,
      currentY: clientY,
      currentX: clientX,
      hoverIndex: newHoverIndex
    }));
  };

  const handleDragEnd = () => {
    if (!dragState.isDragging) return;
    
    const newShops = [...displayedShops];
    const shopToMove = newShops.splice(dragState.originalIndex, 1)[0];
    newShops.splice(dragState.hoverIndex, 0, shopToMove);
    
    setDisplayedShops(newShops);
    
    setDragState({
      isDragging: false, originalIndex: null, draggedShop: null, hoverIndex: null, currentY: 0, currentX: 0
    });
    
    document.body.style.overflow = '';
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

  let renderList = [...displayedShops];
  if (dragState.isDragging) {
    renderList.splice(dragState.originalIndex, 1);
    renderList.splice(dragState.hoverIndex, 0, { isPlaceholder: true, id: 'placeholder' });
  }

  const routeOptions = [
    { label: t.allRoutes, value: 'all' },
    ...routes.map(route => ({ label: route.routeName, value: route.id }))
  ];

  if (isChecking) return <LoadingScreen />;

  return (
    <div 
      className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      
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
            {renderList.map((shop, index) => {
              
              if (shop.isPlaceholder) {
                return (
                  <div key="placeholder" data-shop-index={index} className="h-19 rounded-xl border-2 border-dashed border-[#14348c]/40 dark:border-blue-500/40 bg-blue-50/20 dark:bg-blue-900/10 transition-all duration-200"></div>
                );
              }

              return (
                <div 
                  key={shop.id}
                  data-shop-index={index}
                  onClick={() => !isReordering && navigate(`/shop-history/${shop.id}`)}
                  className={`flex items-center p-4 rounded-xl border ${theme.colors.inputBorder} ${theme.colors.cardBg} shadow-sm transition-colors ${!isReordering ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800' : ''}`}
                >
                  {isReordering && (
                    <div 
                      onTouchStart={(e) => handleDragStart(e, index, shop)}
                      onMouseDown={(e) => handleDragStart(e, index, shop)}
                      className="text-gray-400 dark:text-gray-500 active:text-[#14348c] dark:active:text-blue-400 cursor-grab active:cursor-grabbing touch-none px-2 py-2 -ml-2 transition-colors z-10"
                    >
                      <GripVertical size={24} />
                    </div>
                  )}

                  <div className={`flex items-center gap-4 ${isReordering ? 'ml-2' : ''}`}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400`}>
                      {displayedShops.findIndex(s => s.id === shop.id) + 1}
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

      {dragState.isDragging && dragState.draggedShop && (
        <div 
          className="fixed z-100 w-[calc(100%-40px)] pointer-events-none shadow-2xl scale-105 rounded-xl bg-white dark:bg-gray-800 border-2 border-[#14348c] dark:border-blue-500 flex items-center p-4"
          style={{
            top: dragState.currentY - 35, 
            left: 20
          }}
        >
          <div className="text-[#14348c] dark:text-blue-400 px-2 py-2 -ml-2">
            <GripVertical size={24} />
          </div>
          <div className="flex items-center gap-4 ml-2">
            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-[#14348c] text-white dark:bg-blue-600">
              {displayedShops.findIndex(s => s.id === dragState.draggedShop.id) + 1}
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-gray-900 dark:text-white">{dragState.draggedShop.shopName}</h3>
              <p className="text-[12px] font-medium mt-0.5 text-gray-500 dark:text-gray-400">{dragState.draggedShop.address || dragState.draggedShop.phone}</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}