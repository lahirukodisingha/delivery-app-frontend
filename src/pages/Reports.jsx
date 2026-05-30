import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { FileText, Calendar, Banknote, Receipt, AlertCircle, BarChart3, Wallet, Filter } from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import BottomNav from '../components/BottomNav';
import FormInput from '../components/FormInput';

export default function Reports() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');
  
  // ෆිල්ටර් වර්ගය: 'day', 'week', 'month', 'custom'
  const [filterType, setFilterType] = useState('day');
  
  // දින තෝරාගැනීම් සඳහා
  const getFormattedDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getFormattedDate(new Date()));
  const [customStartDate, setCustomStartDate] = useState(getFormattedDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(getFormattedDate(new Date()));
  
  // UI එකේ පෙන්වන්න තෝරපු දින පරාසය
  const [displayRange, setDisplayRange] = useState({ start: '', end: '' });

  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalBillsCollection: 0,
    otherCashNet: 0,
    finalCashInHand: 0,
    pastDueReceived: 0,
    totalCredit: 0,
    billsList: []
  });

  const [shopsMap, setShopsMap] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');
    
    const loadShops = async () => {
      const allShops = await db.shops.toArray();
      const sMap = {};
      allShops.forEach(s => { sMap[s.id] = s.shopName; });
      setShopsMap(sMap);
    };
    
    loadShops();
  }, [navigate]);

  // ෆිල්ටර් එක වෙනස් වෙන හැම වෙලාවෙම දත්ත ගණනය කිරීම
  useEffect(() => {
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
          // මේ සතිය (සඳුදා සිට ඉරිදා දක්වා)
          const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - dayOfWeek);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          start = getFormattedDate(startOfWeek);
          end = getFormattedDate(endOfWeek);
        } else if (filterType === 'month') {
          // මේ මාසය (1 වෙනිදා සිට අවසාන දවස දක්වා)
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          start = getFormattedDate(startOfMonth);
          end = getFormattedDate(endOfMonth);
        } else if (filterType === 'custom') {
          // අභිරුචි දින පරාසය
          start = customStartDate;
          end = customEndDate;
        }

        setDisplayRange({ start, end });

        // 1. Database එකෙන් අදාල කාලසීමාවට බිල්පත් පෙරා ගැනීම
        const periodBills = await db.bills.filter(b => b.date >= start && b.date <= end).toArray();
        // ID එක විශාලම බිල (අවසානයටම එකතු කළ බිල) මුලින්ම පෙන්වීමට Sort කිරීම
        periodBills.sort((a, b) => b.id - a.id);
        
        // 2. අදාල කාලසීමාවට වියදම් සහ ආදායම් දත්ත ලබාගැනීම
        const periodExpenses = await db.expenses.filter(e => e.date >= start && e.date <= end).toArray();

        let sales = 0;
        let billsCash = 0;
        let pastDue = 0;
        let credit = 0;
        let otherCashNet = 0; // වෙනත් ආදායම්/වියදම් වල ශුද්ධ අගය

        // බිල්පත් වලින් ගණනය කිරීම්
        periodBills.forEach(bill => {
          sales += parseFloat(bill.totalAmount) || 0;
          billsCash += parseFloat(bill.receivedAmount) || 0;
          pastDue += parseFloat(bill.pastDueReceived) || 0;
          credit += parseFloat(bill.dueAmount) || 0;
        });

        // වියදම්/ආදායම් ගණනය කිරීම
        periodExpenses.forEach(record => {
          if (record.type === 'income') {
            otherCashNet += parseFloat(record.amount);
          } else if (record.type === 'expense') {
            otherCashNet -= parseFloat(record.amount);
          }
        });

        // මුළු එකතුව (බිල්පත් මුදල් + පරණ ණය එකතු කිරීම්)
        const totalBillsCollection = billsCash + pastDue; 
        
        // අවසාන අතැති මුදල (බිල් මුදල් + වෙනත් ආදායම් - වියදම්)
        const finalCashInHand = totalBillsCollection + otherCashNet;

        setReportData({
          totalSales: sales,
          totalBillsCollection: totalBillsCollection,
          otherCashNet: otherCashNet,
          finalCashInHand: finalCashInHand,
          pastDueReceived: pastDue,
          totalCredit: credit,
          billsList: periodBills
        });

        setIsChecking(false);
      } catch (error) {
        console.error("Error loading reports:", error);
        setIsChecking(false);
      }
    };

    loadReportForPeriod();
  }, [filterType, selectedDate, customStartDate, customEndDate]);

  const t = translations[language] || translations['si'];

  if (isChecking && Object.keys(shopsMap).length === 0) return <LoadingScreen />;

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      {/* Top Header */}
      <div className={`flex-none flex items-center justify-center px-4 py-6 ${theme.colors.navBg} z-10 border-b ${theme.colors.navBorder} transition-colors duration-300`}>
        <h1 className={`${theme.fonts.header} ${theme.colors.headerText} tracking-wide flex items-center gap-2`}>
          <BarChart3 size={24} className="text-[#14348c] dark:text-blue-400" /> {t.salesReportsTitle || "විකුණුම් වාර්තා"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24 hide-scrollbar">
        
        {/* ෆිල්ටර් වර්ගය තෝරන Tabs (දින, සති, මාස, අභිරුචි) */}
        <div className="flex bg-gray-200/60 dark:bg-gray-800 p-1.5 rounded-xl mb-6 shadow-inner">
          {['day', 'week', 'month', 'custom'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 text-[13px] py-2.5 rounded-lg font-bold transition-all duration-300 ${
                filterType === type 
                  ? 'bg-white dark:bg-gray-700 text-[#14348c] dark:text-blue-400 shadow-sm scale-100' 
                  : 'text-gray-500 dark:text-gray-400 scale-95 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t[`tab${type.charAt(0).toUpperCase() + type.slice(1)}`]}
            </button>
          ))}
        </div>

        {/* තෝරාගත් Filter එක අනුව Date Pickers පෙන්වීම */}
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

          {/* සති සහ මාස සඳහා පරාසය පෙන්වීම */}
          {(filterType === 'week' || filterType === 'month') && (
            <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <p className="text-[13px] font-bold text-[#14348c] dark:text-blue-300 flex items-center justify-center gap-2">
                <Calendar size={16} /> {displayRange.start} <span className="text-gray-400 font-normal">{t.until}</span> {displayRange.end}
              </p>
            </div>
          )}
        </div>

        {reportData.billsList.length === 0 ? (
          <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} p-8 text-center shadow-sm`}>
            <AlertCircle size={36} className={`${theme.colors.mutedText} mx-auto mb-3 opacity-50`} />
            <p className={`text-sm font-medium ${theme.colors.mutedText}`}>{t.noDataForDate}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className={`font-bold text-[16px] ${theme.colors.headerText} mb-2`}>{t.periodSummary || "තෝරාගත් කාලයේ සාරාංශය"}</h2>

            {/* 2x2 Grid එක */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* 1. මුළු මුදල */}
              <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
                  <BarChart3 size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.totalAmountLabel || "මුළු මුදල"}</span>
                </div>
                <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.totalSales.toFixed(2)}</h2>
              </div>
              
              {/* 2. අතැති මුදල (බිල්පත් + වෙනත් ආදායම්/වියදම්) */}
              <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1 text-green-600 dark:text-green-400">
                  <Banknote size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.cashInHandLabel || "අතැති මුදල"}</span>
                </div>
                <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.finalCashInHand?.toFixed(2)}</h2>
                
                {/* මුදල් බෙදී ගිය ආකාරය පෙන්වන කුඩා සටහන */}
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>බිල් වලින්:</span> 
                    <span className="font-bold">රු. {reportData.totalBillsCollection?.toFixed(2)}</span>
                  </p>
                  <p className={`text-[10px] flex justify-between ${reportData.otherCashNet < 0 ? 'text-red-500' : reportData.otherCashNet > 0 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>වෙනත්:</span> 
                    <span className="font-bold">{reportData.otherCashNet > 0 ? '+' : ''}රු. {reportData.otherCashNet?.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* 3. ලැබුණු හිඟ මුදල */}
              <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1 text-orange-500 dark:text-orange-400">
                  <Wallet size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.pastDueReceivedLabel || "ලැබුණු හිඟ"}</span>
                </div>
                <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.pastDueReceived.toFixed(2)}</h2>
              </div>

              {/* 4. ණය මුදල */}
              <div className={`${theme.colors.cardBg} rounded-xl p-4 border ${theme.colors.divider} shadow-sm transition-colors`}>
                <div className="flex items-center gap-2 mb-1 text-red-500 dark:text-red-400">
                  <Receipt size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.creditAmountLabel || "ණය මුදල"}</span>
                </div>
                <h2 className={`text-[17px] font-bold ${theme.colors.inputText}`}>රු. {reportData.totalCredit.toFixed(2)}</h2>
              </div>

            </div>

            <hr className={`${theme.colors.divider} border-t my-6`} />

            {/* තෝරාගත් කාලයට අදාල බිල්පත් ලැයිස්තුව */}
            <div className="flex justify-between items-center mb-2">
              <h2 className={`font-bold text-[16px] ${theme.colors.headerText}`}>බිල්පත් ලැයිස්තුව</h2>
              <span className={`text-[12px] font-bold text-white bg-[#14348c] dark:bg-blue-600 px-2 py-1 rounded-md shadow-sm`}>{reportData.billsList.length}</span>
            </div>
            
            <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden transition-colors`}>
              {reportData.billsList.map((bill, index) => (
                <div 
                  key={bill.id} 
                  onClick={() => navigate(`/shop-history/${bill.shopId}`, { state: { from: '/reports' } })} 
                  className={`p-4 border-b ${theme.colors.divider} last:border-0 flex justify-between items-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-gray-700 text-[#14348c] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold text-[15px] ${theme.colors.inputText}`}>{shopsMap[bill.shopId] || 'Unknown Shop'}</h3>
                      {/* දින පරාසයක් බලන නිසා දිනයත් පෙන්වීම වැදගත් */}
                      <p className={`text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-0.5`}>{bill.date}</p>
                      <p className={`text-[12px] font-medium text-green-600 dark:text-green-400`}>එකතුව: රු. {(parseFloat(bill.receivedAmount) + parseFloat(bill.pastDueReceived || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className={`text-[12px] font-bold ${theme.colors.mutedText}`}>බිල: රු. {parseFloat(bill.totalAmount).toFixed(2)}</p>
                     {parseFloat(bill.dueAmount) > 0 && <p className="text-[12px] font-bold text-red-500">ණය: රු. {parseFloat(bill.dueAmount).toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full z-50">
        <BottomNav language={language} />
      </div>

    </div>
  );
}