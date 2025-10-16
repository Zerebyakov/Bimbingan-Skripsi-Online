import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import axios from "axios";
import { baseUrl } from "../components/api/myAPI";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${baseUrl}auth/login`,
        { email, password },
        { withCredentials: true }
      );

      setUser(response.data.data);
      const role = response.data.data.role;

      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "dosen") navigate("/dosen/dashboard");
      else if (role === "mahasiswa") navigate("/mahasiswa/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || "Gagal login, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 text-gray-800">
      {/* Left Section */}
      <div className="hidden lg:flex w-1/2 justify-center items-center bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-gray-200 shadow-xl">
        <div className="max-w-md text-center px-6">
          <h1 className="text-4xl font-bold mb-4">Sistem Bimbingan Online</h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Bantu mahasiswa dan dosen berkolaborasi memantau progres skripsi
            dengan mudah, efisien, dan fleksibel.
          </p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/942/942748.png"
            alt="Bimbingan illustration"
            className="w-64 mx-auto opacity-90"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white shadow-lg relative">
        <div className="w-full max-w-sm p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
            Selamat Datang 👋
          </h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Masuk ke akun Anda untuk melanjutkan
          </p>

          <form onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Masukkan email anda"
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-500 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Masukkan password"
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-800 text-gray-100 py-2.5 rounded-md font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin border-2 border-gray-100 border-t-transparent rounded-full w-4 h-4"></span>
                  <span>Memproses...</span>
                </div>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        <footer className="absolute bottom-4 text-gray-400 text-xs">
          © {new Date().getFullYear()} Sistem Bimbingan Online
        </footer>
      </div>
    </div>
  );
};

export default Login;
