import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { FileText, Calendar, Banknote, Receipt, AlertCircle, BarChart3, Wallet, Filter, Package, TrendingUp, MapPin, Search } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import FormInput from '../components/FormInput';

export default function Reports() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [language, setLanguage] = useState('si');
  
  const [reportTab, setReportTab] = useState('financial'); 
  const [filterType, setFilterType] = useState('day');
  
  const getFormattedDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getFormattedDate(new Date()));
  const [customStartDate, setCustomStartDate] = useState(getFormattedDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(getFormattedDate(new Date()));
  
  const [displayRange, setDisplayRange] = useState({ start: '', end: '' });

  const [shopsMap, setShopsMap] = useState({});
  const [shopRouteMap, setShopRouteMap] = useState({});
  const [itemsMap, setItemsMap] = useState({});
  const [routesList, setRoutesList] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState('all');

  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalBillsCollection: 0,
    otherCashNet: 0,
    finalCashInHand: 0,
    pastDueReceived: 0,
    totalCredit: 0,
    billsList: []
  });

  const [itemSalesData, setItemSalesData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    setLanguage(localStorage.getItem('appLanguage') || 'si');
    
    const initData = async () => {
      try {
        const allRoutes = await db.routes.toArray();
        setRoutesList(allRoutes);

        const allItems = await db.items.toArray();
        const iMap = {};
        allItems.forEach(i => { iMap[i.id] = { name: i.itemName, unit: i.unit }; });
        setItemsMap(iMap);

        const allShops = await db.shops.toArray();
        const sMap = {};
        const srMap = {};
        allShops.forEach(s => { 
          sMap[s.id] = s.shopName; 
          srMap[s.id] = s.routeId;
        });
        setShopsMap(sMap);
        setShopRouteMap(srMap);
        
        setIsMapsLoaded(true);
      } catch (error) {
        console.error("Error loading initial maps:", error);
      }
    };
    initData();
  }, [navigate]);

  useEffect(() => {
    if (!isMapsLoaded) return;

    const loadReportForPeriod = async () => {
      setIsChecking(true);
      try {
        let start = '';
        let end = '';
        const now = new Date();

        if (filterType === 'day') {
          start = selectedDate;
          end = selectedDate;
        } else if (filterType === 'week') {
          const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - dayOfWeek);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          start = getFormattedDate(startOfWeek);
          end = getFormattedDate(endOfWeek);
        } else if (filterType === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          start = getFormattedDate(startOfMonth);
          end = getFormattedDate(endOfMonth);
        } else if (filterType === 'custom') {
          start = customStartDate;
          end = customEndDate;
        }

        setDisplayRange({ start, end });

        const periodBills = await db.bills.filter(b => b.date >= start && b.date <= end).toArray();
        periodBills.sort((a, b) => b.id - a.id);
        const periodExpenses = await db.expenses.filter(e => e.date >= start && e.date <= end).toArray();

        let sales = 0; let billsCash = 0; let pastDue = 0; let credit = 0; let otherCashNet = 0;

        periodBills.forEach(bill => {
          sales += parseFloat(bill.totalAmount) || 0;
          billsCash += parseFloat(bill.receivedAmount) || 0;
          pastDue += parseFloat(bill.pastDueReceived) || 0;
          credit += parseFloat(bill.dueAmount) || 0;
        });

        periodExpenses.forEach(record => {
          if (record.type === 'income') otherCashNet += parseFloat(record.amount);
          else if (record.type === 'expense') otherCashNet -= parseFloat(record.amount);
        });

        setReportData({
          totalSales: sales,
          totalBillsCollection: billsCash + pastDue,
          otherCashNet: otherCashNet,
          finalCashInHand: (billsCash + pastDue) + otherCashNet,
          pastDueReceived: pastDue,
          totalCredit: credit,
          billsList: periodBills
        });

        const billIds = periodBills.map(b => b.id);
        let periodBillItems = [];
        if (billIds.length > 0) {
          periodBillItems = await db.billItems.where('billId').anyOf(billIds).toArray();
        }

        const itemAgg = {};
        periodBillItems.forEach(bi => {
          const b = periodBills.find(x => x.id === bi.billId);
          if (!b) return;

          if (selectedRouteId !== 'all') {
            if (String(shopRouteMap[b.shopId]) !== String(selectedRouteId)) return;
          }

          if (!itemAgg[bi.itemId]) {
            itemAgg[bi.itemId] = { itemId: bi.itemId, qty: 0, revenue: 0 };
          }
          itemAgg[bi.itemId].qty += parseFloat(bi.quantity) || 0;
          itemAgg[bi.itemId].revenue += parseFloat(bi.subTotal) || 0;
        });

        const tUnknownItem = translations[language]?.unknownItem || 'Unknown Item';

        const itemSalesArr = Object.values(itemAgg).map(ia => ({
          ...ia,
          itemName: itemsMap[ia.itemId]?.name || tUnknownItem,
          unit: itemsMap[ia.itemId]?.unit || ''
        }));
        
        itemSalesArr.sort((a, b) => b.qty - a.qty);
        setItemSalesData(itemSalesArr);

        setIsChecking(false);
      } catch (error) {
        console.error("Error loading reports:", error);
        setIsChecking(false);
      }
    };

    loadReportForPeriod();
  }, [filterType, selectedDate, customStartDate, customEndDate, selectedRouteId, isMapsLoaded, shopsMap, shopRouteMap, itemsMap, language]);

  const t = translations[language] || translations['si'];

  if (!isMapsLoaded || (isChecking && Object.keys(shopsMap).length === 0)) return <LoadingScreen />;

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      {/* Top Header */}
      <div className={`flex-none flex items-center justify-center px-4 py-6 ${theme.colors.navBg} z-10 border-b ${theme.colors.navBorder} transition-colors duration-300`}>
        <h1 className={`${theme.fonts.header} ${theme.colors.headerText} tracking-wide flex items-center gap-2`}>
          <BarChart3 size={24} className="text-[#14348c] dark:text-blue-400" /> {t.salesReportsTitle || "විකුණුම් වාර්තා"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 hide-scrollbar">

        {/* Tab Switcher (Financial vs Items) */}
        <div className="flex bg-gray-200/60 dark:bg-gray-800 p-1.5 rounded-xl mb-5 shadow-inner">
           <button onClick={() => setReportTab('financial')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[13px] transition-all duration-300 ${reportTab === 'financial' ? 'bg-white dark:bg-gray-700 shadow text-[#14348c] dark:text-blue-400 scale-100' : 'text-gray-500 dark:text-gray-400 scale-95 hover:text-gray-700'}`}>
              <Banknote size={16}/> {t.financialReportsTab || "මුදල් වාර්තා"}
           </button>
           <button onClick={() => setReportTab('items')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[13px] transition-all duration-300 ${reportTab === 'items' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400 scale-100' : 'text-gray-500 dark:text-gray-400 scale-95 hover:text-gray-700'}`}>
              <Package size={16}/> {t.itemReportsTab || "භාණ්ඩ වාර්තා"}
           </button>
        </div>
        
        {/* Date Filter Tabs */}
        <div className="flex bg-blue-50 dark:bg-gray-800 p-1 rounded-lg mb-5 border border-blue-100 dark:border-gray-700">
          {['day', 'week', 'month', 'custom'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 text-[12px] py-2 rounded-md font-bold transition-all duration-300 ${
                filterType === type 
                  ? 'bg-[#14348c] text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t[`tab${type.charAt(0).toUpperCase() + type.slice(1)}`]}
            </button>
          ))}
        </div>

        {/* Date Pickers */}
        <div className="mb-6">
          {filterType === 'day' && (
            <FormInput type="date" label={t.selectDate} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} icon={Calendar} />
          )}
          {filterType === 'custom' && (
            <div className="flex gap-4">
              <div className="flex-1"><FormInput type="date" label={t.startDate} value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} /></div>
              <div className="flex-1"><FormInput type="date" label={t.endDate} value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} /></div>
            </div>
          )}
          {(filterType === 'week' || filterType === 'month') && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-[13px] font-bold text-[#14348c] dark:text-blue-300 flex items-center justify-center gap-2">
                <Calendar size={16} /> {displayRange.start} <span className="text-gray-400 font-normal">{t.until}</span> {displayRange.end}
              </p>
            </div>
          )}
        </div>

        {/* ======================= 1. FINANCIAL REPORT TAB ======================= */}
        {reportTab === 'financial' && (
          <>
            {reportData.billsList.length === 0 ? (
              <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} p-8 text-center shadow-sm`}>
                <AlertCircle size={36} className={`${theme.colors.mutedText} mx-auto mb-3 opacity-50`} />
                <p className={`text-sm font-medium ${theme.colors.mutedText}`}>{t.noDataForDate}</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h2 className={`font-bold text-[16px] ${theme.colors.headerText} mb-2`}>{t.periodSummary || "තෝරාගත් කාලයේ සාරාංශය"}</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400"><BarChart3 size={16} /><span className="text-[11px] font-bold uppercase tracking-wider">{t.totalAmountLabel || "මුළු මුදල"}</span></div>
                    <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.totalSales.toFixed(2)}</h2>
                  </div>
                  
                  <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1 text-green-600 dark:text-green-400"><Banknote size={16} /><span className="text-[11px] font-bold uppercase tracking-wider">{t.cashInHandLabel || "අතැති මුදල"}</span></div>
                    <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.finalCashInHand?.toFixed(2)}</h2>
                    <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-500 flex justify-between"><span>{t.billsFrom || "බිල් වලින්:"}</span><span className="font-bold">රු. {reportData.totalBillsCollection?.toFixed(2)}</span></p>
                      <p className={`text-[10px] flex justify-between ${reportData.otherCashNet < 0 ? 'text-red-500' : reportData.otherCashNet > 0 ? 'text-green-500' : 'text-gray-500'}`}><span>{t.otherFrom || "වෙනත්:"}</span><span className="font-bold">{reportData.otherCashNet > 0 ? '+' : ''}රු. {reportData.otherCashNet?.toFixed(2)}</span></p>
                    </div>
                  </div>

                  <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1 text-orange-500 dark:text-orange-400"><Wallet size={16} /><span className="text-[11px] font-bold uppercase tracking-wider">{t.pastDueReceivedLabel || "ලැබුණු හිඟ"}</span></div>
                    <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.pastDueReceived.toFixed(2)}</h2>
                  </div>

                  <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1 text-red-500 dark:text-red-400"><Receipt size={16} /><span className="text-[11px] font-bold uppercase tracking-wider">{t.creditAmountLabel || "ණය මුදල"}</span></div>
                    <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.totalCredit.toFixed(2)}</h2>
                  </div>
                </div>

                <hr className={`${theme.colors.divider} border-t my-6`} />

                <div className="flex justify-between items-center mb-2">
                  <h2 className={`font-bold text-[16px] ${theme.colors.headerText}`}>{t.billsList || "බිල්පත් ලැයිස්තුව"}</h2>
                  <span className={`text-[12px] font-bold text-white bg-[#14348c] dark:bg-blue-600 px-2 py-1 rounded-md shadow-sm`}>{reportData.billsList.length}</span>
                </div>
                
                <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden`}>
                  {reportData.billsList.map((bill, index) => (
                    <div key={bill.id} onClick={() => navigate(`/shop-history/${bill.shopId}`, { state: { from: '/reports' } })} className={`p-4 border-b ${theme.colors.divider} last:border-0 flex justify-between items-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400 flex items-center justify-center font-bold text-sm">{index + 1}</div>
                        <div>
                          <h3 className={`font-bold text-[15px] ${theme.colors.inputText}`}>{shopsMap[bill.shopId] || t.unknownShop || 'Unknown Shop'}</h3>
                          <p className={`text-[11px] font-bold text-gray-400 mb-0.5`}>{bill.date}</p>
                          <p className={`text-[12px] font-medium text-green-600 dark:text-green-400`}>{t.totalRsLabel || "එකතුව: රු."} {(parseFloat(bill.receivedAmount) + parseFloat(bill.pastDueReceived || 0)).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[12px] font-bold ${theme.colors.mutedText}`}>{t.billRsLabel || "බිල: රු."} {parseFloat(bill.totalAmount).toFixed(2)}</p>
                         {parseFloat(bill.dueAmount) > 0 && <p className="text-[12px] font-bold text-red-500">{t.creditRsLabel || "ණය: රු."} {parseFloat(bill.dueAmount).toFixed(2)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================= 2. ITEM SALES REPORT TAB ======================= */}
        {reportTab === 'items' && (
          <div className="animate-in fade-in duration-300">
            
            {/* Route Filter Dropdown */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                 <MapPin size={16} className="text-green-600 dark:text-green-400"/> {t.showByRoute || "රූට් එක අනුව පෙන්වන්න"}
              </label>
              <select 
                 value={selectedRouteId} 
                 onChange={(e) => setSelectedRouteId(e.target.value)}
                 className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14348c]"
              >
                 <option value="all">{t.allRoutesOption || "සියලුම රූට් (All Routes)"}</option>
                 {routesList.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName}</option>
                 ))}
              </select>
            </div>

            {itemSalesData.length === 0 ? (
              <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} p-8 text-center shadow-sm`}>
                <Package size={36} className={`${theme.colors.mutedText} mx-auto mb-3 opacity-50`} />
                <p className={`text-sm font-medium ${theme.colors.mutedText}`}>{t.noItemsSold || "මෙම කාලය තුළ භාණ්ඩ කිසිවක් විකිණී නොමැත."}</p>
              </div>
            ) : (
              <>
                {/* Top 5 Items Widget */}
                <div className="mb-6">
                  <h3 className="font-bold text-[15px] text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-orange-500"/> {t.top5Items || "වැඩිපුරම විකිණුන භාණ්ඩ 5"}
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-4">
                     {itemSalesData.slice(0, 5).map((item, idx) => {
                       const maxQty = itemSalesData[0].qty; // For progress bar scaling
                       return (
                         <div key={item.itemId} className="flex items-center gap-3">
                             <div className="w-7 h-7 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                             <div className="flex-1">
                                 <div className="flex justify-between mb-1.5">
                                     <span className="text-[14px] font-bold text-gray-700 dark:text-gray-300 truncate pr-2">{item.itemName}</span>
                                     <span className="text-[14px] font-extrabold text-[#14348c] dark:text-blue-400 whitespace-nowrap">{item.qty} {item.unit}</span>
                                 </div>
                                 <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                     <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(item.qty / maxQty) * 100}%` }}></div>
                                 </div>
                             </div>
                         </div>
                       )
                     })}
                  </div>
                </div>

                {/* Full Item List */}
                <div>
                  <h3 className="font-bold text-[15px] text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Search size={18} className="text-gray-500"/> {t.allItemSales || "සියලුම භාණ්ඩ විකුණුම්"} 
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    {itemSalesData.map((item, index) => (
                      <div key={item.itemId} className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                         <div>
                            <p className="font-bold text-[15px] text-gray-800 dark:text-gray-200">{item.itemName}</p>
                            <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t.revenueLbl || "ආදායම: රු."} {item.revenue.toFixed(2)}</p>
                         </div>
                         <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-[#14348c] dark:text-blue-400 rounded-lg text-[14px] font-bold">
                              {item.qty} {item.unit}
                            </span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}