import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { Store, MapPin, Phone, Save, Map as MapIcon, Plus, ChevronUp, Edit, Trash2, List, X } from 'lucide-react';

// Components (පොදු කොටස්)
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert'; 

export default function AddShop() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  
  // Form States
  const [shopName, setShopName] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // අලුත් State එක: වෙනස්කම් හඳුනාගන්න මුල් කඩේ විස්තර මතක තියාගන්න
  const [originalShop, setOriginalShop] = useState(null);
  
  // Data States
  const [routes, setRoutes] = useState([]);
  const [routesMap, setRoutesMap] = useState({}); // රූට් ID එකෙන් නම හොයාගන්න
  const [existingShops, setExistingShops] = useState([]);
  const [language, setLanguage] = useState('si');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');

    const loadData = async () => {
      try {
        const allRoutes = await db.routes.toArray();
        const allShops = await db.shops.toArray();
        
        setRoutes(allRoutes);
        setExistingShops(allShops);

        // රූට් නම ලේසියෙන් හොයාගන්න Map එකක් හදනවා
        const rMap = {};
        allRoutes.forEach(r => { rMap[r.id] = r.routeName; });
        setRoutesMap(rMap);

        setIsChecking(false);
      } catch (error) {
        console.error("Failed to load data", error);
        setIsChecking(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const resetForm = () => {
    setShopName('');
    setAddress('');
    setPhone('');
    setSelectedRouteId(routes.length > 0 ? routes[0].id.toString() : '');
    setEditingShopId(null);
    setOriginalShop(null);
    setIsFormOpen(false);
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    if (!selectedRouteId) {
      showAlert(t.noRouteAlert || 'කරුණාකර ගමන් මාර්ගයක් තෝරන්න!', 'error');
      return;
    }

    try {
      const formattedShopName = shopName.trim();

      // =======================================================
      // Duplicate Shop Validation (Offline Check)
      // =======================================================
      const isDuplicate = existingShops.some(
        shop => 
          shop.shopName.toLowerCase() === formattedShopName.toLowerCase() && 
          shop.id !== editingShopId // Edit කරන වෙලාවට එයාගේම නම Duplicate එකක් විදිහට ගන්නැති වෙන්න
      );

      if (isDuplicate) {
        showAlert(t.duplicateShopAlert || 'Shop already exists!', 'error');
        return; // Duplicate නම් මෙතනින් නවතී, සේව් වෙන්නේ නෑ.
      }
      // =======================================================

      if (editingShopId) {
        // කඩේ විස්තර යාවත්කාලීන කිරීම (Update)
        await db.shops.update(editingShopId, {
          shopName: formattedShopName,
          routeId: parseInt(selectedRouteId),
          address: address.trim(),
          phone: phone.trim(),
          syncStatus: 'pending'
        });
        showAlert(t.shopUpdatedSuccess || 'කඩේ විස්තර සාර්ථකව යාවත්කාලීන කළා!', 'success');
      } else {
        // අලුත් කඩයක් එකතු කිරීම
        const currentShopsInRoute = await db.shops.filter(s => String(s.routeId) === String(selectedRouteId)).toArray();
        const newOrderIndex = currentShopsInRoute.length;

        await db.shops.add({ 
          shopName: formattedShopName, 
          routeId: parseInt(selectedRouteId), 
          address: address.trim(), 
          phone: phone.trim(),
          orderIndex: newOrderIndex,
          syncStatus: 'pending'
        });
        showAlert(t.shopSavedSuccess || 'කඩය සාර්ථකව සුරකින ලදී!', 'success');
      }
      
      setExistingShops(await db.shops.toArray());
      resetForm();
    } catch (error) {
      showAlert(t.saveError || 'සුරැකීමේදී දෝෂයක් මතු විය!', 'error');
    }
  };

  const handleEditClick = (shop) => {
    setShopName(shop.shopName);
    setSelectedRouteId(shop.routeId.toString());
    setAddress(shop.address || '');
    setPhone(shop.phone || '');
    
    setEditingShopId(shop.id);
    setOriginalShop(shop);
    
    setIsFormOpen(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDeleteClick = (id) => {
    showAlert(
      t.deleteShopConfirm || 'මෙම කඩය මකා දැමීමට අවශ්‍ය බව ඔබට විශ්වාසද?', 
      'confirm', 
      true, 
      async () => {
        try {
          await db.shops.delete(id);
          setExistingShops(await db.shops.toArray());
          
          setTimeout(() => {
            showAlert(t.shopDeletedSuccess || 'කඩය සාර්ථකව මකා දමන ලදී!', 'success');
          }, 300);
          
          if (editingShopId === id) {
            resetForm();
          }
        } catch (error) {
          setTimeout(() => {
            showAlert("Error deleting shop", 'error');
          }, 300);
        }
      }
    );
  };

  const toggleForm = () => {
    if (isFormOpen) {
      resetForm();
    } else {
      if (routes.length > 0 && !selectedRouteId) setSelectedRouteId(routes[0].id.toString());
      setIsFormOpen(true);
    }
  };

  if (isChecking) return <LoadingScreen />;

  const routeOptions = routes.map(r => ({ label: r.routeName, value: r.id }));

  const isSubmitDisabled = editingShopId 
    ? !( 
        shopName.trim() !== (originalShop?.shopName || '') ||
        selectedRouteId !== (originalShop?.routeId?.toString() || '') ||
        address.trim() !== (originalShop?.address || '') ||
        phone.trim() !== (originalShop?.phone || '')
      )
    : !shopName.trim() || !selectedRouteId; 

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

      <PageHeader title={t.addShopTitle || 'කඩවල් කළමනාකරණය'} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 hide-scrollbar">
        
        {routes.length === 0 && (
          <div className="bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-600 text-orange-800 dark:text-orange-300 p-4 mb-6 rounded-lg shadow-sm transition-colors">
            <p className="font-bold text-[16px]">{t.attention}</p>
            <p className="text-sm font-medium mt-1">{t.createRouteFirst}</p>
          </div>
        )}

        <button 
          onClick={toggleForm}
          className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all shadow-sm mb-6 ${
            isFormOpen 
            ? 'border-[#14348c] dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : `border-dashed ${theme.colors.inputBorder} ${theme.colors.cardBg} hover:bg-gray-50 dark:hover:bg-gray-800/50`
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFormOpen ? 'bg-[#14348c] text-white dark:bg-blue-600' : 'bg-blue-100 dark:bg-gray-800 text-[#14348c] dark:text-blue-400'}`}>
              <Store size={20} />
            </div>
            <span className={`font-bold text-[16px] ${isFormOpen ? 'text-[#14348c] dark:text-blue-300' : theme.colors.inputText}`}>
              {editingShopId ? t.updateShopBtn : t.addNewShopBtn}
            </span>
          </div>
          {isFormOpen ? <ChevronUp size={24} className="text-[#14348c] dark:text-blue-400" /> : <Plus size={24} className={theme.colors.mutedText} />}
        </button>

        {isFormOpen && (
          <div className="mb-8 p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-md transition-all animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleSaveShop} className="space-y-5">
              
              <FormInput label={t.shopNameLabel} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={t.shopNamePlaceholder} icon={Store} required />
              
              <FormSelect 
                label={t.routeLabel} value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} 
                options={routeOptions} disabled={routes.length === 0} icon={MapIcon} required
                placeholderOption={routes.length === 0 ? t.createRouteFirstOption : undefined}
              />

              <FormInput label={t.addressLabel} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} icon={MapPin} />
              
              <FormInput type="tel" label={t.phoneLabel} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} icon={Phone} />

              <div className="flex gap-3 pt-2">
                <div className="flex-1">
                  <PrimaryButton 
                    type="submit" 
                    disabled={routes.length === 0 || isSubmitDisabled} 
                    icon={Save}
                    className={routes.length === 0 || isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {editingShopId ? t.updateShopBtn : t.saveShopBtn}
                  </PrimaryButton>
                </div>
                {editingShopId && (
                  <button type="button" onClick={resetForm} className="px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors hover:bg-gray-300 dark:hover:bg-gray-600">
                    <X size={24} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div>
          <h2 className={`text-[16px] font-bold ${theme.colors.headerText} mb-3 flex items-center gap-2`}>
            <List size={18} className={theme.colors.mutedText} /> {t.existingShopsTitle || "දැනට ඇති කඩවල්"}
          </h2>
          
          {existingShops.length === 0 ? (
            <p className={`text-sm ${theme.colors.mutedText} text-center py-6 ${theme.colors.cardBg} rounded-xl border ${theme.colors.inputBorder} transition-colors`}>
              {t.noShopsAddedYet || "තවමත් කඩවල් ඇතුලත් කර නැත."}
            </p>
          ) : (
            <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden transition-colors`}>
              {existingShops.map((shop, index) => (
                <div key={shop.id} className={`flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 ${editingShopId === shop.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold ${theme.colors.inputText} text-[15px]`}>{shop.shopName}</h3>
                      <p className={`text-[12px] font-bold mt-0.5 ${theme.colors.mutedText} flex items-center gap-1`}>
                        <MapIcon size={12} className="text-green-600 dark:text-green-400"/> {routesMap[shop.routeId] || 'Unknown Route'}
                      </p>
                      {(shop.address || shop.phone) && (
                        <p className={`text-[11px] font-medium mt-0.5 text-gray-400 dark:text-gray-500`}>
                          {shop.address} {shop.address && shop.phone ? '•' : ''} {shop.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button onClick={() => handleEditClick(shop)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(shop.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}