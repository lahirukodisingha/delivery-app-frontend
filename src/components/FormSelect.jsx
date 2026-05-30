import { theme } from '../config/theme';

export default function FormSelect({ label, value, onChange, options, disabled, icon: Icon, required, placeholderOption }) {
  return (
    <div>
      <label className={`block ${theme.fonts.label} ${theme.colors.labelText} mb-2 flex items-center gap-2 transition-colors`}>
        {Icon && <Icon size={18} className="text-[#14348c] dark:text-blue-400" />} {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3.5 border ${theme.colors.inputBorder} rounded-xl ${theme.fonts.input} ${theme.colors.inputText} focus:outline-none ${theme.colors.inputFocus} ${theme.colors.cardBg} shadow-sm appearance-none transition-colors`}
        required={required}
      >
        {placeholderOption && <option value="">{placeholderOption}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}