import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
});

// Automatically add the Token to every request if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;