import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in (on page refresh)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        try {
            const response = await api.get('/auth/me');
            const nextUser = response.data.data;
            localStorage.setItem('user', JSON.stringify(nextUser));
            setUser(nextUser);
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                logout();
            }
        }
    };

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;
        const safeRefresh = async () => {
            if (!cancelled) {
                await refreshUser();
            }
        };

        safeRefresh();

        const interval = setInterval(safeRefresh, 30000);
        const onFocus = () => {
            safeRefresh();
        };

        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
