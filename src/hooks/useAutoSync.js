import { useEffect } from 'react';
import { db } from '../db/database';

export default function useAutoSync() {
  useEffect(() => {
    let isSyncing = false; // එකවර දෙපාරක් යැවීම වැළැක්වීමට

    const checkAndSyncData = async () => {
      // ඉන්ටර්නෙට් නැත්නම් හෝ දැනටමත් යවමින් පවතීනම් නවතින්න
      if (!navigator.onLine || isSyncing) return;

      try {
        // 1. යැවීමට ඇති (Pending) දත්ත මොනවාදැයි බැලීම
        const pRoutes = await db.routes.filter(x => x.syncStatus === 'pending').toArray();
        const pShops = await db.shops.filter(x => x.syncStatus === 'pending').toArray();
        const pItems = await db.items.filter(x => x.syncStatus === 'pending').toArray();
        const pBills = await db.bills.filter(x => x.syncStatus === 'pending').toArray();
        const pExpenses = await db.expenses.filter(x => x.syncStatus === 'pending').toArray();
        const pSettings = await db.settings.filter(x => x.syncStatus === 'pending').toArray();
        const pProfile = await db.profile.filter(x => x.syncStatus === 'pending').toArray();
        const pBillItems = await db.billItems.filter(x => x.syncStatus === 'pending').toArray();

        const totalPending = pRoutes.length + pShops.length + pItems.length + pBills.length + 
                             pExpenses.length + pSettings.length + pProfile.length + pBillItems.length;

        // යැවීමට කිසිවක් නැත්නම් මෙතනින් නවතින්න
        if (totalPending === 0) return;

        const userStr = localStorage.getItem('user');
        if (!userStr) return; // ලොග් වී නැත්නම් නවතින්න
        const user = JSON.parse(userStr);

        isSyncing = true; // යැවීම ආරම්භ කරන බව සටහන් කිරීම

        const payload = {
          username: user.username,
          settings: pSettings, profile: pProfile, routes: pRoutes, 
          shops: pShops, items: pItems, bills: pBills, 
          billItems: pBillItems, expenses: pExpenses
        };

        // 2. සර්වර් එකට දත්ත යැවීම
        const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/sync/backup-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // 3. යැවීම සාර්ථක නම් සියල්ල 'synced' ලෙස සටහන් කිරීම
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
          
          console.log("✅ Background Auto-Sync Successful! (Items:", totalPending, ")");
        }
      } catch (error) {
        console.error("❌ Background Auto-Sync Failed:", error);
      } finally {
        isSyncing = false; // යවා අවසන්
      }
    };

    // --- Auto-Sync ක්‍රියාත්මක වන අවස්ථා 4 ---
    
    // 1. ඇප් එක මුලින්ම ලෝඩ් වෙනකොට
    checkAndSyncData(); 

    // 2. ඉන්ටර්නෙට් (WiFi/Data) අලුතින් සම්බන්ධ වූ ගමන්
    window.addEventListener('online', checkAndSyncData);
    
    // 3. යම්කිසි ක්‍රියාවක් වූ සැනින් (Instant Sync / Force Sync) - අලුතින් එක්කළ කොටස
    window.addEventListener('force-sync', checkAndSyncData);
    
    // 4. ඇප් එක පාවිච්චි කරන අතරතුර සෑම තත්පර 15 කට වරක්ම
    const interval = setInterval(checkAndSyncData, 15000);

    return () => {
      window.removeEventListener('online', checkAndSyncData);
      window.removeEventListener('force-sync', checkAndSyncData); // Cleanup කිරීම
      clearInterval(interval);
    };
  }, []);
}