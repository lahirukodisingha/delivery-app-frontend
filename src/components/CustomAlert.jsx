import { CheckCircle2, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { translations } from '../config/translations'; // Translations ෆයිල් එක ලින්ක් කර ඇත

export default function CustomAlert({ 
  message, 
  type = 'success', 
  onClose, 
  onConfirm, 
  showCancel = false, 
  language = 'si' // පේජ් එකෙන් එවන භාෂාව ලබාගැනීම
}) {
  if (!message) return null;

  const t = translations[language] || translations['si'];

  // භාෂාව අනුව බොත්තම් වල වචන මාරු වීම (Translations වල නැති වුණත් වැඩ කරන්න Fallback දමා ඇත)
  const confirmText = t.okBtn || (language === 'en' ? 'OK' : language === 'ta' ? 'சரி' : 'හරි');
  const cancelText = t.cancelBtn || (language === 'en' ? 'Cancel' : language === 'ta' ? 'ரத்துசெய்' : 'අවලංගු කරන්න');

  // ඇලට් වර්ගය අනුව බොත්තම්, වර්ණ සහ අයිකන් ඇනිමේශන් (Animations)
  const types = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-500 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      btnBg: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30',
      iconAnim: 'iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30',
      iconAnim: 'iconShake 0.4s ease-in-out forwards'
    },
    info: {
      icon: Info,
      color: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      btnBg: 'bg-[#14348c] hover:bg-[#1b43aa] text-white shadow-lg shadow-blue-600/30',
      iconAnim: 'iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
    },
    confirm: {
      icon: HelpCircle,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      btnBg: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30',
      iconAnim: 'iconPulse 0.8s infinite alternate'
    }
  };

  const style = types[type] || types.info;
  const Icon = style.icon;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
      style={{ animation: 'backdropFade 0.25s ease-out forwards' }}
    >
      {/* Alert Box එක */}
      <div 
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col"
        style={{ animation: 'popupEmerge 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
      >
        
        {/* අයිකනය සහ පණිවිඩය */}
        <div className="p-8 text-center flex-1">
          <div 
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${style.bg}`}
            style={{ animation: style.iconAnim }}
          >
            <Icon className={style.color} size={42} strokeWidth={2.5} />
          </div>
          <p className="text-[17px] font-bold text-gray-800 dark:text-gray-100 leading-relaxed px-2">
            {message}
          </p>
        </div>
        
        {/* බොත්තම් (Solid Buttons) */}
        <div className="p-5 pt-0 flex gap-3 bg-white dark:bg-gray-800">
          
          {/* Cancel බොත්තම */}
          {showCancel && (
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-3.5 px-4 text-[15px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all duration-200"
            >
              {cancelText}
            </button>
          )}
          
          {/* OK / Confirm බොත්තම */}
          <button 
            type="button"
            onClick={handleConfirm} 
            className={`flex-1 py-3.5 px-4 text-[15px] font-bold rounded-xl active:scale-95 transition-all duration-200 ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes iconPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes iconShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes iconPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes backdropFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        @keyframes popupEmerge {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}