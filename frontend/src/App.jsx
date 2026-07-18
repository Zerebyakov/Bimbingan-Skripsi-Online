import React, { Suspense, lazy } from 'react'
import { useAuth } from './context/AuthContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'

// Halaman awal dimuat langsung agar first paint cepat
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

// Halaman per-role dimuat lazy (code splitting) agar bundle awal kecil
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'));
const ListPengajuan = lazy(() => import('./pages/admin/ListPengajuan'));
const ListDosen = lazy(() => import('./pages/admin/ListDosen'));
const ListMahasiswa = lazy(() => import('./pages/admin/ListMahasiswa'));
const KonfigurasiSistem = lazy(() => import('./pages/admin/KonfigurasiSistem'));
const ProfileAdmin = lazy(() => import('./pages/admin/ProfileAdmin'));
const ArsipMahasiswa = lazy(() => import('./pages/admin/ArsipMahasiswa'));

const DashboardDosen = lazy(() => import('./pages/dosen/DashboardDosen'));
const ListMahasiswaBimbingan = lazy(() => import('./pages/dosen/ListMahasiswaBimbingan'));
const MahasiswaSelesai = lazy(() => import('./pages/dosen/MahasiswaSelesai'));
const ChatMahasiswa = lazy(() => import('./pages/dosen/ChatMahasiswa'));
const ProfileDosen = lazy(() => import('./pages/dosen/ProfileDosen'));
const ListPengajuanMahasiswa = lazy(() => import('./pages/dosen/ListPengajuanMahasiswa'));
const ListBabMahasiswa = lazy(() => import('./pages/dosen/ListBabMahasiswa'));
const ListLaporanMahasiswa = lazy(() => import('./pages/dosen/ListLaporanMahasiswa'));

const DashboardMahasiswa = lazy(() => import('./pages/mahasiswa/DashboardMahasiswa'));
const Pengajuan = lazy(() => import('./pages/mahasiswa/Pengajuan'));
const UploadBab = lazy(() => import('./pages/mahasiswa/UploadBab'));
const Bimbingan = lazy(() => import('./pages/mahasiswa/Bimbingan'));
const LaporanAkhir = lazy(() => import('./pages/mahasiswa/LaporanAkhir'));
const KartuBimbinganPrint = lazy(() => import('./pages/mahasiswa/KartuBimbinganPrint'));
const ProfileMahasiswa = lazy(() => import('./pages/mahasiswa/ProfileMahasiswa'));

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
      <Suspense fallback={<LoadingScreen />}>
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
          path="/admin/arsip"
          element={
            <AdminRoute>
              <ArsipMahasiswa />
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
          path="/dosen/mahasiswa-pengajuan"
          element={
            <DosenRoute>
              <ListPengajuanMahasiswa />
            </DosenRoute>
          }
        />
        <Route
          path="/dosen/mahasiswa-bab"
          element={
            <DosenRoute>
              <ListBabMahasiswa />
            </DosenRoute>
          }
        />
        <Route
          path="/dosen/mahasiswa-laporan"
          element={
            <DosenRoute>
              <ListLaporanMahasiswa />
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
          path="/dosen/mahasiswa-selesai"
          element={
            <DosenRoute>
              <MahasiswaSelesai />
            </DosenRoute>
          }
        />
        <Route
          path="/dosen/profile"
          element={
            <DosenRoute>
              <ProfileDosen />
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
        <Route
          path="/mahasiswa/pengajuan"
          element={
            <MahasiswaRoute>
              <Pengajuan />
            </MahasiswaRoute>
          }
        />
        <Route
          path="/mahasiswa/profile"
          element={
            <MahasiswaRoute>
              <ProfileMahasiswa />
            </MahasiswaRoute>
          }
        />
        <Route
          path="/mahasiswa/upload-bab"
          element={
            <MahasiswaRoute>
              <UploadBab />
            </MahasiswaRoute>
          }
        />
        <Route
          path="/mahasiswa/bimbingan"
          element={
            <MahasiswaRoute>
              <Bimbingan />
            </MahasiswaRoute>
          }
        />
        <Route
          path="/mahasiswa/laporan-akhir"
          element={
            <MahasiswaRoute>
              <LaporanAkhir />
            </MahasiswaRoute>
          }
        />
        <Route
          path="/mahasiswa/kartu-bimbingan/:id"
          element={
            <MahasiswaRoute>
              <KartuBimbinganPrint />
            </MahasiswaRoute>
          }
        />
      </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
