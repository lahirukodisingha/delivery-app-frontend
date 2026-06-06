import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations'; 
import { MapPin, Save, List, Edit, Trash2, X } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

export default function AddRoute() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });
  
  const [routeName, setRouteName] = useState('');
  const [existingRoutes, setExistingRoutes] = useState([]);
  const [language, setLanguage] = useState('si');
  
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [originalRouteName, setOriginalRouteName] = useState(''); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');

    const loadRoutes = async () => {
      setExistingRoutes(await db.routes.toArray());
      setIsChecking(false);
    };
    loadRoutes();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const formattedName = routeName.trim();

      // =======================================================
      // Duplicate Route Validation (Offline Check)
      // =======================================================
      const isDuplicate = existingRoutes.some(
        route => 
          route.routeName.toLowerCase() === formattedName.toLowerCase() && 
          route.id !== editingRouteId // Edit කරන වෙලාවට එයාගේම නම Duplicate එකක් විදිහට ගන්නැති වෙන්න
      );

      if (isDuplicate) {
        showAlert(t.duplicateRouteAlert || 'Route already exists!', 'error');
        return; // Duplicate නම් මෙතනින් නවතී, සේව් වෙන්නේ නෑ.
      }
      // =======================================================

      if (editingRouteId) {
        await db.routes.update(editingRouteId, { routeName: formattedName, syncStatus: 'pending' });
        showAlert(t.routeUpdatedSuccess || 'ගමන් මාර්ගය සාර්ථකව යාවත්කාලීන කරන ලදී!', 'success');
      } else {
        await db.routes.add({ routeName: formattedName, syncStatus: 'pending' });
        showAlert(t.routeSavedSuccess || 'රූට් එක සාර්ථකව සුරැකුවා!', 'success');
      }
      
      setRouteName(''); 
      setEditingRouteId(null);
      setOriginalRouteName('');
      setExistingRoutes(await db.routes.toArray());
      
    } catch (error) {
      showAlert(t.saveError || 'සුරැකීමේදී දෝෂයක් මතු විය!', 'error');
    }
  };

  const handleEditClick = (route) => {
    setRouteName(route.routeName);
    setOriginalRouteName(route.routeName); 
    setEditingRouteId(route.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDeleteClick = (id) => {
    showAlert(
      t.deleteRouteConfirm || 'මෙම ගමන් මාර්ගය මකා දැමීමට අවශ්‍ය බව ඔබට විශ්වාසද?', 
      'confirm', 
      true,  
      async () => { 
        try {
          await db.routes.delete(id);
          setExistingRoutes(await db.routes.toArray());
          
          setTimeout(() => {
            showAlert(t.routeDeletedSuccess || 'ගමන් මාර්ගය මකා දමන ලදී!', 'success');
          }, 300);
          
          if (editingRouteId === id) {
            setRouteName('');
            setEditingRouteId(null);
            setOriginalRouteName('');
          }
        } catch (error) {
          setTimeout(() => {
            showAlert("Error deleting route", 'error');
          }, 300);
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setRouteName('');
    setEditingRouteId(null);
    setOriginalRouteName('');
  };

  if (isChecking) return <LoadingScreen />;

  const isSubmitDisabled = !routeName.trim() || (editingRouteId && routeName.trim() === originalRouteName.trim());

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

      <PageHeader title={t.addRouteTitle} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 hide-scrollbar">
        <form onSubmit={handleSaveRoute} className="space-y-6 mb-8">
          <FormInput 
            label={t.routeNameLabel} 
            value={routeName} 
            onChange={(e) => setRouteName(e.target.value)} 
            placeholder={t.routeNamePlaceholder} 
            icon={MapPin} 
            required 
          />
          
          <div className="flex gap-3">
            <div className="flex-1">
              <PrimaryButton 
                type="submit" 
                icon={Save} 
                disabled={isSubmitDisabled} 
                className={isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {editingRouteId ? (t.updateRouteBtn || 'Update Route') : t.saveRouteBtn}
              </PrimaryButton>
            </div>
            
            {editingRouteId && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </form>

        <div className="mt-6">
          <h2 className={`text-[16px] font-bold ${theme.colors.headerText} mb-3 flex items-center gap-2`}>
            <List size={18} className={theme.colors.mutedText} /> {t.existingRoutesTitle}
          </h2>
          
          {existingRoutes.length === 0 ? (
            <p className={`text-sm ${theme.colors.mutedText} text-center py-4 ${theme.colors.cardBg} rounded-xl border ${theme.colors.inputBorder} transition-colors`}>
              {t.noRoutesYet}
            </p>
          ) : (
            <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden transition-colors`}>
              {existingRoutes.map((route, index) => (
                <div key={route.id} className={`flex items-center justify-between p-4 border-b ${theme.colors.divider} last:border-0 ${editingRouteId === route.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400 flex items-center justify-center font-bold text-sm mr-3 transition-colors shrink-0">
                      {index + 1}
                    </div>
                    <p className={`font-bold ${theme.colors.inputText} text-[15px]`}>{route.routeName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button 
                      type="button"
                      onClick={() => handleEditClick(route)}
                      className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteClick(route.id)}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
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