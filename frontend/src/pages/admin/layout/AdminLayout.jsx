import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footbar from "./Footbar";

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-gray-900">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0">
                <Navbar onToggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 shadow-inner rounded-tl-xl transition-all duration-300">
                    {children}
                </main>
                <Footbar />
            </div>
        </div>
    );
};

export default AdminLayout;
