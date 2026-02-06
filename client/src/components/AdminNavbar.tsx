import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface AdminNavbarProps {
  userName: string;
  onLogout: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ userName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveTab = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center mr-8">
              <div className="p-2 bg-purple-600 rounded-lg mr-3">
                <Shield className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            
            <nav className="flex space-x-8">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActiveTab('/admin/dashboard') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Shield size={16} className="mr-2" />
                  Dashboard
                </div>
              </button>
              
              <button
                onClick={() => navigate('/admin/users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActiveTab('/admin/users') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  Users
                </div>
              </button>
              
              <button
                onClick={() => navigate('/admin/settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActiveTab('/admin/settings') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Settings size={16} className="mr-2" />
                  Settings
                </div>
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {userName}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <LogOut size={20} className="mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
