import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { FileText, Calendar, Trash2, Edit, AlertCircle, Banknote, Printer, X, ChevronDown, ChevronUp } from 'lucide-react';

import PageHeader from '../components/PageHeader';
import LoadingScreen from '../components/LoadingScreen';
import CustomAlert from '../components/CustomAlert';

export default function ShopHistory() {
  const { shopId } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.state?.from || "/shops";
  const [isChecking, setIsChecking] = useState(true);
  
  const [shop, setShop] = useState(null);
  const [bills, setBills] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null); 
  const [language, setLanguage] = useState('si');

  // Expanded Remarks State
  const [expandedRemarksId, setExpandedRemarksId] = useState(null);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', 
    type: 'success',
    showCancel: false,
    onConfirm: null
  });

  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [currentBillData, setCurrentBillData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');

    const loadShopAndBills = async () => {
      try {
        const shopData = await db.shops.get(parseInt(shopId));
        setShop(shopData);

        const shopBills = await db.bills.filter(b => String(b.shopId) === String(shopId)).toArray();
        shopBills.sort((a, b) => b.id - a.id);
        
        setBills(shopBills);

        const settings = await db.settings.toArray();
        if (settings.length > 0) setBusinessInfo(settings[0]);

        setIsChecking(false);
      } catch (error) {
        console.error("Error loading history", error);
        setIsChecking(false);
      }
    };

    loadShopAndBills();
  }, [shopId, navigate]);

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });

  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleDeleteBill = async (billId) => {
    showAlert(
      t.deleteConfirm || 'මෙම බිල මකා දැමීමට අවශ්‍ය බව ඔබට විශ්වාසද? මෙයට අදාල භාණ්ඩ ද මැකී යනු ඇත.',
      'confirm',
      true,
      async () => {
        try {
          await db.bills.delete(billId);
          
          const itemsToDelete = await db.billItems.filter(item => item.billId === billId).toArray();
          const itemIds = itemsToDelete.map(item => item.id);
          await db.billItems.bulkDelete(itemIds);

          setBills(prevBills => prevBills.filter(b => b.id !== billId));

          setTimeout(() => {
            showAlert(t.billDeletedSuccess || 'බිල සාර්ථකව මකා දමන ලදී!', 'success');
          }, 300);
        } catch (error) {
          setTimeout(() => {
            showAlert("Error deleting bill", 'error');
          }, 300);
        }
      }
    );
  };

  const handleReprintClick = async (bill) => {
    try {
      const items = await db.billItems.where({ billId: bill.id }).toArray();
      const allItems = await db.items.toArray();
      
      const populatedItems = items.map(bi => {
        const itemDef = allItems.find(i => i.id === bi.itemId);
        return {
          itemName: itemDef ? itemDef.itemName : 'Unknown Item',
          quantity: bi.quantity,
          subTotal: bi.subTotal
        };
      });

      const shopBills = await db.bills.filter(b => String(b.shopId) === String(shopId)).toArray();
      let historicalPrevDue = 0;
      shopBills.forEach(b => {
        if (b.id < bill.id) { 
          historicalPrevDue += (parseFloat(b.dueAmount) || 0);
          historicalPrevDue -= (parseFloat(b.pastDueReceived) || 0);
        }
      });
      historicalPrevDue = historicalPrevDue > 0 ? historicalPrevDue : 0;

      const payForToday = parseFloat(bill.receivedAmount) || 0;
      const dueForToday = parseFloat(bill.dueAmount) || 0;
      const payForPast = parseFloat(bill.pastDueReceived) || 0;
      const totalAmount = parseFloat(bill.totalAmount) || 0;

      setCurrentBillData({
        billId: bill.id,
        date: bill.date,
        shopName: shop.shopName,
        items: populatedItems,
        totalAmount,
        payForToday,
        dueForToday,
        previousDue: historicalPrevDue,
        payForPast,
        totalDueNow: (historicalPrevDue - payForPast) + dueForToday
      });

      setShowPrintPopup(true);
    } catch (error) {
      console.error("Error preparing reprint", error);
      showAlert("දෝෂයක්! බිල්පත් දත්ත ලබාගැනීමට නොහැක.", 'error');
    }
  };

  const handlePrint = () => {
    setShowPrintPopup(false); 
    console.log("Re-Printing Bill...", currentBillData); 
    setTimeout(() => {
      showAlert(t.printSuccess || 'සාර්ථකව ප්‍රින්ට් වුණා!', 'success');
    }, 150);
  };

  const handleCancelPrint = () => {
    setShowPrintPopup(false);
  };

  const toggleRemarks = (billId) => {
    setExpandedRemarksId(prevId => prevId === billId ? null : billId);
  };

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
                <Printer size={18}/> Re-Print Preview
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
                <p className="mt-2 text-[10px] bg-gray-200 inline-block px-2 py-0.5 rounded-full font-bold">[ DUPLICATE COPY ]</p>
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
                className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition flex justify-center items-center gap-2 shadow-lg"
              >
                <Printer size={20}/> Re-Print
              </button>
            </div>

          </div>
        </div>
      )}

      <PageHeader title={shop ? shop.shopName : t.shopHistoryTitle} backPath={backPath} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 hide-scrollbar">
        
        <div className="mb-6">
          <h2 className={`text-lg font-bold ${theme.colors.headerText} flex items-center gap-2`}>
            <FileText size={20} /> {t.shopHistoryTitle}
          </h2>
          {shop && <p className={`text-sm ${theme.colors.mutedText} mt-1`}>{shop.address || shop.phone}</p>}
        </div>

        {bills.length === 0 ? (
          <div className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} p-8 text-center shadow-sm`}>
            <AlertCircle size={32} className={`${theme.colors.mutedText} mx-auto mb-3 opacity-50`} />
            <p className={`text-sm font-medium ${theme.colors.mutedText}`}>{t.noBillsFound}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => {
              const isRemarksExpanded = expandedRemarksId === bill.id;
              
              return (
                <div key={bill.id} className={`${theme.colors.cardBg} rounded-xl border ${theme.colors.divider} shadow-sm overflow-hidden transition-all duration-300`}>
                  
                  <div className={`p-4 border-b ${theme.colors.divider} flex justify-between items-center bg-blue-50/30 dark:bg-gray-800/50`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#14348c] dark:text-blue-400" />
                      <span className={`font-bold text-[14px] ${theme.colors.inputText}`}>{bill.date}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[12px] font-bold ${theme.colors.mutedText} block`}>{t.totalAmount}</span>
                      <span className="font-bold text-[16px] text-[#14348c] dark:text-blue-300">රු. {parseFloat(bill.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 flex justify-between items-start relative">
                    <div className="space-y-1.5">
                      <p className={`text-[13px] ${theme.colors.mutedText} flex items-center gap-1`}>
                        <Banknote size={14} className="text-green-600" /> {t.paidAmount} 
                        {/* මෙහි තිබූ (receivedAmount + pastDueReceived) වෙනුවට receivedAmount පමණක් යොදා ඇත */}
                        <strong className="text-green-600 ml-1">රු. {parseFloat(bill.receivedAmount || 0).toFixed(2)}</strong>
                      </p>

                      {/* අලුතින් එක් කළ හිඟ මුදල් ලැබුණු බව පෙන්වන තැඹිලි පාට කොටස */}
                      {parseFloat(bill.pastDueReceived) > 0 && (
                        <p className={`text-[13px] ${theme.colors.mutedText} flex items-center gap-1`}>
                          <Banknote size={14} className="text-orange-500" /> {t.pastDueReceivedLabel || 'ලැබුණු හිඟ මුදල:'} 
                          <strong className="text-orange-500 ml-1">රු. {parseFloat(bill.pastDueReceived).toFixed(2)}</strong>
                        </p>
                      )}

                      {/* පරණ ණය පෙන්වන රතු පාට කොටස */}
                      {parseFloat(bill.dueAmount) > 0 && (
                        <p className={`text-[13px] ${theme.colors.mutedText} flex items-center gap-1`}>
                          <AlertCircle size={14} className="text-red-500" /> {t.dueAmount} 
                          <strong className="text-red-500 ml-1">රු. {parseFloat(bill.dueAmount).toFixed(2)}</strong>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {bill.isPrinted && (
                        <button 
                          onClick={() => handleReprintClick(bill)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Re-print Bill"
                        >
                          <Printer size={18} />
                        </button>
                      )}

                      <button 
                        onClick={() => navigate(`/edit-bill/${bill.id}`)}
                        className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#14348c] dark:text-blue-400 hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Expand වෙන ත්‍රිකෝණය ඉවත් කර කෙලින්ම රීමාර්ක් එක පෙන්වීම */}
                  {bill.remarks && (
                    <div className={`bg-gray-50 dark:bg-gray-900/50 border-t ${theme.colors.divider} py-3 px-4`}>
                      <p className={`text-[13px] font-medium ${theme.colors.mutedText} flex gap-2 items-start`}>
                        <FileText size={16} className="text-[#14348c] dark:text-blue-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">
                          {bill.remarks}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Expandable Remarks Area - රීමාර්ක් එකක් ඇත්නම් පමණක් මෙය සෑදේ */}
                  {bill.remarks && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900/50 border-t ${theme.colors.divider} ${isRemarksExpanded ? 'max-h-40 opacity-100 py-4 px-5' : 'max-h-0 opacity-0 py-0 px-5'}`}>
                      <p className={`text-[13px] font-medium ${theme.colors.mutedText} flex gap-2 items-start`}>
                        <FileText size={16} className="text-[#14348c] dark:text-blue-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">
                          {bill.remarks}
                        </span>
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}