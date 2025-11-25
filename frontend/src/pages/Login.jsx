import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { baseUrl } from "../components/api/myAPI";
import { Eye, EyeOff, Home, ChevronRight } from "lucide-react";
import PageMeta from "../components/PageMeta";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <PageMeta
        title="Login"
        description="Kelola informasi profil dan pengaturan akun Anda"
      />
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
      <div className="flex flex-col w-full lg:w-1/2 bg-white shadow-lg relative">
        {/* Breadcrumb */}
        <nav className="px-8 py-4 border-b border-gray-200 bg-gray-50" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                to="/"
                className="flex items-center text-gray-500 hover:text-gray-800 transition-colors duration-200"
                aria-label="Kembali ke beranda"
              >
                <Home className="w-4 h-4 mr-1" />
                <span>Beranda</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-800 font-medium" aria-current="page">
                Masuk
              </span>
            </li>
          </ol>
        </nav>

        {/* Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-8">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
              Selamat Datang 👋
            </h2>
            <p className="text-center text-gray-500 mb-6 text-sm">
              Masuk ke akun Anda untuk melanjutkan
            </p>

            <form onSubmit={handleLogin} noValidate>
              {error && (
                <div
                  className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md mb-4 text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-500 outline-none transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  autoComplete="email"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-500 outline-none transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gray-800 text-gray-100 py-2.5 rounded-md font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-busy={loading}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun? Silahkan Hubungi Admin
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-gray-400 text-xs border-t border-gray-200">
          © {new Date().getFullYear()} Sistem Bimbingan Online. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Login;