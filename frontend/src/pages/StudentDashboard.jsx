import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const { data } = await api.get('/students/me/certificates');
                setCertificates(data.certificates);
            } catch (error) {
                toast.error('Failed to load certificates');
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">EduAuth Wallet</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.email}</span>
                    <button 
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">My Credentials</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded shadow">
                        <p className="text-gray-500">No certificates found yet.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => {
                            const verifyUrl = `${window.location.origin}/verify/${cert.certificate_hash}`;
                            return (
                            <div key={cert.certificate_hash} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-lg transition">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                        {cert.certificate_type.toUpperCase()}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${cert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {cert.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{cert.credential_name}</h3>
                                <p className="text-gray-500 text-sm mb-4">{cert.institution_name}</p>
                                
                                {/* Footer Section of Card */}
                                <div className="border-t pt-4 text-sm text-gray-600">
                                    <p className="flex justify-between mb-2">
                                        <span>Issued:</span>
                                        <span className="font-medium">{cert.issue_date}</span>
                                    </p>
                                    
                                    {/* Hash Display & Copy Button */}
                                    <div className="bg-gray-100 p-2 rounded flex justify-between items-center group">
                                        <p className="text-xs text-gray-500 font-mono truncate w-32">
                                            {cert.certificate_hash}
                                        </p>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(cert.certificate_hash);
                                                toast.success('Hash copied to clipboard!');
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 bg-white border rounded shadow-sm opacity-60 group-hover:opacity-100 transition"
                                            title="Copy full hash"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="mt-4 flex flex-col items-center gap-2">
                                        <p className="text-xs text-gray-400">Scan to Verify</p>
                                        <div className="bg-white p-2 rounded border">
                                            <QRCode value={verifyUrl} size={96} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
