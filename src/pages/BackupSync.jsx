import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { CloudLightning, CheckCircle2, AlertCircle, Wifi, WifiOff, RefreshCw, Store, MapPin, PackagePlus, Receipt, Wallet, User, Building2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function BackupSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // සියලුම වර්ග 7 සඳහාම State එක සකස් කිරීම
  const [pendingCounts, setPendingCounts] = useState({
    routes: 0, shops: 0, items: 0, bills: 0, expenses: 0, profile: 0, settings: 0, total: 0
  });

  // දත්ත ගණනය කිරීමේ Function එක (Profile සහ Settings ඇතුලත්ව)
  const loadPendingCounts = async () => {
    try {
      const routes = await db.routes.filter(x => x.syncStatus === 'pending').count();
      const shops = await db.shops.filter(x => x.syncStatus === 'pending').count();
      const items = await db.items.filter(x => x.syncStatus === 'pending').count();
      const bills = await db.bills.filter(x => x.syncStatus === 'pending').count();
      const expenses = await db.expenses.filter(x => x.syncStatus === 'pending').count();
      const profile = await db.profile.filter(x => x.syncStatus === 'pending').count();
      const settings = await db.settings.filter(x => x.syncStatus === 'pending').count();
      
      setPendingCounts({
        routes, shops, items, bills, expenses, profile, settings,
        total: routes + shops + items + bills + expenses + profile + settings
      });
    } catch (error) {
      console.error("Error loading pending counts:", error);
    }
  };

  useEffect(() => {
    loadPendingCounts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsError(true);
      setMessage('අන්තර්ජාල සම්බන්ධතාවයක් නොමැත. දත්ත දුරකථනයේ සුරක්ෂිතව ඇත.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(loadPendingCounts, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingCounts.total > 0 && !isSyncing) {
      handleAutoSync();
    }
  }, [isOnline, pendingCounts.total]);

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setMessage('දත්ත සර්වර් එකට යාවත්කාලීන වෙමින් පවතී...');
    setIsError(false);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error("පරිශීලක දත්ත නොමැත.");
      const user = JSON.parse(userStr);

      const pRoutes = await db.routes.filter(x => x.syncStatus === 'pending').toArray();
      const pShops = await db.shops.filter(x => x.syncStatus === 'pending').toArray();
      const pItems = await db.items.filter(x => x.syncStatus === 'pending').toArray();
      const pBills = await db.bills.filter(x => x.syncStatus === 'pending').toArray();
      const pExpenses = await db.expenses.filter(x => x.syncStatus === 'pending').toArray();
      const pSettings = await db.settings.filter(x => x.syncStatus === 'pending').toArray();
      const pProfile = await db.profile.filter(x => x.syncStatus === 'pending').toArray();
      const pBillItems = await db.billItems.filter(x => x.syncStatus === 'pending').toArray();

      const payload = {
        username: user.username,
        settings: pSettings, profile: pProfile, routes: pRoutes, 
        shops: pShops, items: pItems, bills: pBills, 
        billItems: pBillItems, expenses: pExpenses
      };

      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/sync/backup-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const markAsSynced = async (table, dataArray) => {
          const ids = dataArray.map(d => d.id);
          if(ids.length > 0) await db[table].where('id').anyOf(ids).modify({ syncStatus: 'synced' });
        };

        await markAsSynced('routes', pRoutes);
        await markAsSynced('shops', pShops);
        await markAsSynced('items', pItems);
        await markAsSynced('bills', pBills);
        await markAsSynced('expenses', pExpenses);
        await markAsSynced('settings', pSettings);
        await markAsSynced('profile', pProfile);
        await markAsSynced('billItems', pBillItems);
        
        setMessage('සියලුම දත්ත සාර්ථකව සර්වර් එකට යාවත්කාලීන විය!');
        loadPendingCounts(); 
      } else {
        setIsError(true);
        setMessage('සර්වර් දෝෂයකි. පසුව නැවත උත්සාහ කරනු ඇත.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('සර්වර් එක හා සම්බන්ධ වීමට නොහැක. පසුව ස්වයංක්‍රීයව යාවත්කාලීන වනු ඇත.');
    }
    
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const StatusRow = ({ icon: Icon, label, count, colorClass }) => (
    <div className={`flex justify-between items-center p-3 rounded-xl border mb-2 transition-colors ${count > 0 ? `${colorClass.bg} ${colorClass.border}` : `${theme.colors.cardBg} ${theme.colors.inputBorder}`}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} className={count > 0 ? colorClass.icon : theme.colors.mutedText} />
        <span className={`font-bold text-[14px] ${count > 0 ? colorClass.text : theme.colors.inputText}`}>{label}</span>
      </div>
      <span className={`font-bold px-3 py-1 rounded-lg text-[13px] ${count > 0 ? `${colorClass.badgeBg} ${colorClass.text}` : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
        {count > 0 ? `${count} යැවීමට ඇත` : 'සම්පූර්ණයි'}
      </span>
    </div>
  );

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col transition-colors duration-300`}>
      <PageHeader title="Cloud Sync (දත්ත සමමුහුර්තකරණය)" />
      
      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar">
        
        <div className={`flex items-center justify-center gap-2 py-3 rounded-xl mb-6 font-bold text-sm shadow-sm transition-all duration-500 ${isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-800'}`}>
           {isOnline ? <Wifi size={18}/> : <WifiOff size={18}/>}
           {isOnline ? "අන්තර්ජාලය හා සම්බන්ධයි (Online)" : "අන්තර්ජාලය නොමැත (Offline)"}
        </div>

        <div className="flex flex-col items-center mb-6">
           <div className="relative mb-3">
             <CloudLightning size={70} className={isOnline ? (isSyncing ? "text-[#14348c] dark:text-blue-400 animate-pulse" : "text-[#14348c] dark:text-blue-400") : "text-gray-400"} />
             {isSyncing && <RefreshCw size={24} className="absolute bottom-0 right-0 text-green-500 bg-white dark:bg-gray-900 rounded-full p-0.5 animate-spin" />}
           </div>
           
           <h2 className={`text-lg font-bold ${theme.colors.headerText} text-center`}>
             {isSyncing ? 'දත්ත යාවත්කාලීන වෙමින් පවතී...' : (pendingCounts.total === 0 ? 'සියලු දත්ත යාවත්කාලීනයි' : 'ස්වයංක්‍රීයව යාවත්කාලීන වීමට සූදානම්')}
           </h2>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-xl flex items-start gap-3 border shadow-sm ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {isError ? <AlertCircle size={20} className="shrink-0 mt-0.5"/> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
            <span className="font-bold text-[13px] leading-relaxed">{message}</span>
          </div>
        )}

        <hr className={`${theme.colors.divider} border-t mb-6`} />

        <h3 className={`font-bold text-[15px] ${theme.colors.headerText} mb-4`}>දත්ත තත්වය (Sync Status)</h3>
        
        {/* අලුතින් Profile සහ Settings ඇතුලත් කර ඇත */}
        <StatusRow icon={User} label="ප්‍රොෆයිල් දත්ත" count={pendingCounts.profile} colorClass={{ bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', icon: 'text-teal-500', text: 'text-teal-700 dark:text-teal-300', badgeBg: 'bg-teal-100 dark:bg-teal-900/50' }} />
        <StatusRow icon={Building2} label="ව්‍යාපාරික දත්ත" count={pendingCounts.settings} colorClass={{ bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50' }} />
        <StatusRow icon={Receipt} label="බිල්පත්" count={pendingCounts.bills} colorClass={{ bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-700 dark:text-blue-300', badgeBg: 'bg-blue-100 dark:bg-blue-900/50' }} />
        <StatusRow icon={Store} label="කඩවල්" count={pendingCounts.shops} colorClass={{ bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', text: 'text-purple-700 dark:text-purple-300', badgeBg: 'bg-purple-100 dark:bg-purple-900/50' }} />
        <StatusRow icon={MapPin} label="ගමන් මාර්ග" count={pendingCounts.routes} colorClass={{ bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500', text: 'text-orange-700 dark:text-orange-300', badgeBg: 'bg-orange-100 dark:bg-orange-900/50' }} />
        <StatusRow icon={PackagePlus} label="භාණ්ඩ" count={pendingCounts.items} colorClass={{ bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', icon: 'text-pink-500', text: 'text-pink-700 dark:text-pink-300', badgeBg: 'bg-pink-100 dark:bg-pink-900/50' }} />
        <StatusRow icon={Wallet} label="වියදම්/ආදායම්" count={pendingCounts.expenses} colorClass={{ bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-500', text: 'text-green-700 dark:text-green-300', badgeBg: 'bg-green-100 dark:bg-green-900/50' }} />

      </div>
    </div>
  );
}