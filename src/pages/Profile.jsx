import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations'; 
import { Camera, User, Lock, Globe, Moon, Sun, Save } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const [isChecking, setIsChecking] = useState(true);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState(''); 
  
  const [profilePic, setProfilePic] = useState(null);
  const [originalProfilePic, setOriginalProfilePic] = useState(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [language, setLanguage] = useState('si'); 
  const [themeMode, setThemeMode] = useState('light'); 

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        navigate('/');
        return;
      } 

      const user = JSON.parse(userStr);
      
      const savedTheme = localStorage.getItem('themeMode') || 'light';
      const savedLanguage = localStorage.getItem('appLanguage') || 'si';
      
      setThemeMode(savedTheme);
      setLanguage(savedLanguage);

      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // IndexedDB එකෙන් Profile දත්ත ලබාගැනීම
      const profileData = await db.profile.get(1);
      
      if (profileData) {
        setName(profileData.username || user.username || '');
        setOriginalName(profileData.username || user.username || '');
        setProfilePic(profileData.profilePic || null);
        setOriginalProfilePic(profileData.profilePic || null);
      } else {
        setName(user.username || '');
        setOriginalName(user.username || '');
      }

      setIsChecking(false);
    };

    loadProfile();
  }, [navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert(language === 'si' ? 'ඡායාරූපයේ ප්‍රමාණය වැඩියි (උපරිම 2MB)' : 'File is too large (Max 2MB)', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    const userStr = localStorage.getItem('user');
    let user = null;
    let isPassChanged = false;

    if (userStr) {
      user = JSON.parse(userStr);
      
      // 1. මුරපදය වෙනස් කර ඇත්නම් සෘජුවම Backend එකට යැවීම
      if (newPassword.trim().length > 0) {
        if (currentPassword.trim().length === 0) {
          showAlert(language === 'si' ? 'දැනට ඇති මුරපදය ඇතුලත් කරන්න' : 'Please enter current password', 'error');
          return;
        }

        if (!navigator.onLine) {
          showAlert(language === 'si' ? 'මුරපදය වෙනස් කිරීමට අන්තර්ජාල සම්බන්ධතාවයක් අවශ්‍යයි!' : 'Internet connection required to change password!', 'error');
          return;
        }

        try {
          const API_URL = import.meta.env.VITE_API_URL || 'https://delivery-app-frontend-gamma.vercel.app';
          
          const res = await fetch(`${API_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username, // මුල් නමම භාවිතා කරයි
              currentPassword: currentPassword,
              newPassword: newPassword
            })
          });

          const data = await res.json();
          
          if (!res.ok) {
            showAlert(data.error || 'මුරපදය වෙනස් කිරීම අසාර්ථකයි', 'error');
            return; 
          }
          
          isPassChanged = true;
          
        } catch (error) {
          console.error("Password change error:", error);
          showAlert(language === 'si' ? 'සර්වර් එක හා සම්බන්ධ වීමට නොහැක' : 'Could not connect to server', 'error');
          return;
        }
      }

      // 2. අනෙකුත් දත්ත Local DB එකට සේව් කිරීම (Username එක වෙනස් නොකර)
      const existingProfile = await db.profile.get(1);
      if (!isPassChanged) {
        isPassChanged = existingProfile?.passwordChanged || false;
      }

      // මෙහි තිබූ user.username = name.trim(); ඉවත් කර ඇත. මුල් නම එලෙසම පවතී.
      
      await db.profile.put({
        id: 1,
        username: user.username, // සෑමවිටම මුල් නමම යොදයි
        profilePic: profilePic,
        passwordChanged: isPassChanged,
        syncStatus: 'pending' 
      });

      delete user.profilePic;
      localStorage.setItem('user', JSON.stringify(user));
    }

    setOriginalProfilePic(profilePic); 
    setCurrentPassword(''); 
    setNewPassword('');
    
    showAlert(t.successMsg || 'සාර්ථකව යාවත්කාලීන කරන ලදී!', 'success', false); 
  };


  const handleThemeChange = (e) => {
    const selectedTheme = e.target.value;
    setThemeMode(selectedTheme);
    localStorage.setItem('themeMode', selectedTheme); 

    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    localStorage.setItem('appLanguage', selectedLang); 
  };

  if (isChecking) return <LoadingScreen />;

  const languageOptions = [
    { value: 'si', label: 'සිංහල (Sinhala)' },
    { value: 'en', label: 'English' },
    { value: 'ta', label: 'தமிழ் (Tamil)' }
  ];

  const themeOptions = [
    { value: 'light', label: t.lightMode },
    { value: 'dark', label: t.darkMode }
  ];

  const isModified = 
    (name.trim() !== originalName) || 
    (currentPassword.length > 0) || 
    (newPassword.length > 0) ||
    (profilePic !== originalProfilePic);
    
  const isSubmitDisabled = !isModified;

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

      <PageHeader title={t.profile} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-12 hide-scrollbar">
        
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className={`w-32 h-32 ${theme.colors.cardBg} rounded-full border-4 border-white dark:border-gray-700 shadow-md flex items-center justify-center overflow-hidden transition-colors`}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className={theme.colors.mutedText} />
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className={`absolute bottom-1 right-1 ${theme.colors.buttonBg} p-2.5 rounded-full border-2 border-white dark:border-gray-800 shadow-md ${theme.colors.buttonHover} transition`}
            >
              <Camera size={20} color="white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          <FormInput 
            label={t.nameLabel} 
            value={name}  
            icon={User} 
            disabled={true}
            className="opacity-70 cursor-not-allowed"
            required 
          />

          <div className={`bg-blue-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-blue-100 dark:border-gray-700 space-y-4 transition-colors`}>
            <h3 className="font-bold text-[#14348c] dark:text-blue-400 text-[15px] flex items-center gap-2 mb-2">
              <Lock size={18} /> {t.changePassword}
            </h3>
            
            <FormInput 
              type="password"
              label={t.currentPassword}
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder={t.currentPassword} 
            />
            
            <FormInput 
              type="password"
              label={t.newPassword}
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder={t.newPassword} 
            />
          </div>

          <PrimaryButton 
            type="submit" 
            icon={Save}
            disabled={isSubmitDisabled}
            className={isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {t.saveChanges}
          </PrimaryButton>
        </form>

        <hr className={`${theme.colors.divider} border-t my-8 transition-colors`} />

        <div className="space-y-6">
          
          <FormSelect 
            label={t.language}
            value={language}
            onChange={handleLanguageChange}
            options={languageOptions}
            icon={Globe}
          />

          <FormSelect 
            label={t.theme}
            value={themeMode}
            onChange={handleThemeChange}
            options={themeOptions}
            icon={themeMode === 'light' ? Sun : Moon}
          />

        </div>

      </div>
    </div>
  );
}