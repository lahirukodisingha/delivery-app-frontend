import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { db } from '../db/database'; 

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const [language, setLanguage] = useState('si');
  const navigate = useNavigate();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    
    setLanguage(savedLanguage);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } else {
      setIsChecking(false); 
    }
  }, [navigate]);

  const t = translations[language] || translations['si'];

  if (isChecking) {
    return <div className={`min-h-screen flex items-center justify-center ${theme.colors.background} ${theme.colors.headerText}`}>Loading...</div>; 
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); 

        if (data.user.role === 'admin') {
          setIsLoading(false);
          navigate('/admin'); 
        } else {
          try {
            const syncRes = await fetch(`https://delivery-app-backend-coral.vercel.app/api/sync/initial-data?username=${username}`);
            if (syncRes.ok) {
              const dbData = await syncRes.json();
              
              await Promise.all([
                db.settings.clear(),
                db.profile.clear(),
                db.routes.clear(),
                db.shops.clear(),
                db.items.clear(),
                db.bills.clear(),
                db.billItems.clear(),
                db.expenses.clear()
              ]);

              // =========================================================================
              // මෙහිදී දත්ත සියල්ල එකවර (Concurrently) ඇතුලත් කර Login එක ඉතා වේගවත් කරයි
              // =========================================================================
              const putPromises = [];
              if(dbData.settings?.length > 0) putPromises.push(db.settings.bulkPut(dbData.settings));
              if(dbData.profile?.length > 0) putPromises.push(db.profile.bulkPut(dbData.profile));
              if(dbData.routes?.length > 0) putPromises.push(db.routes.bulkPut(dbData.routes));
              if(dbData.shops?.length > 0) putPromises.push(db.shops.bulkPut(dbData.shops));
              if(dbData.items?.length > 0) putPromises.push(db.items.bulkPut(dbData.items));
              if(dbData.bills?.length > 0) putPromises.push(db.bills.bulkPut(dbData.bills));
              if(dbData.billItems?.length > 0) putPromises.push(db.billItems.bulkPut(dbData.billItems));
              if(dbData.expenses?.length > 0) putPromises.push(db.expenses.bulkPut(dbData.expenses));
              
              await Promise.all(putPromises);

              if(dbData.appSettings) {
                localStorage.setItem('appSettings', JSON.stringify(dbData.appSettings));
              }
            }
          } catch (syncErr) {
            console.error("Data Sync Error at Login:", syncErr);
          }
          
          setIsLoading(false);
          navigate('/home'); 
        }
      } else {
        setError(data.error || t.loginFailed);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(t.serverError);
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${theme.colors.background} p-4 transition-colors duration-300`}>
      <div className={`w-full max-w-md ${theme.colors.cardBg} rounded-2xl shadow-xl p-8 border ${theme.colors.divider} transition-colors`}>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#14348c] dark:text-blue-400">{t.loginTitle}</h1>
          <p className={`${theme.colors.mutedText} mt-2`}>{t.loginSubtitle}</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 mb-6 rounded text-sm transition-colors text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className={`block ${theme.colors.labelText} font-medium mb-2`}>{t.usernameLabel}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} focus:outline-none ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm transition-colors`}
              placeholder={t.usernamePlaceholder}
              required
            />
          </div>

          <div>
            <label className={`block ${theme.colors.labelText} font-medium mb-2`}>{t.passwordLabel}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} focus:outline-none ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm transition-colors`}
              placeholder={t.passwordPlaceholder}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full ${theme.colors.buttonText} font-bold py-3.5 rounded-xl shadow-md transition duration-300 ${isLoading ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed' : `${theme.colors.buttonBg} ${theme.colors.buttonHover}`}`}
          >
            {isLoading ? t.loggingInBtn : t.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
}