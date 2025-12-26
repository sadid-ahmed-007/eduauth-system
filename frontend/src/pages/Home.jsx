import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [hash, setHash] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (hash.trim()) {
            navigate(`/verify/${hash}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center text-white p-6">
            <div className="max-w-2xl text-center">
                <h1 className="text-5xl font-bold mb-6">EduAuth Registry</h1>
                <p className="text-xl mb-10 text-blue-100">
                    The National Blockchain-Powered Credential Verification System.
                    Secure. Immutable. Instant.
                </p>

                {/* Verification Search Bar */}
                <div className="bg-white p-2 rounded-full shadow-2xl flex">
                    <input 
                        type="text" 
                        placeholder="Paste Certificate Hash / ID here..."
                        className="flex-grow p-4 rounded-l-full text-gray-800 outline-none"
                        value={hash}
                        onChange={(e) => setHash(e.target.value)}
                    />
                    <button 
                        onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-full transition"
                    >
                        Verify Now
                    </button>
                </div>

                <div className="mt-12 flex justify-center gap-6">
                    <a href="/login" className="text-blue-200 hover:text-white underline">
                        Login to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Home;