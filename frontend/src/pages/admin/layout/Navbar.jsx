import { Fragment } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router";
import {
    Bell,
    ChevronDown,
    LogOut,
    Menu as MenuIcon,
    User,
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                    Dashboard Admin
                </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3 sm:gap-5">
                <button className="relative text-gray-600 hover:text-gray-900 transition">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>

                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 focus:outline-none">
                        <span className="hidden sm:block text-sm text-gray-800 font-medium truncate max-w-[100px]">
                            {user?.email || "Admin"}
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
                                            onClick={() => navigate("/admin/profile")}
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
