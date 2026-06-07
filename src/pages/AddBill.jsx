import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations'; 
import { 
  Calendar, Store, Banknote, Receipt, 
  FileText, Save, Plus, Minus, ShoppingCart, Search, ArrowRight, AlertCircle, Coins, Wallet, CheckCircle2, Printer, X,ChevronDown
} from 'lucide-react';

// Components
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert'; 

// ලංකාවේ වේලාවට අනුව නිවැරදි දිනය ලබාගැනීම
const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddBill() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const preSelectedShopId = location.state?.preSelectedShopId;
  const [isChecking, setIsChecking] = useState(true);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [shops, setShops] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null); 

  const [date, setDate] = useState(getLocalDate());
  const [selectedShopId, setSelectedShopId] = useState('');
  
  const [previousDue, setPreviousDue] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const [isTodayPaymentEdited, setIsTodayPaymentEdited] = useState(false);
  const [customTodayPayment, setCustomTodayPayment] = useState('');
  
  const [pastDuePayment, setPastDuePayment] = useState(''); 
  const [cashGiven, setCashGiven] = useState(''); 
  const [remarks, setRemarks] = useState('');
  const [language, setLanguage] = useState('si');

  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [currentBillData, setCurrentBillData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');
    const todayStr = getLocalDate();

    const loadData = async () => {
      try {
        const activeRouteId = localStorage.getItem('activeRouteId');
        const allShops = await db.shops.toArray();
        let filteredShops = [];
        
        if (activeRouteId) {
          filteredShops = allShops.filter(s => String(s.routeId) === String(activeRouteId));
          filteredShops.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        }

        const loadedItems = await db.items.toArray();
        const settings = await db.settings.toArray();
        
        if (settings.length > 0) setBusinessInfo(settings[0]);

        setShops(filteredShops);
        setAvailableItems(loadedItems);
        
        // මේ කොටස අලුතින් Replace කරන්න
        if (filteredShops.length > 0) {
          if (preSelectedShopId) {
            // Home එකෙන් කඩයක් ක්ලික් කරලා ආවා නම් කෙලින්ම ඒක සිලෙක්ට් කරනවා
            setSelectedShopId(preSelectedShopId.toString());
          } else {
            // සාමාන්‍ය විදිහට පල්ලෙහා බට්න් එකෙන් ආවා නම්, ඊළඟට යන්න තියෙන කඩේ ඔටෝ තෝරනවා
            const savedVisited = JSON.parse(localStorage.getItem(`visited_${todayStr}`) || '[]');
            const nextShop = filteredShops.find(s => !savedVisited.includes(s.id));
            
            if (nextShop) {
              setSelectedShopId(nextShop.id.toString());
            } else {
              setSelectedShopId(filteredShops[0].id.toString());
            }
          }
        } else {
          setSelectedShopId('');
        }
        setIsChecking(false);
      } catch (error) {
        setIsChecking(false);
      }
    };
    loadData();
  }, [navigate]);

  useEffect(() => {
    const fetchPreviousDue = async () => {
      if (selectedShopId) {
        try {
          const shopBills = await db.bills.filter(bill => String(bill.shopId) === String(selectedShopId)).toArray();
          let totalDue = 0;
          shopBills.forEach(bill => {
            totalDue += (parseFloat(bill.dueAmount) || 0); 
            totalDue -= (parseFloat(bill.pastDueReceived) || 0); 
          });
          setPreviousDue(totalDue > 0 ? totalDue : 0);
        } catch (error) {
          setPreviousDue(0);
        }
      } else {
        setPreviousDue(0);
      }
    };
    fetchPreviousDue();
  }, [selectedShopId]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleIncrement = (id) => setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  
  const handleDecrement = (id) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[id]; 
        return newState;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleQuantityChange = (id, value) => {
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) {
      setQuantities(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } else {
      setQuantities(prev => ({ ...prev, [id]: val }));
    }
  };

  const filteredItems = availableItems.filter(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeBillItems = availableItems.filter(item => quantities[item.id] > 0).map(item => ({
    itemId: item.id, itemName: item.itemName, unit: item.unit, unitPrice: item.unitPrice,
    quantity: quantities[item.id], subTotal: item.unitPrice * quantities[item.id]
  }));

  const totalAmount = activeBillItems.reduce((total, item) => total + item.subTotal, 0);
  const payForToday = isTodayPaymentEdited ? (parseFloat(customTodayPayment) || 0) : totalAmount;
  const payForPast = parseFloat(pastDuePayment) || 0;
  const handedCash = parseFloat(cashGiven) || 0;

  const dueForToday = Math.max(0, totalAmount - payForToday);
  const totalPaid = payForToday + payForPast;
  const changeToReturn = handedCash > totalPaid ? handedCash - totalPaid : 0;

  const handleNextStep = () => {
    if (activeBillItems.length === 0) {
      if (previousDue <= 0) {
        showAlert(t.noItemsNoDueAlert, 'error');
        return;
      }
      showAlert(
        t.confirmOnlyDueAlert, 
        'confirm', 
        true, 
        () => {
          setIsTodayPaymentEdited(false);
          setCustomTodayPayment('');
          setCurrentStep(2); 
        }
      );
      return;
    }
    setIsTodayPaymentEdited(false);
    setCustomTodayPayment('');
    setCurrentStep(2); 
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1); 
    else navigate('/home'); 
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (activeBillItems.length === 0 && payForToday === 0 && payForPast === 0) {
      showAlert(t.enterItemsOrPaymentAlert, 'error');
      return;
    }

    try {
      const billId = await db.bills.add({
        date, shopId: parseInt(selectedShopId), totalAmount, receivedAmount: payForToday, 
        dueAmount: dueForToday, pastDueReceived: payForPast, remarks, syncStatus: 'pending'
      });

      const itemsToSave = activeBillItems.map(item => ({
        billId: billId, 
        itemId: item.itemId, 
        quantity: item.quantity, 
        pricePerUnit: item.unitPrice, 
        subTotal: item.subTotal,
        syncStatus: 'pending' // <--- අලුතින් එක් කළ කොටස
      }));
      
      if (itemsToSave.length > 0) await db.billItems.bulkAdd(itemsToSave);

      const shopName = shops.find(s => s.id === parseInt(selectedShopId))?.shopName || 'Unknown Shop';
      setCurrentBillData({
        billId,
        date,
        shopName,
        items: activeBillItems,
        totalAmount,
        payForToday,
        dueForToday,
        previousDue,
        payForPast,
        totalDueNow: (previousDue - payForPast) + dueForToday
      });

      setShowPrintPopup(true);

    } catch (error) {
      showAlert(t.saveError || 'සුරැකීමේදී දෝෂයක් මතු විය!', 'error');
    }
  };

  const handlePrint = async () => {
    // ඩේටාබේස් එකේ බිල ප්‍රින්ට් කළ බවට සටහන් කිරීම
    try {
      await db.bills.update(parseInt(currentBillData.billId), { isPrinted: true });
    } catch (error) {
      console.error("Error updating print status", error);
    }

    setShowPrintPopup(false); 
    console.log("Printing Bill...", currentBillData); 

    setTimeout(() => {
      showAlert(
        t.printSuccess || 'සාර්ථකව ප්‍රින්ට් වුණා!', 
        'success', 
        false, 
        // AddBill සඳහා '/home' ද, EditBill සඳහා -1 ද ලෙස මෙහි navigate එක ඔබගේ ෆයිල් එකට අදාලව තබාගන්න
        () => navigate('/home') 
      );
    }, 150);
  };

  const handleCancelPrint = () => {
    // 1. Popup එක වසා දමන්න
    setShowPrintPopup(false);
    
    // 2. සේව් වූ බවට Alert එක පෙන්වීම
    setTimeout(() => {
      showAlert(
        t.billSavedSuccess || 'සටහන සාර්ථකව සුරැකුවා!', 
        'success', 
        false, 
        () => navigate('/home') // Alert එකේ 'හරි' එබූ පසු Home යයි
      );
    }, 150);
  };

  const shopOptions = shops.map(shop => ({ label: shop.shopName, value: shop.id }));

  if (isChecking) return <LoadingScreen />;

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

      {showPrintPopup && currentBillData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Printer size={18}/> Print Preview
              </h3>
              <button onClick={handleCancelPrint} className="text-gray-500 hover:text-red-500 transition"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-black text-[12px] leading-tight">
              <div className="text-center mb-4 flex flex-col items-center">
                {businessInfo?.businessLogo && (
                  <img 
                    src={businessInfo.businessLogo} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain mb-2 grayscale" 
                    style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.9)' }} 
                  />
                )}
                <h2 className="text-[18px] font-bold uppercase">{businessInfo?.businessName || 'MY BUSINESS'}</h2>
                {businessInfo?.address && <p className="mt-1">{businessInfo.address}</p>}
                {(businessInfo?.phone1 || businessInfo?.phone2) && (
                  <p className="mt-1">{businessInfo.phone1} {businessInfo.phone2 ? `/ ${businessInfo.phone2}` : ''}</p>
                )}
                {businessInfo?.regNumber && <p className="mt-1">BR: {businessInfo.regNumber}</p>}
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
              
              <div className="flex justify-between mb-1">
                <span>Date: {currentBillData.date}</span>
                <span>No: #{currentBillData.billId.toString().padStart(4, '0')}</span>
              </div>
              <div className="mb-2">
                <span>Customer: <span className="font-bold">{currentBillData.shopName}</span></span>
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
              
              <div className="w-full mb-2">
                <div className="flex font-bold border-b border-gray-400 pb-1 mb-1">
                  <div className="flex-1">Item</div>
                  <div className="w-12 text-right">Qty</div>
                  <div className="w-20 text-right">Amount</div>
                </div>
                {currentBillData.items.map((item, idx) => (
                  <div key={idx} className="flex mb-1">
                    <div className="flex-1 truncate pr-2">{item.itemName}</div>
                    <div className="w-12 text-right">{item.quantity}</div>
                    <div className="w-20 text-right">{(item.subTotal).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[14px]">
                  <span>Total Amount:</span>
                  <span>Rs. {currentBillData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid for Today:</span>
                  <span>- Rs. {currentBillData.payForToday.toFixed(2)}</span>
                </div>
                {currentBillData.dueForToday > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Today's Due:</span>
                    <span>Rs. {currentBillData.dueForToday.toFixed(2)}</span>
                  </div>
                )}
                
                {currentBillData.previousDue > 0 && (
                  <>
                    <div className="border-t border-gray-300 my-1"></div>
                    <div className="flex justify-between text-gray-700">
                      <span>Previous Due:</span>
                      <span>Rs. {currentBillData.previousDue.toFixed(2)}</span>
                    </div>
                    {currentBillData.payForPast > 0 && (
                      <div className="flex justify-between">
                        <span>Paid for Past Due:</span>
                        <span>- Rs. {currentBillData.payForPast.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
                <div className="flex justify-between font-bold text-[14px]">
                  <span>Total Due Balance:</span>
                  <span>Rs. {currentBillData.totalDueNow.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-400 my-3"></div>
              <div className="text-center font-bold pb-2">
                <p>Thank You!</p>
                <p>Come Again</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button 
                onClick={handleCancelPrint}
                className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition"
              >
                {t.cancelBtn || 'Cancel'}
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#14348c] text-white font-bold rounded-xl hover:bg-[#1b43aa] transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <Printer size={20}/> Print
              </button>
            </div>

          </div>
        </div>
      )}

      <PageHeader title={currentStep === 1 ? t.addBillTitle : t.billSummaryTitle} onBack={handleBack} />

      <div className={`flex px-8 py-3 ${theme.colors.navBg} border-b ${theme.colors.navBorder} justify-center items-center gap-2 transition-colors`}>
         <span className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-[#14348c] dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
         <span className={`h-1 w-12 rounded-full ${currentStep === 2 ? 'bg-[#14348c] dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></span>
         <span className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-[#14348c] dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 hide-scrollbar">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                 <FormInput type="date" label={t.dateLabel} value={date} onChange={(e) => setDate(e.target.value)} icon={Calendar} required />
              </div>
              <div className="w-1/2 relative">
                 <FormSelect label={t.shopLabel} value={selectedShopId} onChange={(e) => setSelectedShopId(e.target.value)} options={shopOptions} disabled={shops.length === 0} icon={Store} required placeholderOption={shops.length === 0 ? (localStorage.getItem('activeRouteId') ? t.noShopsInRoute : t.pleaseSelectRouteFirst) : undefined} />
                 
                 {/* අලුතින් එකතු කළ ත්‍රිකෝණ අයිකන් එක */}
                 <div className="absolute right-3 bottom-[13px] pointer-events-none">
                   <ChevronDown size={18} className={theme.colors.mutedText} />
                 </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${previousDue > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className={previousDue > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'} />
                <span className={`font-bold text-[14px] ${previousDue > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                  {previousDue > 0 ? t.previousDueLabel : t.noPreviousDue}
                </span>
              </div>
              {previousDue > 0 && <span className="font-bold text-[16px] text-red-600 dark:text-red-400">රු. {previousDue.toFixed(2)}</span>}
            </div>

            <hr className={`${theme.colors.divider} border-t my-2 transition-colors`} />

            <div>
              <div className="flex justify-between items-end mb-3">
                <h3 className={`font-bold text-[#14348c] dark:text-blue-400 text-[16px] flex items-center gap-2`}>
                  <ShoppingCart size={20} /> {t.selectItemsLabel}
                </h3>
                <span className="text-xs font-bold text-[#14348c] dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-lg transition-colors">
                  {t.selectedCountLabel} {activeBillItems.length}
                </span>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className={theme.colors.mutedText} />
                </div>
                <input 
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border ${theme.colors.inputBorder} rounded-xl text-[15px] focus:outline-none ${theme.colors.inputFocus} ${theme.colors.cardBg} ${theme.colors.inputText} shadow-sm transition-colors`}
                  placeholder={t.searchItemsPlaceholder}
                />
              </div>
              
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <p className={`text-sm ${theme.colors.mutedText} text-center py-4 ${theme.colors.cardBg} rounded-xl border ${theme.colors.inputBorder}`}>
                    {searchTerm ? t.noMatchingItems : t.noItems}
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const qty = quantities[item.id] || '';
                    const isSelected = qty > 0;
                    return (
                      <div key={item.id} className={`flex justify-between items-center p-3 border rounded-xl shadow-sm transition-all ${isSelected ? 'border-[#14348c] dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : `${theme.colors.inputBorder} ${theme.colors.cardBg}`}`}>
                        <div>
                          <p className={`font-bold text-[16px] ${isSelected ? 'text-[#14348c] dark:text-blue-400' : theme.colors.inputText}`}>{item.itemName}</p>
                          <p className={`text-[13px] font-medium ${theme.colors.mutedText}`}>රු. {item.unitPrice} / {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleDecrement(item.id)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 transition"><Minus size={18} /></button>
                          <input type="number" value={qty} onChange={(e) => handleQuantityChange(item.id, e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} onInput={(e) => {
      // මෙතනින් කරන්නේ අකුරු ආවොත් ඒවා අයින් කරන එක
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
  }} className={`w-12 text-center font-bold text-[16px] ${theme.colors.inputText} bg-transparent focus:outline-none p-0` } placeholder="0" />
                          <button type="button" onClick={() => handleIncrement(item.id)} className="w-9 h-9 rounded-full bg-[#1b43aa] dark:bg-blue-600 flex items-center justify-center text-white shadow-sm transition"><Plus size={18} /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleSaveBill} className="space-y-6">
            <div>
              <h3 className="font-bold text-[#14348c] dark:text-blue-400 mb-3 text-[16px] flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600 dark:text-green-400"/> {t.selectedItemsLabel}
              </h3>
              <div className="space-y-3">
                {activeBillItems.length === 0 ? (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-center shadow-sm">
                    <p className="text-orange-700 dark:text-orange-300 font-bold text-sm">{t.noNewItemsAdded}</p>
                    <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">{t.onlyPastDueNote}</p>
                  </div>
                ) : (
                  activeBillItems.map((item) => (
                    <div key={item.itemId} className="flex justify-between items-center p-3 border border-[#14348c] dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl shadow-sm">
                      <div>
                        <p className="font-bold text-[16px] text-[#14348c] dark:text-blue-300">{item.itemName}</p>
                        <p className={`text-[13px] font-medium ${theme.colors.mutedText}`}>රු. {item.unitPrice} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleDecrement(item.itemId)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 transition"><Minus size={18} /></button>
                        <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.itemId, e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} onInput={(e) => {
      // මෙතනින් කරන්නේ අකුරු ආවොත් ඒවා අයින් කරන එක
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
  }} className={`w-12 text-center font-bold text-[16px] ${theme.colors.inputText} bg-transparent focus:outline-none p-0`} />
                        <button type="button" onClick={() => handleIncrement(item.itemId)} className="w-9 h-9 rounded-full bg-[#1b43aa] dark:bg-blue-600 flex items-center justify-center text-white shadow-sm transition"><Plus size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className={`${theme.colors.divider} border-t my-4`} />

            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-inner">
              <span className="font-bold text-[#14348c] dark:text-blue-300">{t.todayTotalBill}</span>
              <span className="font-bold text-2xl text-[#14348c] dark:text-blue-200">රු. {totalAmount.toFixed(2)}</span>
            </div>

            {previousDue > 0 && (
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-3 mt-3 rounded-xl border border-red-200 dark:border-red-800 shadow-inner">
                <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={18} /> {t.previousDueLabel || "පෙර හිඟ මුදල"}
                </span>
                <span className="font-bold text-xl text-red-600 dark:text-red-400">රු. {previousDue.toFixed(2)}</span>
              </div>
            )}

            <div className="space-y-4 mt-4">
              <div>
                <label className={`block ${theme.fonts.label} ${theme.colors.labelText} mb-2 flex items-center gap-2`}><Banknote size={18} className="text-green-600 dark:text-green-400" /> {t.todayPaymentLabel}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 left-0 pl-4 flex items-center ${theme.colors.mutedText} font-bold`}>රු.</span>
                  <input type="number" value={isTodayPaymentEdited ? customTodayPayment : (totalAmount > 0 ? totalAmount : '')} onChange={(e) => { setIsTodayPaymentEdited(true); setCustomTodayPayment(e.target.value); }} onInput={(e) => {
      // මෙතනින් කරන්නේ අකුරු ආවොත් ඒවා අයින් කරන එක
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
  }} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} className={`w-full pl-12 pr-4 py-3.5 border border-green-300 dark:border-green-800 rounded-xl text-xl font-bold text-green-700 dark:text-green-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-green-50 dark:bg-green-900/20 shadow-inner`} placeholder="0.00" disabled={totalAmount === 0} />
                </div>
                {dueForToday > 0 && <p className="text-red-500 dark:text-red-400 text-sm font-bold mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {t.todayDueAmount} රු. {dueForToday.toFixed(2)}</p>}
              </div>

              {previousDue > 0 && (
                <div className={`${activeBillItems.length === 0 ? 'p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-800 rounded-xl shadow-sm' : ''}`}>
                   <label className={`block ${theme.fonts.label} ${theme.colors.labelText} mb-2 flex items-center gap-2`}><Receipt size={18} className="text-orange-500 dark:text-orange-400" /> {t.pastDuePaymentLabel}</label>
                   <div className="relative">
                     <span className={`absolute inset-y-0 left-0 pl-4 flex items-center ${theme.colors.mutedText} font-bold`}>රු.</span>
                     <input type="number" value={pastDuePayment} onChange={(e) => setPastDuePayment(e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} onInput={(e) => {
      // මෙතනින් කරන්නේ අකුරු ආවොත් ඒවා අයින් කරන එක
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
  }} className={`w-full pl-12 pr-4 py-3 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm`} placeholder="0.00" />
                   </div>
                </div>
              )}

              <hr className={`${theme.colors.divider} border-t my-2`} />

              <FormInput type="number" label={t.cashGivenLabel} value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} onInput={(e) => {
      // මෙතනින් කරන්නේ අකුරු ආවොත් ඒවා අයින් කරන එක
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
  }} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} icon={Wallet} placeholder={t.cashGivenPlaceholder} />

              {changeToReturn > 0 && (
                <div className="flex justify-between items-center bg-[#1b43aa] dark:bg-blue-600 p-4 rounded-xl border border-[#14348c] dark:border-blue-700 shadow-lg animate-pulse mt-4">
                  <div className="flex items-center gap-2"><Coins size={24} className="text-blue-200" /><span className="font-bold text-white text-lg">{t.changeToReturnLabel}</span></div>
                  <span className="font-bold text-3xl text-white">රු. {changeToReturn.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2">
                <label className={`block ${theme.fonts.label} ${theme.colors.labelText} mb-2 flex items-center gap-2`}><FileText size={18} className={theme.colors.mutedText} /> {t.remarksLabel}</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className={`w-full px-4 py-3 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm`} placeholder={t.remarksPlaceholder} rows="2"></textarea>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* py-3 ඉවත් කර pt-3 සහ pb-8 යොදා යටින් වැඩිපුර ඉඩක් (Bottom Padding) ලබා දී ඇත */}
      <div className={`flex-none ${theme.colors.navBg} border-t ${theme.colors.navBorder} px-4 pt-3 pb-10 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50`}>
        {currentStep === 1 ? (
          <PrimaryButton onClick={handleNextStep}>
            {t.nextStepBtn} <ArrowRight size={20} />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleSaveBill} icon={Save} className="bg-green-600! hover:bg-green-700! dark:bg-green-700! dark:hover:bg-green-800!">
            {t.saveBillBtn}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}