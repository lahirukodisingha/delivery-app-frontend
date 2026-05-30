import { theme } from '../config/theme';

export default function FormInput({ label, type = 'text', value, onChange, placeholder, required, icon: Icon, step }) {
  return (
    <div>
      <label className={`block ${theme.fonts.label} ${theme.colors.labelText} mb-2 flex items-center gap-2 transition-colors`}>
        {Icon && <Icon size={18} className="text-[#14348c] dark:text-blue-400" />} {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} 
        step={step}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3.5 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} focus:outline-none ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm transition-colors ${type === 'tel' ? 'tracking-wider' : ''}`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}