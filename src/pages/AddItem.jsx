import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations'; 
import { Save, PackagePlus, Plus, ChevronUp, Edit, Trash2, List, X, Box } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert'; // අලුත් ඇලට් එක

export default function AddItem() {
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
  const [editingItemId, setEditingItemId] = useState(null);
  const [originalItem, setOriginalItem] = useState(null);

  // Form States
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('packet');
  const [unitPrice, setUnitPrice] = useState('');
  
  // Data States
  const [existingItems, setExistingItems] = useState([]);
  const [language, setLanguage] = useState('si');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');

    const loadItems = async () => {
      try {
        const loadedItems = await db.items.toArray();
        setExistingItems(loadedItems);
        setIsChecking(false);
      } catch (error) {
        console.error("Failed to load items", error);
        setIsChecking(false);
      }
    };
    loadItems();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  // ඇලට් එක වසා දැමීමට
  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  // ඇලට් පෙන්වීමට හදාගත් function එක
  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const resetForm = () => {
    setItemName('');
    setUnit('packet');
    setUnitPrice('');
    setEditingItemId(null);
    setOriginalItem(null);
    setIsFormOpen(false);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItemId) {
        await db.items.update(editingItemId, { 
          itemName: itemName.trim(), 
          unit, 
          unitPrice: parseFloat(unitPrice) || 0 ,
          syncStatus: 'pending'
        });
        showAlert(t.itemUpdatedSuccess || 'භාණ්ඩය සාර්ථකව යාවත්කාලීන කළා!', 'success');
      } else {
        await db.items.add({ 
          itemName: itemName.trim(), 
          unit, 
          unitPrice: parseFloat(unitPrice) || 0 ,
          syncStatus: 'pending'
        });
        showAlert(t.itemSavedSuccess || 'භාණ්ඩය සාර්ථකව සුරකින ලදී!', 'success');
      }
      
      setExistingItems(await db.items.toArray());
      resetForm();
    } catch (error) {
      showAlert(t.saveError || 'සුරැකීමේදී දෝෂයක් මතු විය!', 'error');
    }
  };

  const handleEditClick = (item) => {
    setItemName(item.itemName);
    setUnit(item.unit || 'packet');
    setUnitPrice(item.unitPrice.toString());
    
    setEditingItemId(item.id);
    setOriginalItem(item);
    
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    showAlert(
      t.deleteItemConfirm || 'මෙම භාණ්ඩය මකා දැමීමට අවශ්‍ය බව ඔබට විශ්වාසද?', 
      'confirm', 
      true, 
      async () => {
        try {
          await db.items.delete(id);
          setExistingItems(await db.items.toArray());
          
          setTimeout(() => {
            showAlert(t.itemDeletedSuccess || 'භාණ්ඩය සාර්ථකව මකා දමන ලදී!', 'success');
          }, 300);
          
          if (editingItemId === id) {
            resetForm();
          }
        } catch (error) {
          setTimeout(() => {
            showAlert("Error deleting item", 'error');
          }, 300);
        }
      }
    );
  };

  const toggleForm = () => {
    if (isFormOpen) {
      resetForm();
    } else {
      setIsFormOpen(true);
    }
  };

  const unitOptions = [
    { value: 'packet', label: 'packet' }, { value: 'kg', label: 'kg' }, { value: 'g', label: 'g' },
    { value: 'L', label: 'L' }, { value: 'ml', label: 'ml' }, { value: 'bottle', label: 'bottle' },
    { value: 'box', label: 'box' }, { value: 'piece', label: 'piece' }
  ];

  if (isChecking) return <LoadingScreen />;

  // Button Disable කිරීමේ ලොජික් එක
  const isSubmitDisabled = editingItemId 
    ? !(
        itemName.trim() !== (originalItem?.itemName || '') ||
        unit !== (originalItem?.unit || 'packet') ||
        unitPrice.toString().trim() !== (originalItem?.unitPrice?.toString() || '')
      )
    : !itemName.trim() || !unitPrice.toString().trim(); 

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      {/* Alert Component එක Render කිරීම */}
      <CustomAlert 
        message={alertConfig.message} 
        type={alertConfig.type} 
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={closeAlert} 
        language={language}
      />

      <PageHeader title={t.addItemTitle || "භාණ්ඩ කළමනාකරණය"} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 hide-scrollbar">
        
        {/* Add New Item Toggle Button */}
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
              <PackagePlus size={20} />
            </div>
            <span className={`font-bold text-[16px] ${isFormOpen ? 'text-[#14348c] dark:text-blue-300' : theme.colors.inputText}`}>
              {editingItemId ? t.updateItemBtn : t.addNewItemBtn}
            </span>
          </div>
          {isFormOpen ? <ChevronUp size={24} className="text-[#14348c] dark:text-blue-400" /> : <Plus size={24} className={theme.colors.mutedText} />}
        </button>

        {/* Expandable Form (පින්තූර අප්ලෝඩ් කිරීම ඉවත් කර ඇත) */}
        {isFormOpen && (
          <div className="mb-8 p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-md transition-all animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleSaveItem} className="space-y-5">
              
              <FormInput label={t.itemNameLabel} value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={t.itemNamePlaceholder} icon={Box} required />
              
              <FormSelect label={t.unitLabel} value={unit} onChange={(e) => setUnit(e.target.value)} options={unitOptions} />
              
              <FormInput type="number" step="0.01" label={t.unitPriceLabel} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder={t.unitPricePlaceholder} required />

              <div className="flex gap-3 pt-2">
                <div className="flex-1">
                  <PrimaryButton 
                    type="submit" 
                    icon={Save}
                    disabled={isSubmitDisabled}
                    className={isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {editingItemId ? t.updateItemBtn : t.saveItemBtn}
                  </PrimaryButton>
                </div>
                {editingItemId && (
                  <button type="button" onClick={resetForm} className="px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95">
                    <X size={24} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Existing Items List */}
        <div>
          <h2 className={`text-[16px] font-bold ${theme.colors.headerText} mb-3 flex items-center gap-2`}>
            <List size={18} className={theme.colors.mutedText} /> {t.existingItemsTitle || "දැනට ඇති භාණ්ඩ"}
          </h2>
          
          {existingItems.length === 0 ? (
            <p className={`text-sm ${theme.colors.mutedText} text-center py-6 ${theme.colors.cardBg} rounded-xl border ${theme.colors.inputBorder} transition-colors`}>
              {t.noItemsAddedYet || "තවමත් භාණ්ඩ ඇතුලත් කර නැත."}
            </p>
          ) : (
            <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden transition-colors`}>
              {existingItems.map((item, index) => (
                <div key={item.id} className={`flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 ${editingItemId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold ${theme.colors.inputText} text-[15px]`}>{item.itemName}</h3>
                      <p className={`text-[12px] font-bold mt-0.5 text-green-600 dark:text-green-400`}>
                        රු. {parseFloat(item.unitPrice).toFixed(2)} <span className="text-gray-400 dark:text-gray-500 font-medium">/ {item.unit}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button onClick={() => handleEditClick(item)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(item.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
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