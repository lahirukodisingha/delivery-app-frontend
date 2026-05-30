import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { theme } from '../config/theme';

export default function PageHeader({ title, backPath = '/home', onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack(); // Custom back function එකක් තිබුණොත් ඒක වැඩ කරයි
    } else {
      navigate(backPath); // නැත්නම් සාමාන්‍ය විදිහට Home එකට යයි
    }
  };

  return (
    <div className={`flex-none flex items-center justify-between px-4 py-5 ${theme.colors.navBg} z-10 border-b ${theme.colors.navBorder} transition-colors duration-300`}>
      <button type="button" onClick={handleBack} className={`${theme.colors.headerText} p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition`}>
        <ChevronLeft size={theme.icons.headerBackBtn} strokeWidth={2.5} />
      </button>
      <h1 className={`${theme.fonts.header} ${theme.colors.headerText} tracking-wide`}>
        {title}
      </h1>
      <div className="w-8"></div>
    </div>
  );
}