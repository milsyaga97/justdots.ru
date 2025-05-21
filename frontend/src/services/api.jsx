import axios from 'axios';
import { SERVER_URL } from '../pathconfig';

const api = axios.create({
    baseURL: SERVER_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
