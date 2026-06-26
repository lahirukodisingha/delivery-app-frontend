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
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [records, setRecords] = useState([]);
  
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [expenseOptions, setExpenseOptions] = useState([]);
  const [incomeOptions, setIncomeOptions] = useState([]);

  const [alertConfig, setAlertConfig] = useState({ 
    message: '', type: 'success', showCancel: false, onConfirm: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    setLanguage(localStorage.getItem('appLanguage') || 'si');

    const loadSettings = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.expense_categories) {
          setExpenseOptions(parsed.expense_categories.map(c => ({ value: c, label: c })));
          setCategory(parsed.expense_categories[0] || '');
        }
        if (parsed.income_categories) {
          setIncomeOptions(parsed.income_categories.map(c => ({ value: c, label: c })));
        }
      }
      setIsChecking(false);
    };
    loadSettings();
  }, [navigate]);

  useEffect(() => {
    if (!isChecking) loadRecords();
  }, [startDate, endDate, isChecking]);

  const loadRecords = async () => {
    const data = await db.expenses
      .filter(record => record.date >= startDate && record.date <= endDate)
      .toArray();
    data.sort((a, b) => b.id - a.id);
    setRecords(data);
  };

  const t = translations[language] || translations['si'];

  const closeAlert = () => setAlertConfig({ ...alertConfig, message: '' });
  const showAlert = (message, type = 'success', showCancel = false, onConfirm = null) => {
    setAlertConfig({ message, type, showCancel, onConfirm });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!category || !amount) {
      showAlert(t.enterItemsOrPaymentAlert || 'කරුණාකර සියලු විස්තර ඇතුලත් කරන්න', 'error');
      return;
    }

    try {
      await db.expenses.add({
        date: recordDate,
        type,
        category,
        amount: parseFloat(amount),
        note: note.trim(),
        syncStatus: 'pending'
      });
      
      showAlert(t.recordSaved || 'සටහන සාර්ථකව සුරැකුවා!', 'success');
      setAmount('');
      setNote('');
      loadRecords();
    } catch (err) {
      showAlert(t.saveError || 'දෝෂයක් මතු විය!', 'error');
    }
  };

  const handleDelete = (id) => {
    showAlert(
      t.deleteRecordConfirm || 'මෙම සටහන මකා දැමීමට අවශ්‍යද?', 
      'confirm', 
      true, 
      async () => {
        try {
          await db.expenses.delete(id);
          showAlert(t.recordDeleted || 'සටහන මකා දැමුවා!', 'success');
          loadRecords();
        } catch (err) {
          showAlert(t.saveError || 'දෝෂයක් මතු විය!', 'error');
        }
      }
    );
  };

  if (isChecking) return <LoadingScreen />;

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const currentOptions = type === 'expense' ? expenseOptions : incomeOptions;

  return (
    <div className={`h-dvh ${theme.colors.background} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      
      <CustomAlert 
        message={alertConfig.message} type={alertConfig.type} showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm} onClose={closeAlert} language={language}
      />

      <PageHeader title={t.expenseTrackerTitle || "දෛනික වියදම් සහ ආදායම්"} />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 hide-scrollbar">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800 shadow-sm text-center">
             <p className="text-[11px] font-bold text-green-600 dark:text-green-400 mb-1">{t.totalIncome || "ආදායම"}</p>
             <p className="text-[14px] font-bold text-green-700 dark:text-green-300">රු. {totalIncome.toFixed(0)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800 shadow-sm text-center">
             <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">{t.totalExpense || "වියදම"}</p>
             <p className="text-[14px] font-bold text-red-700 dark:text-red-300">රු. {totalExpense.toFixed(0)}</p>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm text-center ${netBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
             <p className={`text-[11px] font-bold mb-1 ${netBalance >= 0 ? 'text-[#14348c] dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{t.netBalance || "ඉතිරිය"}</p>
             <p className={`text-[14px] font-bold ${netBalance >= 0 ? 'text-[#14348c] dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>රු. {Math.abs(netBalance).toFixed(0)}</p>
          </div>
        </div>

        {/* Add Record Form */}
        <div className="bg-white dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md mb-8">
          <h3 className="font-bold text-[#14348c] dark:text-blue-400 text-[15px] mb-4 flex items-center gap-2">
             <Wallet size={18} /> {t.addRecordBtn || "සටහන එක් කරන්න"}
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
               <button type="button" onClick={() => { setType('income'); setCategory(incomeOptions[0]?.value || ''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400' : 'text-gray-500'}`}>{t.typeIncome || "ආදායම්"}</button>
               <button type="button" onClick={() => { setType('expense'); setCategory(expenseOptions[0]?.value || ''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-600 shadow text-red-600 dark:text-red-400' : 'text-gray-500'}`}>{t.typeExpense || "වියදම්"}</button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1"><FormInput type="date" label={t.dateLabel || "දිනය"} value={recordDate} onChange={(e) => setRecordDate(e.target.value)} icon={Calendar} required /></div>
              <div className="flex-1 relative">
                 <FormSelect label={t.selectCategory || "වර්ගය"} value={category} onChange={(e) => setCategory(e.target.value)} options={currentOptions} icon={Tag} required />
                 <div className="absolute right-3 bottom-[13px] pointer-events-none"><ChevronDown size={18} className={theme.colors.mutedText} /></div>
              </div>
            </div>

            <FormInput type="number" step="0.01" label={t.amountLabel || "මුදල (රු.)"} value={amount} onChange={(e) => setAmount(e.target.value)} icon={Coins} required placeholder="0.00" />
            <FormInput label={t.noteLabel || "සටහනක්"} value={note} onChange={(e) => setNote(e.target.value)} icon={FileText} placeholder="Optional" />

            <PrimaryButton type="submit" icon={Plus} className={`w-full ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{t.saveBtn || "සුරකින්න"}</PrimaryButton>
          </form>
        </div>

        {/* Date Filter & Records List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[16px]">{t.periodRange || "කාලසීමාව"}</h3>
          </div>
          
          <div className="flex gap-3 mb-5">
             <div className="flex-1"><FormInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
             <div className="flex-1"><FormInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>

          <div className="space-y-3">
             {records.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                   <p className="text-sm font-medium text-gray-500">{t.noRecordsFound || "මෙම දිනයට සටහන් කිසිවක් නැත."}</p>
                </div>
             ) : (
                records.map(record => {
                  const isIncome = record.type === 'income';
                  const catLabel = isIncome 
                    ? incomeOptions.find(o => o.value === record.category)?.label || record.category
                    : expenseOptions.find(o => o.value === record.category)?.label || record.category;

                  return (
                    <div key={record.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
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
                })
             )}
          </div>
        </div>

      </div>
    </div>
  );
}