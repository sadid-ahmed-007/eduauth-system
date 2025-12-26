import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [contactForm, setContactForm] = useState({ phone: '', address: '' });
    const [requestForm, setRequestForm] = useState({
        fullName: '',
        dob: '',
        identityType: 'nid',
        identityNumber: ''
    });
    const [proofFile, setProofFile] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [savingContact, setSavingContact] = useState(false);

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

        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/students/me/profile');
                setProfile(data.profile);
                setPendingRequest(data.pendingRequest);
                setContactForm({
                    phone: data.profile?.phone || '',
                    address: data.profile?.address || ''
                });
                setRequestForm((prev) => ({
                    ...prev,
                    identityType: data.profile?.identity_type || 'nid'
                }));
            } catch (error) {
                toast.error('Failed to load profile');
            } finally {
                setProfileLoading(false);
            }
        };

        fetchCertificates();
        fetchProfile();
    }, []);

    const handleDownload = (hash) => {
        const url = `${window.location.origin}/verify/${hash}?download=1`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setSavingContact(true);
        try {
            await api.patch('/students/me/contact', {
                phone: contactForm.phone,
                address: contactForm.address
            });
            toast.success('Contact details updated');
            setProfile((prev) => prev ? { ...prev, phone: contactForm.phone, address: contactForm.address } : prev);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update contact details');
        } finally {
            setSavingContact(false);
        }
    };

    const handleProfileRequestSubmit = async (e) => {
        e.preventDefault();
        if (!profile) {
            return;
        }

        if (pendingRequest) {
            toast.error('You already have a pending request.');
            return;
        }

        const formData = new FormData();
        let hasChanges = false;

        const fullName = requestForm.fullName.trim();
        if (fullName && fullName !== profile.full_name) {
            formData.append('fullName', fullName);
            hasChanges = true;
        }

        if (requestForm.dob && requestForm.dob !== profile.date_of_birth) {
            formData.append('dob', requestForm.dob);
            hasChanges = true;
        }

        const identityTypeChanged = requestForm.identityType && requestForm.identityType !== profile.identity_type;
        const identityNumberValue = requestForm.identityNumber.trim();
        const identityTypeToSend = (identityTypeChanged || identityNumberValue)
            ? (requestForm.identityType || profile.identity_type)
            : null;

        if (identityTypeToSend) {
            formData.append('identityType', identityTypeToSend);
            if (identityTypeChanged) {
                hasChanges = true;
            }
        }

        if (identityNumberValue) {
            formData.append('identityNumber', identityNumberValue);
            hasChanges = true;
        }

        if (photoFile) {
            formData.append('photo', photoFile);
            hasChanges = true;
        }

        if (identityTypeChanged && !requestForm.identityNumber.trim()) {
            toast.error('Identity number is required when changing identity type.');
            return;
        }

        const requiresProof = Boolean(
            fullName ||
            requestForm.dob ||
            identityNumberValue ||
            identityTypeChanged
        );

        if (requiresProof && !proofFile) {
            toast.error('Proof document is required for name, DOB, or ID changes.');
            return;
        }

        if (proofFile) {
            formData.append('proofDocument', proofFile);
        }

        if (!hasChanges) {
            toast.error('No changes to submit.');
            return;
        }

        setSubmittingRequest(true);
        try {
            await api.post('/students/me/profile-request', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Profile update request submitted');
            setRequestForm({
                fullName: '',
                dob: '',
                identityType: profile.identity_type || 'nid',
                identityNumber: ''
            });
            setProofFile(null);
            setPhotoFile(null);
            const { data } = await api.get('/students/me/profile');
            setProfile(data.profile);
            setPendingRequest(data.pendingRequest);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(false);
        }
    };

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
                <h2 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h2>

                {profileLoading ? (
                    <div className="bg-white rounded shadow p-6 mb-8">
                        <p className="text-gray-500">Loading profile...</p>
                    </div>
                ) : profile ? (
                    <>
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center gap-4">
                                    {profile.photo_url ? (
                                        <img
                                            src={`http://localhost:5000${profile.photo_url}`}
                                            alt="Student"
                                            className="w-20 h-20 rounded-full object-cover border"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                                            dY
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{profile.full_name}</h3>
                                        <p className="text-sm text-gray-500">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                    <p><span className="font-semibold">Date of Birth:</span> {profile.date_of_birth}</p>
                                    <p><span className="font-semibold">Identity Type:</span> {profile.identity_type}</p>
                                    <p className="break-all"><span className="font-semibold">Identity Hash:</span> {profile.identity_number_hash}</p>
                                    <p><span className="font-semibold">Phone:</span> {profile.phone || 'Not set'}</p>
                                    <p><span className="font-semibold">Address:</span> {profile.address || 'Not set'}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-bold mb-4">Update Contact (No Approval)</h3>
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Address</label>
                                        <textarea
                                            className="w-full p-2 border rounded"
                                            rows="3"
                                            value={contactForm.address}
                                            onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        disabled={savingContact}
                                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
                                    >
                                        {savingContact ? 'Saving...' : 'Save Contact Info'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow mb-10">
                            <h3 className="text-lg font-bold mb-2">Profile Change Request (Admin Approval)</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Full Name, Date of Birth, Identity Number, and Photo changes require admin approval.
                            </p>

                            {pendingRequest && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded mb-4">
                                    You already have a pending request submitted on {pendingRequest.requested_at}.
                                    Please wait for admin review before submitting another.
                                </div>
                            )}

                            <form onSubmit={handleProfileRequestSubmit} className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Full Name (New)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={requestForm.fullName}
                                        onChange={(e) => setRequestForm({ ...requestForm, fullName: e.target.value })}
                                        disabled={Boolean(pendingRequest)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Date of Birth (New)</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded"
                                        value={requestForm.dob}
                                        onChange={(e) => setRequestForm({ ...requestForm, dob: e.target.value })}
                                        disabled={Boolean(pendingRequest)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Identity Type</label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={requestForm.identityType}
                                        onChange={(e) => setRequestForm({ ...requestForm, identityType: e.target.value })}
                                        disabled={Boolean(pendingRequest)}
                                    >
                                        <option value="nid">NID</option>
                                        <option value="birth_certificate">Birth Certificate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Identity Number (New)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={requestForm.identityNumber}
                                        onChange={(e) => setRequestForm({ ...requestForm, identityNumber: e.target.value })}
                                        disabled={Boolean(pendingRequest)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">New Photo (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setPhotoFile(e.target.files[0])}
                                        disabled={Boolean(pendingRequest)}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Proof Document (Required for name/DOB/ID)</label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setProofFile(e.target.files[0])}
                                        disabled={Boolean(pendingRequest)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                        disabled={Boolean(pendingRequest) || submittingRequest}
                                        className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition disabled:bg-gray-400"
                                    >
                                        {submittingRequest ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : null}

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
                                    <button
                                        onClick={() => handleDownload(cert.certificate_hash)}
                                        className="mt-3 w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 transition"
                                    >
                                        Download PDF
                                    </button>
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
