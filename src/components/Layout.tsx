import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Package, Tags, RefreshCcw, LogOut, TruckIcon, FileText, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setSidebarOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/auth');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        className={`flex items-center px-4 py-3 rounded-lg mb-1 transition-all ${
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        onClick={closeSidebar}
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="lg:hidden mr-2 p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">Bem-vindo, {isAdmin ? 'Administrador' : 'Usuário'}</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Mobile) */}
        <aside
          className={`lg:hidden fixed inset-0 z-40 transition-transform transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={closeSidebar}></div>
          <div className="relative max-w-xs w-full h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <Logo small />
              <button
                onClick={closeSidebar}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <NavItem to="/products" icon={<Package size={20} />} label="Produtos" />
              <NavItem to="/categories" icon={<Tags size={20} />} label="Categorias" />
              <NavItem to="/transactions" icon={<RefreshCcw size={20} />} label="Transações" />
              <NavItem to="/suppliers" icon={<TruckIcon size={20} />} label="Fornecedores" />
              <NavItem to="/reports" icon={<FileText size={20} />} label="Relatórios" />
              {isAdmin && (
                <NavItem to="/users" icon={<Users size={20} />} label="Usuários" />
              )}
            </nav>
            <div className="p-4 border-t">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut size={20} className="mr-3" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="w-64 flex flex-col border-r border-gray-200">
            <nav className="flex-1 pt-6 px-4 overflow-y-auto">
              <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <NavItem to="/products" icon={<Package size={20} />} label="Produtos" />
              <NavItem to="/categories" icon={<Tags size={20} />} label="Categorias" />
              <NavItem to="/transactions" icon={<RefreshCcw size={20} />} label="Transações" />
              <NavItem to="/suppliers" icon={<TruckIcon size={20} />} label="Fornecedores" />
              <NavItem to="/reports" icon={<FileText size={20} />} label="Relatórios" />
              {isAdmin && (
                <NavItem to="/users" icon={<Users size={20} />} label="Usuários" />
              )}
            </nav>
            <div className="p-4 border-t">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut size={20} className="mr-3" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;