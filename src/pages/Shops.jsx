import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Store, Filter, MoveVertical, Save, GripVertical } from 'lucide-react';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Components 
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import FormSelect from '../components/FormSelect';
import CustomAlert from '../components/CustomAlert';

// ==========================================
// Sortable Shop Item Component
// ==========================================
function SortableShopItem({ shop, index, isReordering, theme, onNavigate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: shop.id,
    disabled: !isReordering // Reorder mode එකේ නැත්නම් Drag කරන්න බෑ
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Drag කරද්දී මුල් එකේ opacity අඩු කරනවා (Placeholder එක වගේ පේන්න)
    opacity: isDragging ? 0.3 : 1, 
    zIndex: isDragging ? 999 : 1,
    position: 'relative'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      // Reorder කරනවා නම් Long-press වලින් drag කරන්න දෙනවා, නැත්නම් Click කරලා Shop History එකට යනවා
      {...(isReordering ? attributes : {})}
      {...(isReordering ? listeners : {})}
      onClick={() => !isReordering && onNavigate(shop.id)}
      className={`flex items-center p-4 rounded-xl border ${theme.colors.inputBorder} ${theme.colors.cardBg} shadow-sm transition-colors ${!isReordering ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800' : 'cursor-grab active:cursor-grabbing touch-none'}`}
    >
      {isReordering && (
        <div className="text-gray-400 dark:text-gray-500 mr-2">
          <GripVertical size={24} />
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
}


// ==========================================
// Main Shops Component
// ==========================================
export default function Shops() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');
  
  const [routes, setRoutes] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [displayedShops, setDisplayedShops] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState('all');
  const [isReordering, setIsReordering] = useState(false);
  const [activeDragShop, setActiveDragShop] = useState(null);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  // dnd-kit Sensors (ෆෝන් එකට ගැලපෙන විදිහට Long-press එක හදලා තියෙනවා)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // ෆෝන් එකේදී අහම්බෙන් drag වෙන එක නවත්වන්න මිලි තත්පර 250ක් ඔබාගෙන ඉන්න ඕනේ (Long Press)
        delay: 250, 
        // ඇඟිල්ල ටිකක් එහා මෙහා වුනොත් ඒක cancel නොවෙන්න px ගානක් දෙනවා
        tolerance: 5, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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


  // Drag එක පටන් ගන්නකොට
  const handleDragStart = (event) => {
    const { active } = event;
    const shop = displayedShops.find(s => s.id === active.id);
    setActiveDragShop(shop);
    // ෆෝන් එකේ ස්ක්‍රෝල් වෙන එක තාවකාලිකව නවත්වනවා
    document.body.style.overflow = 'hidden'; 
  };

  // Drag කරලා අතාරිනකොට
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragShop(null);
    document.body.style.overflow = ''; 

    if (over && active.id !== over.id) {
      setDisplayedShops((items) => {
        const oldIndex = items.findIndex(s => s.id === active.id);
        const newIndex = items.findIndex(s => s.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragCancel = () => {
    setActiveDragShop(null);
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

  const routeOptions = [
    { label: t.allRoutes, value: 'all' },
    ...routes.map(route => ({ label: route.routeName, value: route.id }))
  ];

  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

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
          
          // ==========================================
          // dnd-kit List Container
          // ==========================================
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="space-y-3 relative">
              <SortableContext 
                items={displayedShops.map(s => s.id)} 
                strategy={verticalListSortingStrategy}
              >
                {displayedShops.map((shop, index) => (
                  <SortableShopItem 
                    key={shop.id} 
                    shop={shop} 
                    index={index} 
                    isReordering={isReordering}
                    theme={theme}
                    onNavigate={(id) => navigate(`/shop-history/${id}`)}
                  />
                ))}
              </SortableContext>
            </div>

            {/* අදින වෙලාවට ඇඟිල්ලට යටින් පේන කොටස (Overlay) */}
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeDragShop ? (
                <div className={`flex items-center p-4 rounded-xl border-2 border-[#14348c] dark:border-blue-500 bg-white dark:bg-gray-800 shadow-2xl scale-105 opacity-90 cursor-grabbing`}>
                  <div className="text-[#14348c] dark:text-blue-400 mr-2">
                    <GripVertical size={24} />
                  </div>
                  <div className={`flex items-center gap-4`}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-[#14348c] dark:bg-blue-600 text-white`}>
                      {displayedShops.findIndex(s => s.id === activeDragShop.id) + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold text-[16px] text-gray-900 dark:text-white`}>{activeDragShop.shopName}</h3>
                      <p className={`text-[12px] font-medium mt-0.5 text-gray-500 dark:text-gray-400`}>{activeDragShop.address || activeDragShop.phone}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

        )}
      </div>

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}