import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router';
import axios from 'axios';
import { baseUrl } from '../components/api/myAPI';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false)


    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${baseUrl}auth/login`, {
                email,
                password
            }, {
                withCredentials: true
            });
            setUser(response.data.data);
            console.log(response)

            const role = response.data.data.role;
            if (role === 'admin') {
                navigate('/admin/dashboard')
            } else if (role === 'dosen') {
                navigate('/dosen/dashboard')
            } else if (role === 'mahasiswa') {
                navigate('/mahasiswa/dashboard')
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Canno Login')
        }
    }
    return (
        <div>
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="bg-white p-6 rounded shadow-md w-80">
                    <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

                    <form onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-3 text-sm">
                                {error}
                            </div>
                        )}

                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-300 rounded mb-3 focus:outline-none focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Masuk...
                                </div>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
