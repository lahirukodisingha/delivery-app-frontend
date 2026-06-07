import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Settings, LogOut, LayoutDashboard, UserPlus, Calendar, KeyRound, CheckCircle2, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); 

  // --- Add User States ---
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);
  const [addError, setAddError] = useState(null);

  // --- Driver List States ---
  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  // --- Modal States (For Edit & Reset Password) ---
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', driver: null });
  const [modalInput, setModalInput] = useState('');
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

  // 1. යූසර්ලා ලැයිස්තුව ලබා ගැනීම
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

  useEffect(() => {
    if (activeTab === 'users') {
      fetchDrivers();
    }
  }, [activeTab]);

  // 2. අලුත් ඩ්‍රයිවර් කෙනෙක් ඇඩ් කිරීම
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAdding(true); setAddMessage(null); setAddError(null);

    try {
      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/register-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setAddMessage(`සාර්ථකයි! ${data.username} ගේ ගිණුම ${data.valid_until} දක්වා වලංගුයි.`);
        setNewUsername(''); setNewPassword('');
        fetchDrivers(); // ලිස්ට් එක අලුත් කිරීම
      } else {
        setAddError(data.error || 'ලියාපදිංචි කිරීම අසාර්ථකයි.');
      }
    } catch (err) {
      setAddError('සර්වර් එක හා සම්බන්ධ වීමේ දෝෂයක්.');
    }
    setIsAdding(false);
  };

  // 3. Modals සඳහා Action (Submit) කිරීම
  const handleModalSubmit = async () => {
    setModalLoading(true);
    const { type, driver } = modalConfig;
    
    try {
      let url = '';
      let bodyData = {};

      if (type === 'validity') {
        url = `https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}/validity`;
        bodyData = { valid_until: modalInput };
      } else if (type === 'password') {
        url = `https://delivery-app-backend-coral.vercel.app/api/admin/drivers/${driver._id}/reset-password`;
        bodyData = { new_password: modalInput };
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
        setModalInput('');
        fetchDrivers(); // දත්ත යාවත්කාලීන කිරීම
      } else {
        alert(data.error || 'දෝෂයක් මතු විය!');
      }
    } catch (err) {
      alert("සර්වර් දෝෂයකි.");
    }
    setModalLoading(false);
  };

  const openModal = (type, driver) => {
    setModalConfig({ isOpen: true, type, driver });
    setModalInput(type === 'validity' ? driver.account_valid_until : '');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#14348c] text-white p-6 flex flex-col shadow-xl z-10">
        <h1 className="text-2xl font-bold mb-8 tracking-wide">Admin Panel</h1>
        <nav className="flex-1 space-y-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Summary</h1>
            <p className="text-gray-600">මෙතනට අපි ඉදිරියේදී මුළු සාරාංශයම ගේමු.</p>
          </div>
        )}

        {/* User Management Section */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* 1. Add New User Card */}
              <div className="w-full lg:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-[#14348c] mb-6 flex items-center gap-2">
                  <UserPlus size={20} /> නව රියදුරු ගිණුමක් සෑදීම
                </h2>

                {addMessage && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium">{addMessage}</div>}
                {addError && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">{addError}</div>}

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-sm">Username</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="උදා: kamal" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 text-sm">Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 text-sm" placeholder="අවම අකුරු 6ක්..." required />
                  </div>
                  <button type="submit" disabled={isAdding} className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-md text-sm ${isAdding ? 'bg-blue-400' : 'bg-[#14348c] hover:bg-blue-800 hover:shadow-lg'}`}>
                    {isAdding ? 'සාදමින් පවතී...' : 'නව ගිණුම සාදන්න'}
                  </button>
                </form>
              </div>

              {/* 2. Existing Users List */}
              <div className="w-full lg:w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-[#14348c] mb-6 flex items-center gap-2">
                  <Users size={20} /> දැනට සිටින රියදුරන්
                </h2>

                {isLoadingDrivers ? (
                  <p className="text-gray-500 text-sm">ලෝඩ් වෙමින් පවතී...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                          <th className="py-3 px-4 rounded-l-xl">Username</th>
                          <th className="py-3 px-4">Status / Validity</th>
                          <th className="py-3 px-4">Last Login</th>
                          <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {drivers.map(driver => (
                          <tr key={driver._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-gray-800">{driver.username}</td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1">
                                {driver.is_active ? 
                                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Active</span> : 
                                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold w-max">Expired</span>
                                }
                                <span className="text-xs text-gray-500 font-medium">{driver.account_valid_until} තෙක්</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-500 flex items-center gap-1 mt-2"><Clock size={14}/> {driver.last_login_date}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => openModal('validity', driver)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition" title="Edit Validity">
                                  <Calendar size={16} />
                                </button>
                                <button onClick={() => openModal('password', driver)} className="p-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition" title="Reset Password">
                                  <KeyRound size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {drivers.length === 0 && (
                          <tr><td colSpan="4" className="py-6 text-center text-gray-500">රියදුරන් කිසිවෙකු නොමැත.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* --- Action Modal --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              {modalConfig.type === 'validity' ? <Calendar className="text-blue-600"/> : <KeyRound className="text-orange-600"/>}
              {modalConfig.type === 'validity' ? 'කාලය වෙනස් කිරීම' : 'මුරපදය රීසෙට් කිරීම'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              <strong>{modalConfig.driver.username}</strong> ගේ {modalConfig.type === 'validity' ? 'වලංගු දිනය (YYYY-MM-DD)' : 'නව මුරපදය'} ඇතුලත් කරන්න.
            </p>

            <input 
              type={modalConfig.type === 'validity' ? 'date' : 'text'}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfig({ isOpen: false, type: '', driver: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                අවලංගු කරන්න
              </button>
              <button 
                onClick={handleModalSubmit}
                disabled={modalLoading}
                className="flex-1 py-2.5 bg-[#14348c] text-white font-bold rounded-xl hover:bg-blue-800"
              >
                {modalLoading ? 'Updating...' : 'සේව් කරන්න'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}