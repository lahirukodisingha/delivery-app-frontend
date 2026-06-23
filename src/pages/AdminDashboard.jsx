import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Settings, LogOut, LayoutDashboard, UserPlus, Calendar, KeyRound, CheckCircle2, Clock, Megaphone, Save, Plus, X, Trash2, Edit, Menu } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State

  // --- Add User States ---
  const [newFirstName, setNewFirstName] = useState(''); 
  const [newLastName, setNewLastName] = useState('');   
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);
  const [addError, setAddError] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  // --- App Settings & Notifications States ---
  const [notifications, setNotifications] = useState([]);
  const [notifInput, setNotifInput] = useState({
    si: { title: '', message: '' },
    en: { title: '', message: '' },
    ta: { title: '', message: '' }
  });
  const [activeLangTab, setActiveLangTab] = useState('si');

  const [units, setUnits] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  
  const [unitInput, setUnitInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [incomeInput, setIncomeInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // --- Modal States ---
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', driver: null });
  const [modalInput, setModalInput] = useState('');
  const [modalInput2, setModalInput2] = useState(''); 

  const [modalLoading, setModalLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'settings', name: 'App Settings', icon: Settings },
  ];

  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const res = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error("Error fetching drivers", err);
    }
    setIsLoadingDrivers(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnits(data.units || []);
        setExpenseCategories(data.expense_categories || []);
        setIncomeCategories(data.income_categories || []);
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchDrivers();
    if (activeTab === 'notifications' || activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAdding(true); setAddMessage(null); setAddError(null);
    try {
      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/register-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword,
          first_name: newFirstName, 
          last_name: newLastName    
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAddMessage(`සාර්ථකයි! ${data.username} ගේ ගිණුම සාදන ලදී.`);
        setNewFirstName(''); setNewLastName(''); setNewUsername(''); setNewPassword('');
        fetchDrivers(); 
      } else {
        setAddError(data.error || 'ලියාපදිංචි කිරීම අසාර්ථකයි.');
      }
    } catch (err) {
      setAddError('සර්වර් දෝෂයකි.');
    }
    setIsAdding(false);
  };

  const handleModalSubmit = async () => {
    setModalLoading(true);
    const { type, driver } = modalConfig;
    try {
      let url = ''; let bodyData = {};
      if (type === 'validity') {
        url = `https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}/validity`;
        bodyData = { valid_until: modalInput };
      } else if (type === 'password') {
        url = `https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}/reset-password`;
        bodyData = { new_password: modalInput };
      } else if (type === 'name') {
        url = `https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}/name`;
        bodyData = { first_name: modalInput, last_name: modalInput2 };
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setModalConfig({ isOpen: false, type: '', driver: null });
        setModalInput(''); setModalInput2('');
        fetchDrivers(); 
      } else {
        alert(data.error || 'දෝෂයක් මතු විය!');
      }
    } catch (err) { alert("සර්වර් දෝෂයකි."); }
    setModalLoading(false);
  };

  const openModal = (type, driver) => {
    setModalConfig({ isOpen: true, type, driver });
    if (type === 'validity') {
      setModalInput(driver.account_valid_until);
    } else if (type === 'name') {
      setModalInput(driver.first_name || '');
      setModalInput2(driver.last_name || '');
    } else {
      setModalInput('');
    }
  };

  const handleDeleteDriver = async (driver) => {
    if(window.confirm(`ඔබට ${driver.username} ගේ ගිණුම සම්පූර්ණයෙන්ම මකා දැමීමට අවශ්‍ය බව විශ්වාසද? මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.`)) {
      try {
        const res = await fetch(`https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if(res.ok) {
          alert(data.message);
          fetchDrivers();
        } else {
          alert(data.error || "මකා දැමීමේදී දෝෂයක් මතු විය.");
        }
      } catch (err) {
        alert("සර්වර් දෝෂයකි.");
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications: notifications,
          units: units,
          expense_categories: expenseCategories,
          income_categories: incomeCategories
        })
      });
      if (res.ok) {
        alert("දත්ත සාර්ථකව සුරැකුවා!");
      }
    } catch (error) {
      alert("දෝෂයක් මතු විය!");
    }
    setIsSavingSettings(false);
  };

  const handleAddNotification = () => {
    // සිංහල මාතෘකාව හෝ විස්තරය අනිවාර්ය කරමු
    if (!notifInput.si.title.trim() || !notifInput.si.message.trim()) {
      alert("කරුණාකර අවම වශයෙන් සිංහල මාතෘකාව සහ විස්තරය හෝ ඇතුලත් කරන්න!");
      return;
    }
    const newNotif = {
      id: Date.now().toString(),
      title: {
        si: notifInput.si.title.trim(),
        en: notifInput.en.title.trim() || notifInput.si.title.trim(), // ඉංග්‍රීසි නැත්නම් සිංහල එකම යවයි
        ta: notifInput.ta.title.trim() || notifInput.si.title.trim()
      },
      message: {
        si: notifInput.si.message.trim(),
        en: notifInput.en.message.trim() || notifInput.si.message.trim(),
        ta: notifInput.ta.message.trim() || notifInput.si.message.trim()
      },
      date: new Date().toISOString().split('T')[0]
    };
    
    setNotifications([newNotif, ...notifications]); 
    setNotifInput({
      si: { title: '', message: '' },
      en: { title: '', message: '' },
      ta: { title: '', message: '' }
    });
    setActiveLangTab('si');
  };

  const handleRemoveNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const addItemToArray = (item, setArray, array, setInput) => {
    if (item.trim() && !array.includes(item.trim())) {
      setArray([...array, item.trim()]);
      setInput('');
    }
  };

  const removeItemFromArray = (index, setArray, array) => {
    const newArray = [...array];
    newArray.splice(index, 1);
    setArray(newArray);
  };

  const ArrayManager = ({ title, placeholder, array, setArray, input, setInput }) => (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
      <label className="block text-gray-700 font-bold mb-2 text-sm">{title}</label>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItemToArray(input, setArray, array, setInput))}
        />
        <button type="button" onClick={() => addItemToArray(input, setArray, array, setInput)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition flex items-center gap-1">
          <Plus size={16}/> <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {array.map((item, idx) => (
          <div key={idx} className="bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm">
            {item}
            <button type="button" onClick={() => removeItemFromArray(idx, setArray, array)} className="text-gray-400 hover:text-red-500 transition"><X size={14}/></button>
          </div>
        ))}
        {array.length === 0 && <span className="text-xs text-gray-400">කිසිවක් එකතු කර නැත</span>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block w-64 bg-[#14348c] text-white p-6 flex flex-col shadow-xl z-50 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-wide">Admin Panel</h1>
          <button className="lg:hidden p-1 bg-white/10 rounded-lg hover:bg-white/20 transition" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-white/20 shadow-md' : 'hover:bg-white/10'}`}
            >
              <item.icon size={20} /> {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-blue-200 hover:text-white transition-colors bg-white/5 hover:bg-red-500/80 rounded-xl mt-auto">
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-[#14348c] hover:bg-gray-100 rounded-lg transition">
              <Menu size={28} />
            </button>
            <h1 className="font-bold text-gray-800 text-lg">
              {menuItems.find(i => i.id === activeTab)?.name || 'Admin Panel'}
            </h1>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          
          {activeTab === 'dashboard' && (
            <div><h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 hidden lg:block">Dashboard Summary</h1><p className="text-gray-600">මෙතනට අපි ඉදිරියේදී මුළු සාරාංශයම ගේමු.</p></div>
          )}

          {/* --- USER MANAGEMENT TAB --- */}
          {activeTab === 'users' && (
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 hidden lg:block">User Management</h1>
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                
                {/* Add User Card */}
                <div className="w-full lg:w-1/3 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-[#14348c] mb-4 md:mb-6 flex items-center gap-2"><UserPlus size={20} /> නව රියදුරු ගිණුමක් සෑදීම</h2>
                  {addMessage && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium">{addMessage}</div>}
                  {addError && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">{addError}</div>}
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                      <div className="w-full sm:w-1/2"><label className="block text-gray-700 font-bold mb-1.5 text-sm">මුල් නම</label><input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="උදා: කමල්" /></div>
                      <div className="w-full sm:w-1/2"><label className="block text-gray-700 font-bold mb-1.5 text-sm">අවසන් නම</label><input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="උදා: පෙරේරා" /></div>
                    </div>
                    <div><label className="block text-gray-700 font-bold mb-1.5 text-sm">Username</label><input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="උදා: kamal123" required /></div>
                    <div><label className="block text-gray-700 font-bold mb-1.5 text-sm">Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="අවම අකුරු 6ක්..." required /></div>
                    <button type="submit" disabled={isAdding} className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-md text-sm ${isAdding ? 'bg-blue-400' : 'bg-[#14348c] hover:bg-blue-800 hover:shadow-lg'}`}>{isAdding ? 'සාදමින් පවතී...' : 'නව ගිණුම සාදන්න'}</button>
                  </form>
                </div>

                {/* Existing Users List */}
                <div className="w-full lg:w-2/3 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-[#14348c] mb-4 md:mb-6 flex items-center gap-2"><Users size={20} /> දැනට සිටින රියදුරන්</h2>
                  {isLoadingDrivers ? <p className="text-gray-500 text-sm">ලෝඩ් වෙමින් පවතී...</p> : (
                    <div className="overflow-x-auto pb-4">
                      <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                          <tr>
                            <th className="py-3 px-4 rounded-l-xl">නම / Username</th>
                            <th className="py-3 px-4">Status / Validity</th>
                            <th className="py-3 px-4">Last Login</th>
                            <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {drivers.map(driver => (
                            <tr key={driver._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4">
                                <p className="font-bold text-gray-800">{driver.first_name || '-'} {driver.last_name || ''}</p>
                                <p className="text-xs text-gray-500">@{driver.username}</p>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex flex-col gap-1">
                                  {driver.is_active ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Active</span> : <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold w-max">Expired</span>}
                                  <span className="text-xs text-gray-500 font-medium">{driver.account_valid_until} තෙක්</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-xs text-gray-500">
                                 <div className="flex items-center gap-1 mt-2"><Clock size={14}/> {driver.last_login_date}</div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-1 sm:gap-1.5">
                                  <button onClick={() => openModal('name', driver)} className="p-2 text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition" title="Edit Name"><Edit size={16} /></button>
                                  <button onClick={() => openModal('validity', driver)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition" title="Edit Validity"><Calendar size={16} /></button>
                                  <button onClick={() => openModal('password', driver)} className="p-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition" title="Reset Password"><KeyRound size={16} /></button>
                                  <button onClick={() => handleDeleteDriver(driver)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Delete Account"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {drivers.length === 0 && <tr><td colSpan="4" className="py-6 text-center text-gray-500">රියදුරන් කිසිවෙකු නොමැත.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */} 
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 hidden lg:block">App Notifications</h1>
                {/* Save All Changes බොත්තම නැවතත් එක් කරන ලදී */}
                <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2">
                  <Save size={18}/> {isSavingSettings ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>

              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-[#14348c] mb-4 flex items-center gap-2">
                  <Megaphone size={20} /> නව පණිවිඩයක් එක් කරන්න
                </h2> 

                {/* භාෂාව තෝරන Tabs */}
                <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl w-max">
                  <button onClick={() => setActiveLangTab('si')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeLangTab === 'si' ? 'bg-white shadow text-[#14348c]' : 'text-gray-500 hover:bg-white/50'}`}>සිංහල</button>
                  <button onClick={() => setActiveLangTab('en')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeLangTab === 'en' ? 'bg-white shadow text-[#14348c]' : 'text-gray-500 hover:bg-white/50'}`}>English</button>
                  <button onClick={() => setActiveLangTab('ta')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeLangTab === 'ta' ? 'bg-white shadow text-[#14348c]' : 'text-gray-500 hover:bg-white/50'}`}>தமிழ்</button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-sm flex justify-between">
                      <span>පණිවිඩයේ මාතෘකාව (Title)</span>
                      <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-xs">{activeLangTab.toUpperCase()}</span>
                    </label>
                    <input 
                      type="text" 
                      value={notifInput[activeLangTab].title} 
                      onChange={(e) => setNotifInput({...notifInput, [activeLangTab]: {...notifInput[activeLangTab], title: e.target.value}})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none text-sm"
                      placeholder="මාතෘකාව මෙහි ටයිප් කරන්න..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-sm flex justify-between">
                      <span>පණිවිඩයේ විස්තරය (Description)</span>
                      <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-xs">{activeLangTab.toUpperCase()}</span>
                    </label>
                    <textarea 
                      value={notifInput[activeLangTab].message} 
                      onChange={(e) => setNotifInput({...notifInput, [activeLangTab]: {...notifInput[activeLangTab], message: e.target.value}})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none min-h-[100px] text-sm"
                      placeholder="විස්තරය මෙහි ටයිප් කරන්න..."
                    ></textarea>
                  </div>
                  <button onClick={handleAddNotification} className="w-full sm:w-auto px-6 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition flex items-center justify-center gap-2">
                    <Plus size={18}/> ලැයිස්තුවට එක් කරන්න
                  </button>
                </div>

                <hr className="my-6 border-gray-200" />

                <h2 className="text-lg font-bold text-gray-800 mb-4">දැනට ඇති පණිවිඩ ලැයිස්තුව</h2>
                <div className="space-y-3">
                   {notifications.map(n => (
                     <div key={n.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-start bg-gray-50 gap-4">
                       <div className="flex-1">
                         <h3 className="font-bold text-[#14348c] break-words">
                            {typeof n.title === 'object' ? n.title.si : n.title}
                         </h3>
                         <p className="text-sm text-gray-600 mt-1 break-words">
                            {typeof n.message === 'object' ? n.message.si : n.message}
                         </p>
                         <span className="text-xs text-gray-400 mt-2 block font-medium">{n.date}</span>
                       </div>
                       <button onClick={() => handleRemoveNotification(n.id)} className="text-red-500 hover:text-red-700 bg-red-100 p-2 rounded-lg transition-colors shrink-0"><Trash2 size={18}/></button>
                     </div>
                   ))}
                   {notifications.length === 0 && <p className="text-sm text-gray-500 italic">පණිවිඩ කිසිවක් නැත.</p>}
                </div>
              </div>
            </div>
          )}

          {/* --- APP SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6 md:space-y-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 hidden lg:block">App Settings</h1>
                <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2">
                  <Save size={18}/> {isSavingSettings ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>

              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ArrayManager title="භාණ්ඩ මිනුම් ඒකක (Units)" placeholder="උදා: kg, ml, පීරිසි..." array={units} setArray={setUnits} input={unitInput} setInput={setUnitInput} />
                  <ArrayManager title="වියදම් වර්ග (Expense Categories)" placeholder="උදා: ඉන්ධන..." array={expenseCategories} setArray={setExpenseCategories} input={expenseInput} setInput={setExpenseInput} />
                  <ArrayManager title="ආදායම් වර්ග (Income Categories)" placeholder="උදා: ටිප් එකක්..." array={incomeCategories} setArray={setIncomeCategories} input={incomeInput} setInput={setIncomeInput} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- Action Modal (Edit Name / Edit Validity / Reset Password) --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              {modalConfig.type === 'validity' && <Calendar className="text-blue-600"/>}
              {modalConfig.type === 'password' && <KeyRound className="text-orange-600"/>}
              {modalConfig.type === 'name' && <Edit className="text-teal-600"/>}
              
              {modalConfig.type === 'validity' && 'කාලය වෙනස් කිරීම'}
              {modalConfig.type === 'password' && 'මුරපදය රීසෙට් කිරීම'}
              {modalConfig.type === 'name' && 'නම වෙනස් කිරීම'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              <strong>{modalConfig.driver?.username}</strong> ගේ {modalConfig.type === 'validity' ? 'වලංගු දිනය' : modalConfig.type === 'password' ? 'නව මුරපදය' : 'නව නම'} ඇතුලත් කරන්න.
            </p>

            {modalConfig.type === 'name' ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
                <input type="text" placeholder="මුල් නම" value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none" />
                <input type="text" placeholder="අවසන් නම" value={modalInput2} onChange={(e) => setModalInput2(e.target.value)} className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none" />
              </div>
            ) : (
              <input type={modalConfig.type === 'validity' ? 'date' : 'text'} value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none mb-6" />
            )}

            <div className="flex gap-3">
              <button onClick={() => setModalConfig({ isOpen: false, type: '', driver: null })} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">අවලංගු කරන්න</button>
              <button onClick={handleModalSubmit} disabled={modalLoading} className="flex-1 py-2.5 bg-[#14348c] text-white font-bold rounded-xl hover:bg-blue-800 transition">{modalLoading ? 'Updating...' : 'සේව් කරන්න'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}