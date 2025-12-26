import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        nid: '',
        dob: '',
        institutionName: '',
        regNumber: '',
        institutionType: 'university'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (role === 'student' && !file) {
            toast.error('Profile photo is required for students.');
            setLoading(false);
            return;
        }

        // 1. Create FormData object (Required for sending files)
        const data = new FormData();
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('role', role);

        if (role === 'student') {
            data.append('fullName', formData.fullName);
            data.append('nid', formData.nid);
            data.append('dob', formData.dob);
            if (file) {
                // 'photo' must match the backend upload.single('photo')
                data.append('photo', file); 
            }
        } else {
            data.append('institutionName', formData.institutionName);
            data.append('regNumber', formData.regNumber);
            data.append('institutionType', formData.institutionType);
        }

        // 2. Send Request
        try {
            // Axios automatically sets the correct Content-Type for FormData
            await api.post('/auth/register', data);
            
            toast.success('Registration Successful! Please Login.');
            navigate('/login');

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Create Account</h2>
                
                {/* Role Switcher */}
                <div className="flex bg-gray-200 rounded p-1 mb-6">
                    <button 
                        className={`flex-1 py-2 rounded text-sm font-bold transition ${role === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setRole('student')}
                        type="button"
                    >
                        Student
                    </button>
                    <button 
                        className={`flex-1 py-2 rounded text-sm font-bold transition ${role === 'institution' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setRole('institution')}
                        type="button"
                    >
                        Institution
                    </button>
                </div>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    {/* Common Fields */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input type="email" name="email" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input type="password" name="password" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>

                    {/* Student Specific Fields */}
                    {role === 'student' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                <input type="text" name="fullName" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">NID / Birth Cert No.</label>
                                <input type="text" name="nid" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
                                <input type="date" name="dob" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            
                            {/* PHOTO UPLOAD INPUT */}
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Profile Photo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange} 
                                        className="w-full" 
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Recommended: Square passport size image</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Institution Specific Fields */}
                    {role === 'institution' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Institution Name</label>
                                <input type="text" name="institutionName" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Registration / EIIN Number</label>
                                <input type="text" name="regNumber" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Institution Type</label>
                                <select name="institutionType" onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="university">University</option>
                                    <option value="polytechnic">Polytechnic</option>
                                    <option value="training_center">Training Center</option>
                                    <option value="board">Education Board</option>
                                </select>
                            </div>
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded mb-4 border border-yellow-200">
                                ⚠ Note: Institution accounts require admin approval before you can log in.
                            </div>
                        </>
                    )}

                    <button 
                        disabled={loading}
                        className={`w-full text-white p-3 rounded font-bold transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-600 hover:underline text-sm">
                        Already have an account? Login here.
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
