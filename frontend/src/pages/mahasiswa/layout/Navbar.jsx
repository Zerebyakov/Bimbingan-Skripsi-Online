import { Fragment, useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router";
import {
    Bell,
    ChevronDown,
    LogOut,
    Menu as MenuIcon,
    User,
    Loader2,
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { initSocket, getSocket } from "../../../services/Socket";
import axios from "axios";
import { baseUrl } from "../../../components/api/myAPI";

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotif, setLoadingNotif] = useState(false);
    const notifListenerRef = useRef(null);

    // 🔔 Fetch notifikasi
    const fetchNotifications = async () => {
        setLoadingNotif(true);
        try {
            const res = await axios.get(`${baseUrl}notifikasi`, {
                withCredentials: true,
            });
            setNotifications(res.data.data.notifikasi || []);
        } catch (error) {
            console.error("❌ Error fetching notifications:", error);
        } finally {
            setLoadingNotif(false);
        }
    };

    // 🔢 Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${baseUrl}notifikasi/unread-count`, {
                withCredentials: true,
            });
            setUnreadCount(res.data.data.unreadCount || 0);
        } catch (error) {
            console.error("❌ Error fetching unread count:", error);
        }
    };

    // ✅ Mark as read
    const markAsRead = async (id_notif) => {
        try {
            await axios.put(
                `${baseUrl}notifikasi/${id_notif}/read`,
                {},
                { withCredentials: true }
            );
            setNotifications((prev) =>
                prev.map((n) => (n.id_notif === id_notif ? { ...n, isRead: true } : n))
            );
            fetchUnreadCount();
        } catch (error) {
            console.error("❌ Error marking as read:", error);
        }
    };

    // 🔌 Setup Socket & Notifications
    useEffect(() => {
        if (!user?.id_user) return;

        // Initialize socket
        const socket = initSocket(user.id_user);

        // Fetch initial data
        fetchNotifications();
        fetchUnreadCount();

        // Setup notification listener
        const handleNewNotification = (notif) => {
            console.log("🔔 New notification received:", notif);

            setNotifications((prev) => {
                // Cek duplikasi
                const exists = prev.some((n) => n.id_notif === notif.id_notif);
                if (exists) return prev;
                return [notif, ...prev];
            });

            setUnreadCount((prev) => prev + 1);
        };

        // Remove old listener if exists
        if (notifListenerRef.current) {
            socket.off("notification:new", notifListenerRef.current);
        }

        // Setup new listener
        notifListenerRef.current = handleNewNotification;
        socket.on("notification:new", handleNewNotification);

        // Cleanup
        return () => {
            if (socket) {
                socket.off("notification:new", notifListenerRef.current);
            }
            notifListenerRef.current = null;
        };
    }, [user?.id_user]);

    // 🧹 Logout
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header className="h-16 w-full bg-gray-100/80 backdrop-blur-sm shadow flex items-center justify-between px-4 md:px-6 z-30 border-b border-gray-300 sticky top-0">
            {/* Sidebar toggle */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="text-gray-700 hover:text-gray-900 focus:outline-none transition md:hidden"
                >
                    <MenuIcon size={24} />
                </button>
                <h1 className="text-base md:text-lg font-semibold text-gray-800 tracking-wide">
                    Dashboard Mahasisswa
                </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3 sm:gap-5">
                {/* 🔔 Notification */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            if (!notifOpen) {
                                fetchNotifications();
                                fetchUnreadCount();
                            }
                        }}
                        className="relative text-gray-600 hover:text-gray-900 transition"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown Notifikasi */}
                    <Transition
                        show={notifOpen}
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Notifikasi
                                </h3>
                                <button
                                    onClick={() => fetchNotifications()}
                                    className="text-xs text-gray-500 hover:text-gray-800 transition"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                {loadingNotif ? (
                                    <div className="flex justify-center py-6 text-gray-500 text-sm">
                                        <Loader2 size={16} className="animate-spin mr-1" /> Memuat...
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <button
                                            key={notif.id_notif}
                                            onClick={() => markAsRead(notif.id_notif)}
                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!notif.isRead ? "bg-blue-50" : ""
                                                }`}
                                        >
                                            <p
                                                className={`text-sm ${notif.isRead
                                                    ? "text-gray-600"
                                                    : "text-gray-800 font-medium"
                                                    }`}
                                            >
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.createdAt).toLocaleString("id-ID", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-gray-500 text-sm">
                                        Tidak ada notifikasi.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Transition>
                </div>

                {/* 👤 User menu */}
                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 focus:outline-none">
                        <span className="hidden sm:block text-sm text-gray-800 font-medium truncate max-w-[100px]">
                            {user?.Mahasiswa?.nama_lengkap || "Mahasiswa"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-gray-200 focus:outline-none z-50">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => navigate("/mahasiswa/profile")}
                                            className={`${active ? "bg-gray-100" : ""
                                                } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700`}
                                        >
                                            <User size={16} />
                                            Profile
                                        </button>
                                    )}
                                </Menu.Item>

                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={handleLogout}
                                            className={`${active ? "bg-gray-100" : ""
                                                } flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600`}
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </header>
    );
};

export default Navbar;