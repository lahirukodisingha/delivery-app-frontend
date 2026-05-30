import { theme } from '../config/theme';

export default function PrimaryButton({ type = 'button', onClick, disabled, icon: Icon, children, className = '' }) {
  return (
    <button 
      type={type} 
      onClick={onClick}
      disabled={disabled} 
      className={`w-full ${disabled ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white' : `${theme.colors.buttonBg} ${theme.colors.buttonHover} ${theme.colors.buttonText}`} ${theme.fonts.button} py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors ${className}`}
    >
      {Icon && <Icon size={theme.icons.buttonLock} />} {children}
    </button>
  );
}