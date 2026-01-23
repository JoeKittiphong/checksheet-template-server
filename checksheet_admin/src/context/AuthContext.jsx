import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '';
            const response = await axios.get(`${apiBase}/auth/me`, { withCredentials: true });
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (code, password) => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '';
            const response = await axios.post(`${apiBase}/auth/login`,
                { code, password },
                { withCredentials: true }
            );
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const logout = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '';
            await axios.post(`${apiBase}/auth/logout`, {}, { withCredentials: true });
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};
