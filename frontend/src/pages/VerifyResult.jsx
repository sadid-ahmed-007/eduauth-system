import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyResult = () => {
    const { hash } = useParams(); // Get hash from URL
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                // Call the Public API (No token needed)
                const response = await api.get(`/verify/${hash}`);
                setData(response.data.data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [hash]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            {/* Header */}
            <div className="mb-8 text-center">
                <Link to="/" className="text-blue-600 font-bold text-lg hover:underline">← Back to Home</Link>
            </div>

            {loading ? (
                <div className="text-xl text-gray-600 animate-pulse">Verifying on Blockchain...</div>
            ) : error ? (
                <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-lg border-t-8 border-red-500">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-2">Invalid Certificate</h2>
                    <p className="text-gray-500">
                        The certificate ID you entered does not exist or has been revoked.
                    </p>
                </div>
            ) : (
                <div className="bg-white p-10 rounded-xl shadow-2xl max-w-2xl w-full border-t-8 border-green-500 relative overflow-hidden">
                    {/* Background Watermark */}
                    <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                        <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                        </svg>
                    </div>

                    <div className="text-center mb-8">
                        <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold mb-6">
                            ✓ OFFICIALLY VERIFIED
                        </div>

                        {/* --- PHOTO DISPLAY SECTION --- */}
                        {data.photo_url ? (
                            <img 
                                src={`http://localhost:5000${data.photo_url}`} 
                                alt="Student" 
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center text-4xl shadow-lg border-4 border-white text-gray-400">
                                🎓
                            </div>
                        )}
                        {/* ----------------------------- */}

                        <h1 className="text-3xl font-bold text-gray-800">{data.credential_name}</h1>
                        <p className="text-gray-500 mt-2">Awarded to</p>
                        <h2 className="text-2xl font-semibold text-blue-900">{data.student_name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-b border-gray-100 py-6">
                        <div>
                            <p className="text-gray-500 text-sm">Issued By</p>
                            <p className="font-medium text-gray-800">{data.issuer_name}</p>
                            <p className="text-xs text-gray-400 capitalize">({data.institution_type})</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Issue Date</p>
                            <p className="font-medium text-gray-800">{data.issue_date}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Credential Type</p>
                            <p className="font-medium text-gray-800 capitalize">{data.certificate_type}</p> 
                        </div>
                         <div className="text-right">
                            <p className="text-gray-500 text-sm">Status</p>
                            <p className="font-medium text-green-600 capitalize">{data.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Identity Type</p>
                            <p className="font-medium text-gray-800 capitalize">{data.identity_type || 'nid'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Identity Hash</p>
                            <p className="font-mono text-xs text-gray-700 break-all">{data.identity_hash}</p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                         <p className="text-xs text-gray-400">Digital Signature (SHA-256)</p>
                         <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                             {data.certificate_hash}
                         </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifyResult;
