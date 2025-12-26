import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('students'); // 'students', 'institutions', 'manage', 'profiles'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reviewNotes, setReviewNotes] = useState({});

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
            } else if (activeTab === 'profiles') {
                response = await api.get('/admin/profile-requests');
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

    const handleProfileDecision = async (requestId, action) => {
        try {
            await api.post(`/admin/profile-requests/${requestId}/decision`, {
                action,
                comment: reviewNotes[requestId] || ''
            });
            toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
            setReviewNotes((prev) => ({ ...prev, [requestId]: '' }));
            fetchData();
        } catch (error) {
            toast.error('Failed to update request');
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
                    <button 
                        onClick={() => setActiveTab('profiles')}
                        className={`pb-4 px-4 font-medium transition ${activeTab === 'profiles' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Profile Requests
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading data...</div>
                ) : activeTab === 'profiles' ? (
                    data.length === 0 ? (
                        <div className="bg-white p-8 rounded shadow text-center text-gray-500 italic">
                            No records found in this section.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {data.map((request) => (
                                <div key={request.request_id} className="bg-white rounded-lg shadow p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                                        <div>
                                            <p className="font-bold text-gray-800">{request.email}</p>
                                            <p className="text-xs text-gray-500">Requested: {request.requested_at}</p>
                                        </div>
                                        <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                                            Pending Review
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="border rounded-lg p-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">Before</h4>
                                            <div className="flex items-center gap-3 mb-3">
                                                {request.current_photo_url ? (
                                                    <img
                                                        src={`http://localhost:5000${request.current_photo_url}`}
                                                        alt="Current"
                                                        className="w-12 h-12 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                        dY
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold">{request.current_full_name}</p>
                                                    <p className="text-xs text-gray-500">{request.current_identity_type}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">DOB: {request.current_date_of_birth}</p>
                                            <p className="text-xs text-gray-500 mb-1 break-all">ID Hash: {request.current_identity_hash}</p>
                                            <p className="text-xs text-gray-500 mb-1">Phone: {request.current_phone || 'Not set'}</p>
                                            <p className="text-xs text-gray-500">Address: {request.current_address || 'Not set'}</p>
                                        </div>
                                        <div className="border rounded-lg p-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">After</h4>
                                            <div className="flex items-center gap-3 mb-3">
                                                {request.proposed_photo_url ? (
                                                    <img
                                                        src={`http://localhost:5000${request.proposed_photo_url}`}
                                                        alt="Proposed"
                                                        className="w-12 h-12 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                        dY
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold">{request.proposed_full_name || 'No change'}</p>
                                                    <p className="text-xs text-gray-500">{request.proposed_identity_type || 'No change'}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">DOB: {request.proposed_date_of_birth || 'No change'}</p>
                                            <p className="text-xs text-gray-500 mb-1 break-all">ID Hash: {request.proposed_identity_hash || 'No change'}</p>
                                            <p className="text-xs text-gray-500 mb-1">Phone: No change</p>
                                            <p className="text-xs text-gray-500">Address: No change</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 mb-2">Proof Document</p>
                                        {request.proof_document_path ? (
                                            request.proof_document_path.toLowerCase().endsWith('.pdf') ? (
                                                <a
                                                    href={`http://localhost:5000${request.proof_document_path}`}
                                                    className="text-blue-600 text-sm underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View proof document (PDF)
                                                </a>
                                            ) : (
                                                <img
                                                    src={`http://localhost:5000${request.proof_document_path}`}
                                                    alt="Proof"
                                                    className="max-h-48 border rounded"
                                                />
                                            )
                                        ) : (
                                            <p className="text-xs text-gray-400">No proof document provided.</p>
                                        )}
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <label className="text-xs text-gray-500">Admin Comment</label>
                                        <textarea
                                            className="w-full border rounded p-2 text-sm"
                                            rows="2"
                                            value={reviewNotes[request.request_id] || ''}
                                            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [request.request_id]: e.target.value }))}
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleProfileDecision(request.request_id, 'approve')}
                                                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleProfileDecision(request.request_id, 'reject')}
                                                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
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
