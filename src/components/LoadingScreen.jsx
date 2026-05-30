import { theme } from '../config/theme';

export default function LoadingScreen() {
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.colors.background} ${theme.colors.headerText}`}>
      Loading...
    </div>
  );
}