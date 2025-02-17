import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Add your logout logic here
  };

  return (
    <div className="relative">
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 bg-gray-100 text-white p-2 rounded-full shadow-lg focus:outline-none z-50 hover:bg-white transition duration-300"
        onClick={toggleSidebar}
      >
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static fixed top-0 left-0 h-screen w-full lg:w-72 bg-gray-900 text-white border-r border-gray-800 shadow-xl z-40 transition-transform duration-300`}
      >
        {/* Top Logo */}
        <div className="flex bg-white justify-center items-center  border-b border-gray-900 py-5">
          <img
            src="https://tronova.azmiproductions.com/loura/HTSB.png"
            alt="LOURA Logo"
            className="w-44 h-auto"
          />
        </div>

        {/* Navigation Items */}
        <ul className="mt-8 space-y-4 px-6">
          {[
            { to: '/', label: 'Dashboard' },
            { to: '/loadcell', label: 'Load Cell' },
          ].map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-black shadow-lg'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="material-icons">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout Button */}
        <div className="absolute bottom-10 w-full px-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-lg transition-all duration-300"
          >
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 w-full px-6 text-center text-gray-500 text-xs">
          <span>Powered by <span className="text-cyan-500 font-semibold">Barracuda Lab</span></span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
