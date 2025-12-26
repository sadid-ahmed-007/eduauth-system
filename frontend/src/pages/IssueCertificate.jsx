import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import InstitutionNavbar from '../components/InstitutionNavbar';

const IssueCertificate = () => {
    const [formData, setFormData] = useState({
        localStudentId: '',
        credentialName: '',
        type: 'degree',
        issueDate: '',
        fieldOfStudy: '',
        gradeGpa: '',
        metadata: {
            creditHours: '',
            convocationDate: ''
        }
    });

    const handleMetadataChange = (field, value) => {
        setFormData({
            ...formData,
            metadata: { ...formData.metadata, [field]: value }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                metadata: {
                    ...formData.metadata,
                    major: formData.fieldOfStudy,
                    cgpa: formData.gradeGpa
                }
            };
            const { data } = await api.post('/certificates/issue', payload);
            toast.success(`Certificate Issued! Hash: ${data.certificateHash.substring(0, 8)}...`);
            setFormData({
                localStudentId: '',
                credentialName: '',
                type: 'degree',
                issueDate: '',
                fieldOfStudy: '',
                gradeGpa: '',
                metadata: {
                    creditHours: '',
                    convocationDate: ''
                }
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <InstitutionNavbar />

            <div className="max-w-4xl mx-auto mt-10 px-4">
                <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-blue-600">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Issue Professional Credential</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Section 1: Core Identification */}
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <h3 className="text-blue-800 font-bold mb-3 border-b border-blue-200 pb-1">1. Recipient</h3>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Local Student ID</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. CSE-2024-001"
                                    value={formData.localStudentId}
                                    onChange={(e) => setFormData({ ...formData, localStudentId: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">* Must be enrolled in your Student Registry first.</p>
                            </div>
                        </div>

                        {/* Section 2: Credential Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Degree / Credential Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g. Bachelor of Science in CSE"
                                    value={formData.credentialName}
                                    onChange={(e) => setFormData({ ...formData, credentialName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Credential Type</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="degree">Degree (Bachelor/Master)</option>
                                    <option value="diploma">Diploma</option>
                                    <option value="transcript">Academic Transcript</option>
                                    <option value="certificate">Professional Certificate</option>
                                </select>
                            </div>
                        </div>

                        {/* Section 3: Academic Metadata */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <h3 className="text-gray-800 font-bold mb-3 border-b border-gray-300 pb-1">2. Academic Performance</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Major / Program</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="Computer Science"
                                        value={formData.fieldOfStudy}
                                        onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">CGPA / Grade</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="3.85"
                                        value={formData.gradeGpa}
                                        onChange={(e) => setFormData({ ...formData, gradeGpa: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Credit Hours</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="140"
                                        value={formData.metadata.creditHours}
                                        onChange={(e) => handleMetadataChange('creditHours', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Dates */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded"
                                    value={formData.issueDate}
                                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Convocation Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded"
                                    value={formData.metadata.convocationDate}
                                    onChange={(e) => handleMetadataChange('convocationDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-lg transition transform hover:-translate-y-1">
                            Issue & Sign Certificate
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IssueCertificate;
