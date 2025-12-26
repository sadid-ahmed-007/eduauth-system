import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import Home from './pages/Home';           // <--- New
import VerifyResult from './pages/VerifyResult'; // <--- New
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import InstitutionStudents from './pages/InstitutionStudents';
import IssueCertificate from './pages/IssueCertificate';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/verify/:hash" element={<VerifyResult />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            {/* Protected Routes (In a real app, we would wrap these in a <ProtectedRoute>) */}
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/institution-dashboard" element={<InstitutionDashboard />} />
            <Route path="/institution-students" element={<InstitutionStudents />} />
            <Route path="/issue-certificate" element={<IssueCertificate />} />
          </Routes>
          <ToastContainer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;