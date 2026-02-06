import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface UserNavbarProps {
  userName: string;
  onLogout: () => void;
}

const UserNavbar: React.FC<UserNavbarProps> = ({ userName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveTab = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center mr-8">
              <div className="p-2 bg-blue-600 rounded-lg mr-3">
                <BarChart3 className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Lead Generation</h1>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex space-x-8">
              <button
                onClick={() => navigate('/dashboard')}
                className={`py-4 px-1 border-b-2 transition-colors font-medium text-sm ${
                  isActiveTab('/dashboard') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 size={16} className="mr-2" />
                  Dashboard
                </div>
              </button>
              
              <button
                onClick={() => navigate('/leads')}
                className={`py-4 px-1 border-b-2 transition-colors font-medium text-sm ${
                  isActiveTab('/leads') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  Leads
                </div>
              </button>
              
              <button
                onClick={() => navigate('/preferences')}
                className={`py-4 px-1 border-b-2 transition-colors font-medium text-sm ${
                  isActiveTab('/preferences') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Settings size={16} className="mr-2" />
                  Preferences
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
              className="flex items-center text-red-600 hover:text-red-700 transition-colors"
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

export default UserNavbar;
