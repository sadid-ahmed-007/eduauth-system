import { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // <--- Make sure Link is imported!
import { toast } from 'react-toastify';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            
            login(data.data.token, {
                id: data.data.user_id,
                email: data.data.email,
                role: data.data.role
            });

            toast.success('Login Successful!');
            
            if (data.data.role === 'institution') {
                navigate('/institution-dashboard');
            } else if (data.data.role === 'student') {
                navigate('/student-dashboard');
            } else if (data.data.role === 'admin') {
                navigate('/admin-dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">EduAuth Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-bold">
                        Sign In
                    </button>
                </form>

                {/* Register Link Section */}
                <div className="mt-4 text-center border-t pt-4">
                    <p className="text-sm text-gray-600">Don't have an account?</p>
                    <Link to="/register" className="text-blue-600 hover:underline text-sm font-bold">
                        Register Here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;