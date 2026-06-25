import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations'; 
import { Save, Building2, MapPin, Phone, FileBadge, Camera, Image as ImageIcon } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

export default function BusinessProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isChecking, setIsChecking] = useState(true);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({ message: '', type: 'success' });

  // Form States
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null); 
  const [existingSettingId, setExistingSettingId] = useState(null); 

  // වෙනස්කම් හඳුනාගැනීම සඳහා මුල් දත්ත
  const [originalData, setOriginalData] = useState({
    businessName: '',
    address: '',
    phone1: '',
    phone2: '',
    regNumber: '',
    businessLogo: null
  });

  const [language, setLanguage] = useState('si');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);

    const loadSettings = async () => {
      try {
        const settingsData = await db.settings.toArray();
        if (settingsData.length > 0) {
          const currentSettings = settingsData[0];
          
          setExistingSettingId(currentSettings.id);
          setBusinessName(currentSettings.businessName || '');
          setAddress(currentSettings.address || '');
          setPhone1(currentSettings.phone1 || '');
          setPhone2(currentSettings.phone2 || '');
          setRegNumber(currentSettings.regNumber || '');
          setBusinessLogo(currentSettings.businessLogo || null);

          setOriginalData({
            businessName: currentSettings.businessName || '',
            address: currentSettings.address || '',
            phone1: currentSettings.phone1 || '',
            phone2: currentSettings.phone2 || '',
            regNumber: currentSettings.regNumber || '',
            businessLogo: currentSettings.businessLogo || null
          });
        }
        setIsChecking(false);
      } catch (error) {
        console.error("Failed to load settings", error);
        setIsChecking(false);
      }
    };

    loadSettings();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const showAlert = (message, type = 'success') => {
    setAlertConfig({ message, type });
  };

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { 
        showAlert(language === 'si' ? 'ඡායාරූපයේ ප්‍රමාණය වැඩියි (උපරිම 1MB)' : 'Logo is too large (Max 1MB)', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const settingData = {
        businessName: businessName.trim(),
        address: address.trim(),
        phone1: phone1.trim(),
        phone2: phone2.trim(),
        regNumber: regNumber.trim(),
        businessLogo: businessLogo ,
        syncStatus: 'pending'
      };

      if (existingSettingId) {
        await db.settings.update(existingSettingId, settingData);
      } else {
        await db.settings.add(settingData);
      }

      // මුල් දත්ත State එක අලුත් දත්ත වලින් යාවත්කාලීන කිරීම
      setOriginalData(settingData);
      
      // හෝම් එකට යවන්නේ නැතුව Alert එක පමණක් පෙන්වීම
      showAlert(t.settingsSavedSuccess || 'සාර්ථකව යාවත්කාලීන කරන ලදී!', 'success');
      
    } catch (error) {
      showAlert(translations[language]?.saveError || 'සුරැකීමේදී දෝෂයක් මතු විය!', 'error');
    }
  };

  if (isChecking) return <LoadingScreen />;

  // වෙනස්කම් ට්‍රැක් කිරීම
  const isModified = 
    businessName.trim() !== originalData.businessName ||
    address.trim() !== originalData.address ||
    phone1.trim() !== originalData.phone1 ||
    phone2.trim() !== originalData.phone2 ||
    regNumber.trim() !== originalData.regNumber ||
    businessLogo !== originalData.businessLogo;

  const isSubmitDisabled = !isModified || !businessName.trim();

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      <CustomAlert 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onClose={closeAlert} 
        language={language}
      />

      <PageHeader title={t.businessProfile || "ව්‍යාපාරික තොරතුරු"} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 hide-scrollbar">
        
        <div className="flex flex-col items-center mb-8">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleLogoChange} 
          />
          <div className="relative">
            <div className={`w-32 h-32 ${theme.colors.cardBg} rounded-2xl border-2 border-dashed ${theme.colors.inputBorder} shadow-sm flex items-center justify-center overflow-hidden transition-colors`}>
              {businessLogo ? (
                <img src={businessLogo} alt="Business Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={40} className="mx-auto mb-1 opacity-20" />
                  <p className="text-[10px] font-bold text-gray-400">LOGO</p>
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute -bottom-2 -right-2 ${theme.colors.buttonBg} p-2.5 rounded-xl border-4 border-white dark:border-gray-900 shadow-lg ${theme.colors.buttonHover} transition-all active:scale-90`}
            >
              <Camera size={18} color="white" />
            </button>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-4 uppercase tracking-widest">{t.businessLogoTitle}</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          <FormInput 
            label={t.businessNameLabel} 
            value={businessName} 
            onChange={(e) => setBusinessName(e.target.value)} 
            placeholder={t.businessNamePlaceholder} 
            icon={Building2} 
            required 
          />

          <FormInput 
            label={t.addressLabel || "ලිපිනය"} 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            placeholder={t.addressPlaceholder2} 
            icon={MapPin} 
          />

          <FormInput 
            type="tel" 
            label={t.phone1Label} 
            value={phone1} 
            onChange={(e) => setPhone1(e.target.value)} 
            placeholder="077 XXX XXXX" 
            icon={Phone} 
          />

          <FormInput 
            type="tel" 
            label={t.phone2Label} 
            value={phone2} 
            onChange={(e) => setPhone2(e.target.value)} 
            placeholder="071 XXX XXXX" 
            icon={Phone} 
          />

          <FormInput 
            label={t.brNumberLabel} 
            value={regNumber} 
            onChange={(e) => setRegNumber(e.target.value)} 
            placeholder={t.brPlaceholder} 
            icon={FileBadge} 
          />

          <PrimaryButton 
            type="submit" 
            icon={Save} 
            disabled={isSubmitDisabled}
            className={`mt-8 ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.saveInfoBtn}
          </PrimaryButton>

        </form>
      </div>
    </div>
  );
}