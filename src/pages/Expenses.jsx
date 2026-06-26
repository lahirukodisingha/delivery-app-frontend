import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { theme } from '../config/theme';
import { translations } from '../config/translations';
import { 
  Calendar, Coins, ArrowDownCircle, ArrowUpCircle, 
  Trash2, Plus, FileText, Tag, Wallet, ChevronDown 
} from 'lucide-react';

import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PrimaryButton from '../components/PrimaryButton';
import CustomAlert from '../components/CustomAlert';

export default function Expenses() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [language, setLanguage] = useState('si');

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Date Range States
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  
  // New Record Date
  const [recordDate, setRecordDate] = useState(todayStr);
  
  const [records, setRecords] = useState([]);
  
  // Form States
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', type: 'success', showCancel: false, onConfirm: null
  });

  // --- Dynamic Categories States ---
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');
    setIsChecking(false);
  }, [navigate]);

  useEffect(() => {
    loadRecords();
  }, [startDate, endDate]);

  // Load Settings from LocalStorage for Dynamic Dropdowns
  useEffect(() => {
    const loadDynamicSettings = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        
        if (parsed.expense_categories && parsed.expense_categories.length > 0) {
           setExpenseCategories(parsed.expense_categories.map(cat => ({ label: cat, value: cat })));
        }
        if (parsed.income_categories && parsed.income_categories.length > 0) {
           setIncomeCategories(parsed.income_categories.map(cat => ({ label: cat, value: cat })));
        }
      }
    };
    loadDynamicSettings();
  }, []);

  const loadRecords = async () => {
    try {
      const allRecords = await db.expenses
        .filter(e => e.date >= startDate && e.date <= endDate)
        .toArray();
        
      allRecords.sort((a, b) => b.id - a.id);
      setRecords(allRecords);
    } catch (error) {
      console.error("Error loading expenses", error);
    }
  };

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });
  const showAlert = (message, alertType = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type: alertType, showCancel, onConfirm });
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      showAlert(t.invalidAmount, 'error');
      return;
    }
    if (!category) {
      showAlert(t.selectCategoryAlert, 'error');
      return;
    }

    try {
      await db.expenses.add({
        date: recordDate, 
        type,
        category,
        amount: parseFloat(amount),
        note,
        timestamp: Date.now(),
        syncStatus: 'pending'
      });

      setAmount('');
      setNote('');
      setCategory('');
      loadRecords();
      
      showAlert(t.recordAddedSuccess, 'success');
    } catch (error) {
      showAlert(t.recordSaveError, 'error');
    }
  };

  const handleDelete = (id) => {
    showAlert(
      t.deleteRecordConfirm, // වෙනස් කළ ස්ථානය
      'confirm',
      true,
      async () => {
        await db.expenses.delete(id);
        loadRecords();
        setTimeout(() => showAlert(t.recordDeletedSuccess, 'success'), 300);
      }
    );
  };

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const dropdownOptions = [
    { label: t.selectOption, value: '' },
    ...currentCategories
  ];

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalIncome - totalExpense;

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

      <PageHeader title={t.incomeAndExpenses} backPath="/more" />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 hide-scrollbar">
        
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <FormInput type="date" label={t.startDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} icon={Calendar} />
          </div>
          <div className="flex-1">
            <FormInput type="date" label={t.endDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} icon={Calendar} />
          </div>
        </div>

        <div className={`rounded-2xl p-5 mb-6 shadow-sm border ${theme.colors.cardBg} ${theme.colors.inputBorder} transition-colors`}>
          <p className={`${theme.colors.mutedText} text-[12px] font-bold tracking-wide uppercase mb-1 flex items-center gap-2`}>
            <Wallet size={14} /> {t.periodNetBalance}
          </p>
          <h2 className={`text-3xl font-bold mb-4 ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {netBalance < 0 ? '-' : ''} රු. {Math.abs(netBalance).toFixed(2)}
          </h2>
          
          <div className={`flex justify-between border-t ${theme.colors.divider} pt-3`}>
            <div>
              <p className={`${theme.colors.mutedText} text-[11px] font-bold`}>{t.incomeLabel}</p>
              <p className="text-green-600 dark:text-green-400 font-bold">රු. {totalIncome.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className={`${theme.colors.mutedText} text-[11px] font-bold`}>{t.expenseLabel}</p>
              <p className="text-red-600 dark:text-red-400 font-bold">රු. {totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className={`${theme.colors.cardBg} rounded-2xl border ${theme.colors.inputBorder} p-4 mb-6 shadow-sm transition-colors`}>
          <h3 className={`font-bold text-[15px] ${theme.colors.inputText} mb-3`}>
            {t.addNewRecord}
          </h3>
          
          <form onSubmit={handleAddRecord} className="space-y-4">
            
            <div>
              <FormInput type="date" label={t.recordDateLabel} value={recordDate} onChange={(e) => setRecordDate(e.target.value)} icon={Calendar} required />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); }}
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${type === 'income' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-green-600'}`}
              >
                <ArrowUpCircle size={16} /> {t.incomeBtn}
              </button>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-red-600'}`}
              >
                <ArrowDownCircle size={16} /> {t.expenseBtn}
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FormSelect label={t.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)} options={dropdownOptions} icon={Tag} required />
                <div className="absolute right-3 bottom-[13px] pointer-events-none">
                  <ChevronDown size={18} className={theme.colors.mutedText} />
                </div>
              </div>
              <div className="flex-1">
                <FormInput type="text" inputMode="decimal" label={t.amountRsLabel} value={amount} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '');
                    if ((val.match(/\./g) || []).length <= 1) setAmount(val);
                  }} 
                  icon={Coins} placeholder="0.00" required 
                />
              </div>
            </div>

            <FormInput type="text" label={t.remarksLabel || 'සටහන (Note)'} value={note} onChange={(e) => setNote(e.target.value)} icon={FileText} placeholder={t.shortDescPlaceholder} />

            <PrimaryButton type="submit" icon={Plus} className={type === 'income' ? 'bg-green-600! hover:bg-green-700!' : 'bg-red-600! hover:bg-red-700!'}>
              {t.addRecordBtn}
            </PrimaryButton>
          </form>
        </div>

        <div>
          <h3 className={`font-bold text-[15px] ${theme.colors.inputText} mb-3`}>
            {t.recordsList}
          </h3>
          
          {records.length === 0 ? (
            <div className={`p-6 rounded-xl border border-dashed ${theme.colors.inputBorder} text-center transition-colors`}>
              <FileText size={28} className={`${theme.colors.mutedText} mx-auto mb-2 opacity-50`} />
              <p className={`${theme.colors.mutedText} text-sm font-medium`}>
                {t.noRecordsPeriod}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const isIncome = record.type === 'income';
                const catObj = (isIncome ? incomeCategories : expenseCategories).find(c => c.value === record.category);
                const catLabel = catObj ? catObj.label : record.category;

                return (
                  <div key={record.id} className={`${theme.colors.cardBg} border ${theme.colors.inputBorder} p-3 rounded-xl shadow-sm flex items-center justify-between transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isIncome ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                      </div>
                      <div>
                        <p className={`font-bold text-[14px] ${theme.colors.inputText}`}>{catLabel}</p>
                        <p className={`text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5`}>{record.date}</p>
                        {record.note && <p className={`text-[11px] ${theme.colors.mutedText} mt-0.5 leading-tight`}>{record.note}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`font-bold text-[15px] ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncome ? '+' : '-'} {parseFloat(record.amount).toFixed(2)}
                      </span>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}