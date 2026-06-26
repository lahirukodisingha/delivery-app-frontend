import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { CloudLightning, CheckCircle2, AlertCircle, Wifi, WifiOff, RefreshCw, Store, MapPin, PackagePlus, Receipt, Wallet, User, Building2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function BackupSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [language, setLanguage] = useState('si');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [pendingCounts, setPendingCounts] = useState({
    routes: 0, shops: 0, items: 0, bills: 0, expenses: 0, profile: 0, settings: 0, total: 0
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage') || 'si';
    setLanguage(savedLanguage);
  }, []);

  const t = translations[language] || translations['si'];

  const loadPendingCounts = async () => {
    try {
      const routes = await db.routes.filter(x => x.syncStatus === 'pending').count();
      const shops = await db.shops.filter(x => x.syncStatus === 'pending').count();
      const items = await db.items.filter(x => x.syncStatus === 'pending').count();
      const bills = await db.bills.filter(x => x.syncStatus === 'pending').count();
      const expenses = await db.expenses.filter(x => x.syncStatus === 'pending').count();
      
      const profileData = await db.profile.get(1);
      const settingsData = await db.settings.toArray();

      const profileCount = (profileData && profileData.syncStatus === 'pending') ? 1 : 0;
      const settingsCount = (settingsData.length > 0 && settingsData[0].syncStatus === 'pending') ? 1 : 0;

      const total = routes + shops + items + bills + expenses + profileCount + settingsCount;
      setPendingCounts({ routes, shops, items, bills, expenses, profile: profileCount, settings: settingsCount, total });
    } catch (error) {
      console.error("Error loading pending counts:", error);
    }
  };

  useEffect(() => {
    loadPendingCounts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (!isOnline) {
      setIsError(true);
      setMessage(t.offlineStatus || "අන්තර්ජාල සම්බන්ධතාවයක් නොමැත!");
      return;
    }

    if (pendingCounts.total === 0) {
      setIsError(false);
      setMessage(t.allDataUpToDate || "සියලුම දත්ත යාවත්කාලීනයි!");
      return;
    }

    setIsSyncing(true);
    setMessage(t.syncing || "සමකාලීන වෙමින් පවතී...");
    setIsError(false);

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setIsError(true);
      setMessage("User not found!");
      setIsSyncing(false);
      return;
    }
    const username = JSON.parse(userStr).username;

    try {
      const payload = { username };
      
      const routes = await db.routes.filter(x => x.syncStatus === 'pending').toArray();
      if (routes.length > 0) payload.routes = routes;

      const shops = await db.shops.filter(x => x.syncStatus === 'pending').toArray();
      if (shops.length > 0) payload.shops = shops;

      const items = await db.items.filter(x => x.syncStatus === 'pending').toArray();
      if (items.length > 0) payload.items = items;

      const bills = await db.bills.filter(x => x.syncStatus === 'pending').toArray();
      if (bills.length > 0) {
        payload.bills = [];
        for (let b of bills) {
          const bItems = await db.billItems.filter(bi => bi.billId === b.id).toArray();
          payload.bills.push({ ...b, items: bItems });
        }
      }

      const expenses = await db.expenses.filter(x => x.syncStatus === 'pending').toArray();
      if (expenses.length > 0) payload.expenses = expenses;

      if (pendingCounts.profile > 0) payload.profile = await db.profile.get(1);
      if (pendingCounts.settings > 0) payload.settings = (await db.settings.toArray())[0];

      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        await db.transaction('rw', db.routes, db.shops, db.items, db.bills, db.billItems, db.expenses, db.profile, db.settings, async () => {
          if (routes.length > 0) await db.routes.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          if (shops.length > 0) await db.shops.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          if (items.length > 0) await db.items.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          if (bills.length > 0) {
            await db.bills.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
            await db.billItems.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          }
          if (expenses.length > 0) await db.expenses.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          if (pendingCounts.profile > 0) await db.profile.update(1, { syncStatus: 'synced' });
          if (pendingCounts.settings > 0) {
             const sets = await db.settings.toArray();
             if (sets.length > 0) await db.settings.update(sets[0].id, { syncStatus: 'synced' });
          }
        });

        await loadPendingCounts();
        setMessage(t.allDataUpToDate || "සාර්ථකව සමකාලීන කරන ලදී!");
        setIsError(false);
      } else {
        throw new Error(data.error || 'Sync Failed');
      }

    } catch (error) {
      setIsError(true);
      setMessage(t.connectionError || "සර්වර් දෝෂයකි. නැවත උත්සාහ කරන්න.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const StatusRow = ({ icon: Icon, label, count, colorClass }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${colorClass.border} ${colorClass.bg} shadow-sm`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className={colorClass.icon} />
        <span className={`font-bold text-[15px] ${colorClass.text}`}>{label}</span>
      </div>
      <div className={`px-3 py-1 rounded-lg font-bold text-[14px] ${colorClass.badgeBg} ${colorClass.text}`}>
        {count > 0 ? `${count} ${t.pendingSend || 'යැවීමට ඇත'}` : (t.completed || 'සම්පූර්ණයි')}
      </div>
    </div>
  );

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      <PageHeader title={t.backupSyncTitle || "දත්ත සුරැකීම"} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 hide-scrollbar">
        
        <div className={`mb-6 p-5 rounded-2xl border ${isOnline ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'} flex items-center justify-between shadow-sm`}>
          <div>
            <p className={`font-bold text-[16px] ${isOnline ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isOnline ? (t.onlineStatus || 'Online') : (t.offlineStatus || 'Offline')}
            </p>
            <p className={`text-[12px] mt-1 font-medium ${isOnline ? 'text-green-600/80 dark:text-green-500' : 'text-red-600/80 dark:text-red-500'}`}>
              {isOnline ? 'Cloud sync is available' : 'Please check your connection'}
            </p>
          </div>
          {isOnline ? <Wifi size={32} className="text-green-500" /> : <WifiOff size={32} className="text-red-500" />}
        </div>

        <div className="mb-6 flex justify-between items-end">
          <h2 className={`font-bold text-[16px] ${theme.colors.headerText}`}>{t.pendingChanges || "වෙනස්කම් සමකාලීන වීමට ඇත"}</h2>
          <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            Total: {pendingCounts.total}
          </span>
        </div>

        <div className="space-y-3 mb-8">
          <StatusRow icon={MapPin} label={t.lblRoutes || "Routes"} count={pendingCounts.routes} colorClass={{ bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500', text: 'text-orange-700 dark:text-orange-300', badgeBg: 'bg-orange-100 dark:bg-orange-900/50' }} />
          <StatusRow icon={Store} label={t.lblShops || "Shops"} count={pendingCounts.shops} colorClass={{ bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', text: 'text-purple-700 dark:text-purple-300', badgeBg: 'bg-purple-100 dark:bg-purple-900/50' }} />
          <StatusRow icon={PackagePlus} label={t.lblItems || "Items"} count={pendingCounts.items} colorClass={{ bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', icon: 'text-teal-500', text: 'text-teal-700 dark:text-teal-300', badgeBg: 'bg-teal-100 dark:bg-teal-900/50' }} />
          <StatusRow icon={Receipt} label={t.lblBills || "Bills"} count={pendingCounts.bills} colorClass={{ bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-700 dark:text-blue-300', badgeBg: 'bg-blue-100 dark:bg-blue-900/50' }} />
          <StatusRow icon={Wallet} label={t.lblExpenses || "Expenses"} count={pendingCounts.expenses} colorClass={{ bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', icon: 'text-rose-500', text: 'text-rose-700 dark:text-rose-300', badgeBg: 'bg-rose-100 dark:bg-rose-900/50' }} />
          <StatusRow icon={User} label={t.lblProfile || "Profile"} count={pendingCounts.profile} colorClass={{ bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50' }} />
          <StatusRow icon={Building2} label={t.lblSettings || "Settings"} count={pendingCounts.settings} colorClass={{ bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'text-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', badgeBg: 'bg-cyan-100 dark:bg-cyan-900/50' }} />
        </div>

        <button 
          onClick={syncData} 
          disabled={isSyncing || pendingCounts.total === 0 || !isOnline}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            isSyncing || pendingCounts.total === 0 || !isOnline
              ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 shadow-none cursor-not-allowed' 
              : 'bg-[#14348c] text-white hover:bg-blue-800 active:scale-95 shadow-blue-500/30'
          }`}
        >
          {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <CloudLightning size={20} />}
          {isSyncing ? (t.syncing || 'සමකාලීන වෙමින් පවතී...') : (t.syncNowBtn || 'දැන් සමකාලීන කරන්න')}
        </button>

        {message && (
          <div className={`mt-5 p-4 rounded-xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${isError ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
            {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-bold text-sm">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}