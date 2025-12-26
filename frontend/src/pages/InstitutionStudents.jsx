import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import InstitutionNavbar from '../components/InstitutionNavbar';

const InstitutionStudents = () => {
    // Data State
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({ session: '', department: '' });

    // Enroll Form State
    const [enrollData, setEnrollData] = useState({
        nid: '',
        localStudentId: '',
        department: 'CSE',
        session: '2024'
    });

    // Fetch Students
    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Build query string based on filters
            const params = new URLSearchParams();
            if (filters.session) params.append('session', filters.session);
            if (filters.department) params.append('department', filters.department);

            const { data } = await api.get(`/institution/students?${params.toString()}`);
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [filters]); // Re-run when filters change

    // Handle Enrollment
    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            await api.post('/institution/enroll', enrollData);
            toast.success('Student Enrolled Successfully!');
            // Reset form and refresh list
            setEnrollData({ ...enrollData, nid: '', localStudentId: '' });
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Enrollment Failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <InstitutionNavbar /> {/* <--- Add this at the top */}
            <div className="p-8">
                {/* ... rest of your page content ... */}
                <div className="min-h-screen bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header with Back Button */}
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-800">Student Registry & Enrollment</h1>
                            <Link to="/institution-dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* LEFT: Enrollment Form */}
                            <div className="bg-white p-6 rounded-lg shadow h-fit">
                                <h2 className="text-lg font-bold mb-4 border-b pb-2">Enroll Existing Student</h2>
                                <form onSubmit={handleEnroll}>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600 mb-1">Student NID (National ID)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            placeholder="e.g. 123456789"
                                            value={enrollData.nid}
                                            onChange={(e) => setEnrollData({ ...enrollData, nid: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600 mb-1">Local Student ID (Your Uni ID)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            placeholder="e.g. 2024-1-60-010"
                                            value={enrollData.localStudentId}
                                            onChange={(e) => setEnrollData({ ...enrollData, localStudentId: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Department</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={enrollData.department}
                                                onChange={(e) => setEnrollData({ ...enrollData, department: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Session</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={enrollData.session}
                                                onChange={(e) => setEnrollData({ ...enrollData, session: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition">
                                        Link Student
                                    </button>
                                </form>
                            </div>

                            {/* RIGHT: Student List & Filters */}
                            <div className="md:col-span-2">
                                {/* Filters */}
                                <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-4 items-center">
                                    <span className="font-bold text-gray-600 text-sm">Filter By:</span>
                                    <input
                                        type="text"
                                        placeholder="Year (e.g. 2024)"
                                        className="border p-2 rounded text-sm"
                                        onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Dept (e.g. CSE)"
                                        className="border p-2 rounded text-sm"
                                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                    />
                                </div>

                                {/* Table */}
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                                            <tr>
                                                <th className="p-3">Photo</th>
                                                <th className="p-3">Full Name</th>
                                                <th className="p-3">Local ID</th>
                                                <th className="p-3">Dept / Session</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
                                            ) : students.length === 0 ? (
                                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No students found for this filter.</td></tr>
                                            ) : (
                                                students.map((student, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="p-3">
                                                            {student.photo_url ? (
                                                                <img src={`http://localhost:5000${student.photo_url}`} className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (<span>👤</span>)}
                                                        </td>
                                                        <td className="p-3 font-medium">{student.full_name}</td>
                                                        <td className="p-3 font-mono text-blue-600">{student.local_student_id}</td>
                                                        <td className="p-3 text-sm text-gray-600">{student.department} ({student.session_year})</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default InstitutionStudents;

