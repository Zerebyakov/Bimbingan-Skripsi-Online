import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate, NavLink } from 'react-router';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    X,
    Settings,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/')
    }

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/mahasiswa/dashboard' },
        { name: 'Pengajuan', icon: <LayoutDashboard size={20} />, path: '/mahasiswa/pengajuan' },
    ]
    return (
        <aside
            className={`fixed md:static top-0 left-0 h-full bg-gray-900 text-gray-200 shadow-xl z-40 transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      w-64`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-lg font-bold">BimbinganOS</span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white md:hidden"
                >
                    <X size={20} />
                </button>
            </div>


            {/* Menu */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuItems.map((item, idx) => (
                    <NavLink
                        key={idx}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors duration-200 ${isActive
                                ? "bg-gray-700 text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
            {/* Logout */}
            <div className="border-t border-gray-700 p-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar