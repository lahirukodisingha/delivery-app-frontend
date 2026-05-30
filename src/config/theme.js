// src/config/theme.js

export const theme = {
  // 1. වර්ණ (Colors)
  colors: {
    // --- ඔයාගේ කලින් තිබුණු වර්ණ වලට Dark mode එකතු කර ඇත ---
    background: "bg-[#f4f7fb] dark:bg-gray-950",          // සම්පූර්ණ පසුබිම් වර්ණය
    headerText: "text-[#14348c] dark:text-white",         // උඩම තියෙන මාතෘකාවේ වර්ණය
    labelText: "text-gray-900 dark:text-gray-300",        // ෆෝම් එකේ ලේබල් වල වර්ණය
    inputText: "text-gray-900 dark:text-white",           // ටයිප් කරන අකුරු වල වර්ණය
    buttonBg: "bg-[#1b43aa] dark:bg-blue-600",            // බටන් එකේ වර්ණය
    buttonHover: "hover:bg-[#14348c] dark:hover:bg-blue-700", // බටන් එක උඩට මවුස් එක ගෙනිච්චම වර්ණය
    buttonText: "text-white dark:text-white",             // බටන් එකේ අකුරු වල වර්ණය
    navIconText: "text-[#475569] dark:text-gray-500",     // යට මෙනු එකේ සාමාන්‍ය වර්ණය
    navIconHover: "hover:text-[#14348c] dark:hover:text-blue-400", // යට මෙනු එක උඩට ගියාම වර්ණය

    // --- ඉතිරි පිටු ඩාර්ක් මෝඩ් කිරීමට අවශ්‍ය නව වර්ණ ---
    cardBg: "bg-white dark:bg-gray-800",                  // කාඩ් සහ කොටු වල පසුබිම
    mutedText: "text-gray-500 dark:text-gray-400",        // සාමාන්‍ය අළු පාට අකුරු (විස්තර)
    navBg: "bg-white dark:bg-gray-900",                   // යට මෙනුව සහ උඩ මෙනුවේ පසුබිම
    navBorder: "border-gray-200 dark:border-gray-800",    // මෙනු වල බෝඩර් වර්ණය
    inputBorder: "border-gray-300 dark:border-gray-700",  // ඉන්පුට් කොටු වල බෝඩර්
    inputFocus: "focus:border-[#14348c] dark:focus:border-blue-500 focus:ring-[#14348c] dark:focus:ring-blue-500", // ඉන්පුට් එක උඩ ක්ලික් කරාම
    divider: "border-gray-200 dark:border-gray-800"       // වෙන් කරන ඉරි වල පාට (hr tags)
  },

  // 2. අකුරු වල ප්‍රමාණයන් (Font Sizes) - ඔයාගේ මුල් අගයන්ම ඇත
  fonts: {
    header: "text-[16px] font-bold",     // උඩ මාතෘකාව
    label: "text-[12px] font-bold",      // ලේබල් (උදා: ෂොප් නම, ලිපිනය)
    input: "text-[14px] font-medium",    // ටයිප් කරන අකුරු
    button: "text-[12px] font-bold",     // සුරකින්න බටන් එකේ අකුරු
    navText: "text-[10px] font-bold"     // යට මෙනු එකේ අකුරු
  },

  // 3. අයිකන් වල ප්‍රමාණයන් (Icon Sizes) - ඔයාගේ මුල් අගයන්ම ඇත
  icons: {
    headerBackBtn: 28, // උඩ තියෙන Back Arrow එක
    camera: 20,        // කැමරා අයිකන් එක
    buttonLock: 20,    // බටන් එකේ තියෙන ඉබි යතුර
    navMenu: 24        // යට මෙනු එකේ අයිකන්
  }
};