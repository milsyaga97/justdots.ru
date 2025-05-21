import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../context/Notifications';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [myuser, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const notive = useNotification();

    async function fetchMe() {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/auth/me');
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (e) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }



    async function autoProfileUpdater() {
        if (!myuser) return;

        try {
            const { username, first_name, last_name, patronymic, email } = myuser;
            const profileData = {
                username,
                first_name,
                last_name,
                patronymic,
                email,
                bio: "Тут пусто",
                skills: [{name: "Пустой навык"}],
                portfolio: [{title: "Пустой элемент портфолио", description: "Пустое описание", url: "test.ru"}]
            };

            await api.put('/users/profile/update', profileData);
        } catch (error) {
            console.log('Ошибка при обновлении профиля:', error);
        }
    }

    useEffect(() => {
        fetchMe();
    }, []);

    useEffect(() => {
        if (myuser && !myuser.profile) {
            autoProfileUpdater();
        }
    }, [myuser]);

    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { username, password });
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            await fetchMe();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (username, first_name, last_name, patronymic, email, password, password_confirm, user_type) => {
        try {
            setLoading(true);
            await api.post('/auth/register', {
                username,
                first_name,
                last_name,
                patronymic,
                email,
                password,
                password_confirm,
                user_type
            });
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            notive({
                message: "Вы вышли из аккаунта",
                type: "info",
                duration: 4000
            });
        } catch (error) {
            console.error('Logout failed:', error);
            notive({
                message: "Ошибка при выходе из аккаунта",
                type: "error",
                duration: 4000
            });
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            myuser,
            login,
            register,
            logout,
            loading,
            setLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};