import React from 'react'
import { useAuth } from './context/AuthContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import Login from './pages/Login';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardDosen from './pages/dosen/DashboardDosen';
import DashboardMahasiswa from './pages/mahasiswa/DashboardMahasiswa';
import LandingPage from './pages/LandingPage';
import ListPengajuan from './pages/admin/ListPengajuan';
import ListDosen from './pages/admin/ListDosen';
import ListMahasiswa from './pages/admin/ListMahasiswa';
import KonfigurasiSistem from './pages/admin/KonfigurasiSistem';
import ProfileAdmin from './pages/admin/ProfileAdmin';
import ListMahasiswaBimbingan from './pages/dosen/ListMahasiswaBimbingan';
import ChatMahasiswa from './pages/dosen/ChatMahasiswa';

const App = () => {
  const { user, loading } = useAuth();

  const LoadingScreen = () => (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  const AdminRoute = ({ children }) => {
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/login" replace />;
    return children;
  };

  const DosenRoute = ({ children }) => {
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'dosen') return <Navigate to="/login" replace />;
    return children;
  };

  const MahasiswaRoute = ({ children }) => {
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'mahasiswa') return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route index path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <DashboardAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/judul"
          element={
            <AdminRoute>
              <ListPengajuan />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/konfigurasi"
          element={
            <AdminRoute>
              <KonfigurasiSistem />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dosen"
          element={
            <AdminRoute>
              <ListDosen />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/mahasiswa"
          element={
            <AdminRoute>
              <ListMahasiswa />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <ProfileAdmin />
            </AdminRoute>
          }
        />

        {/* Dosen Route */}
        <Route
          path="/dosen/dashboard"
          element={
            <DosenRoute>
              <DashboardDosen />
            </DosenRoute>
          }
        />
        <Route
          path="/dosen/mahasiswa-bimbingan"
          element={
            <DosenRoute>
              <ListMahasiswaBimbingan />
            </DosenRoute>
          }
        />
        <Route
          path="/dosen/chat/:id_pengajuan"
          element={
            <DosenRoute>
              <ChatMahasiswa />
            </DosenRoute>
          }
        />

        {/* Mahasiswa Route */}
        <Route
          path="/mahasiswa/dashboard"
          element={
            <MahasiswaRoute>
              <DashboardMahasiswa />
            </MahasiswaRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
