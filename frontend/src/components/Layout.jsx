import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiSettings, FiUsers, FiBarChart2, FiLogOut, FiMenu, FiX, FiImage, FiTable } from 'react-icons/fi';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: FiHome },
    { name: t('nav.machines'), href: '/dashboard/machines', icon: FiSettings },
    { name: t('nav.workers'), href: '/dashboard/workers', icon: FiUsers },
    { name: t('nav.production'), href: '/dashboard/production', icon: FiBarChart2 },
    { name: 'Screenshot Mapping', href: '/dashboard/screenshot-mapping', icon: FiImage },
    { name: 'Table Visualization', href: '/dashboard/table-visualization', icon: FiTable },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-secondary-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <FiSettings className="text-primary-400 text-3xl mr-3" />
              <h1 className="text-xl font-bold text-white">Production Tracker</h1>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-secondary-800 text-white'
                        : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 flex-shrink-0 h-6 w-6`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-secondary-700 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-secondary-400">{user?.company}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-3 text-secondary-400 hover:text-white transition-colors"
            >
              <FiLogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-secondary-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-secondary-900">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
              >
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-8">
                <FiSettings className="text-primary-400 text-3xl mr-3" />
                <h1 className="text-xl font-bold text-white">Production Tracker</h1>
              </div>
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive
                          ? 'bg-secondary-800 text-white'
                          : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                      }`}
                    >
                      <Icon className="mr-4 flex-shrink-0 h-6 w-6" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-secondary-700 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-secondary-400">{user?.company}</p>
              </div>
              <button onClick={handleLogout} className="ml-3 text-secondary-400 hover:text-white">
                <FiLogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden flex items-center justify-between pl-1 pt-1 pr-3 sm:pl-3 sm:pt-3 bg-white shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-secondary-500 hover:text-secondary-900"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <LanguageSwitcher />
        </div>
        
        {/* Desktop header with language switcher */}
        <div className="hidden md:flex items-center justify-end px-4 py-3 bg-white shadow-sm">
          <LanguageSwitcher />
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="w-full px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
