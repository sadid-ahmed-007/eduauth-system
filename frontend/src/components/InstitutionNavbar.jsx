import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const InstitutionNavbar = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/institution-dashboard" className="text-xl font-bold tracking-wider">
                            🏛️ {user?.institution_name || 'Institute Portal'}
                        </Link>
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/institution-dashboard" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                                Dashboard
                            </Link>
                            <Link to="/institution-students" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                                My Students (Enroll)
                            </Link>
                            <Link to="/issue-certificate" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                                Issue Certificate
                            </Link>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default InstitutionNavbar;