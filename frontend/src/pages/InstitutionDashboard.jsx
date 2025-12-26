import { useEffect, useState, useContext } from 'react';
import InstitutionNavbar from '../components/InstitutionNavbar';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const InstitutionDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ students: 0, certificates: 0 });

    useEffect(() => {
        // Optional: You can fetch real stats here if you want
        // For now, we will just show the welcome screen
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <InstitutionNavbar />

            <div className="max-w-7xl mx-auto py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, {user?.institution_name}</h1>
                    <p className="text-xl text-gray-500">Manage your academic registry securely.</p>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    
                    {/* Card 1: Student Registry */}
                    <Link to="/institution-students" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-t-4 border-blue-500 group">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">🎓 Student Registry</h2>
                            <span className="text-4xl">📋</span>
                        </div>
                        <p className="text-gray-600">
                            Enroll new students, view class lists, and manage student identities linked to your institution.
                        </p>
                        <div className="mt-6 text-blue-600 font-bold group-hover:underline">Manage Students →</div>
                    </Link>

                    {/* Card 2: Issue Certificates */}
                    <Link to="/issue-certificate" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-t-4 border-green-500 group">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 group-hover:text-green-600">📜 Issue Credentials</h2>
                            <span className="text-4xl">✍️</span>
                        </div>
                        <p className="text-gray-600">
                            Issue blockchain-verified certificates to your <strong>enrolled</strong> students securely.
                        </p>
                        <div className="mt-6 text-green-600 font-bold group-hover:underline">Issue Now →</div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default InstitutionDashboard;