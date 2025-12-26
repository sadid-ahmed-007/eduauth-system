import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('students'); // 'students', 'institutions', 'manage'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch data based on active tab
    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'students') {
                response = await api.get('/admin/pending?type=student');
            } else if (activeTab === 'institutions') {
                response = await api.get('/admin/pending?type=institution');
            } else if (activeTab === 'manage') {
                response = await api.get('/admin/institutions'); // Active unis
            }
            setData(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Actions
    const handleApprove = async (userId) => {
        try {
            await api.put(`/admin/approve/${userId}`);
            toast.success('Approved Successfully');
            fetchData(); // Refresh list
        } catch (error) {
            toast.error('Approval Failed');
        }
    };

    const handleTogglePermission = async (userId, currentStatus) => {
        try {
            await api.put(`/admin/permission/${userId}`, { canIssue: !currentStatus });
            toast.success(`Access ${!currentStatus ? 'Granted' : 'Revoked'}`);
            fetchData();
        } catch (error) {
            toast.error('Update Failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <h1 className="text-xl font-bold tracking-wide">National Registry Admin</h1>
                </div>
                <button onClick={logout} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded text-sm font-bold transition">
                    Logout
                </button>
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow container mx-auto p-8 max-w-6xl">
                
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-8">
                    <button 
                        onClick={() => setActiveTab('students')}
                        className={`pb-4 px-4 font-medium transition ${activeTab === 'students' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pending Students
                    </button>
                    <button 
                        onClick={() => setActiveTab('institutions')}
                        className={`pb-4 px-4 font-medium transition ${activeTab === 'institutions' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pending Institutions
                    </button>
                    <button 
                        onClick={() => setActiveTab('manage')}
                        className={`pb-4 px-4 font-medium transition ${activeTab === 'manage' ? 'border-b-4 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Access (Control)
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading data...</div>
                ) : data.length === 0 ? (
                    <div className="bg-white p-8 rounded shadow text-center text-gray-500 italic">
                        No records found in this section.
                    </div>
                ) : (
                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                                <tr>
                                    {activeTab === 'students' && (
                                        <>
                                            <th className="p-4">Photo</th>
                                            <th className="p-4">Name / NID</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4 text-right">Action</th>
                                        </>
                                    )}
                                    {activeTab === 'institutions' && (
                                        <>
                                            <th className="p-4">Institution Name</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Reg No</th>
                                            <th className="p-4 text-right">Action</th>
                                        </>
                                    )}
                                    {activeTab === 'manage' && (
                                        <>
                                            <th className="p-4">Institution Name</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Upload Permission</th>
                                            <th className="p-4 text-right">Control</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((item) => (
                                    <tr key={item.user_id} className="hover:bg-gray-50">
                                        
                                        {/* STUDENT ROW */}
                                        {activeTab === 'students' && (
                                            <>
                                                <td className="p-4">
                                                    {item.photo_url ? (
                                                        <img src={`http://localhost:5000${item.photo_url}`} alt="Student" className="w-10 h-10 rounded-full object-cover border" />
                                                    ) : (
                                                        <span className="text-xl">👤</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-800">{item.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">NID: {item.nid}</p>
                                                </td>
                                                <td className="p-4 text-gray-600">{item.email}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleApprove(item.user_id)} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                                                        Approve
                                                    </button>
                                                </td>
                                            </>
                                        )}

                                        {/* PENDING INSTITUTION ROW */}
                                        {activeTab === 'institutions' && (
                                            <>
                                                <td className="p-4 font-medium">{item.institution_name}</td>
                                                <td className="p-4 capitalize text-gray-500">{item.institution_type}</td>
                                                <td className="p-4 font-mono text-sm">{item.registration_number}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleApprove(item.user_id)} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                                                        Approve
                                                    </button>
                                                </td>
                                            </>
                                        )}

                                        {/* MANAGE ACTIVE INSTITUTION ROW */}
                                        {activeTab === 'manage' && (
                                            <>
                                                <td className="p-4 font-medium">{item.institution_name}</td>
                                                <td className="p-4 capitalize text-gray-500">{item.institution_type}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.can_issue_certificates ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {item.can_issue_certificates ? 'ALLOWED' : 'BLOCKED'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleTogglePermission(item.user_id, item.can_issue_certificates)}
                                                        className={`px-4 py-1 rounded text-sm font-bold border ${item.can_issue_certificates ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                    >
                                                        {item.can_issue_certificates ? 'Stop Access' : 'Enable Access'}
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;