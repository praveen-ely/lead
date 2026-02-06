import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Edit2, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Check,
  Settings,
  Search
} from 'lucide-react';
import Toast from '../components/Toast';
import UserModal from '../components/UserModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  loginCount: number;
  failedLoginAttempts: number;
  lockedUntil?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  apiLimit?: number;
  apiUsage?: number;
  bandwidthUsed?: number;
  leadsCount?: number;
  leadsLimit?: number;
  leadsUsed?: number;
  storageLimit?: number;
  storageUsed?: number;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  permissions?: string[];
  preferences?: any;
  settings?: any;
  tags?: string[];
  notifications?: any;
  twoFactorBackupCodes?: string[];
  twoFactorSecret?: string;
  assignedTo: string;
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UserFilters {
  departments: string[];
  statuses: string[];
  workTypes: string[];
  cities: string[];
  states: string[];
  companies: string[];
}

interface UserListProps {
  refreshKey: number;
}

const UserList: React.FC<UserListProps> = ({ refreshKey }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Dynamic field system
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'email', 'role', 'status', 'createdAt'
  ]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  
  const [filters, setFilters] = useState<UserFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEmailVerified, setFilterEmailVerified] = useState('');
  const [filterTwoFactorEnabled, setFilterTwoFactorEnabled] = useState('');
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Toast and Modal states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Helper function to split name into first and last name
  const splitName = (name: string) => {
    if (!name || typeof name !== 'string') {
      return {
        firstName: '',
        lastName: ''
      };
    }
    
    const parts = name.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  // Fetch available fields from users data
  const fetchAvailableFields = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?limit=50`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Extract all unique fields from the users
        const allFields = new Set<string>();
        data.data.forEach((user: User) => {
          Object.keys(user).forEach(key => {
            // Skip system fields and complex objects
            if (!['__v', 'password', 'twoFactorSecret', 'twoFactorBackupCodes'].includes(key) && 
                (typeof (user as any)[key] !== 'object' || (user as any)[key] === null || Array.isArray((user as any)[key]))) {
              allFields.add(key);
            }
          });
        });
        
        const fieldsArray = Array.from(allFields).sort();
        setAvailableFields(fieldsArray);
        
        // Update selected fields to include any essential fields that aren't already selected
        setSelectedFields(prev => {
          const essentialFields = ['name', 'email', 'role', 'status', 'createdAt'];
          const updated = [...prev];
          essentialFields.forEach(field => {
            if (fieldsArray.includes(field) && !updated.includes(field)) {
              updated.push(field);
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error fetching available fields:', err);
      // Set default fields if API fails
      setAvailableFields(['name', 'email', 'role', 'status', 'createdAt']);
    }
  };

  // Format user field value for display
  const formatUserFieldValue = (user: User, field: string) => {
    const value = user[field as keyof User];
    
    if (value === undefined || value === null) return 'N/A';
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    
    // Handle date fields
    if (field.toLowerCase().includes('date') || field.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    return String(value);
  };

  // Handle field selection
  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  // Get parameters from URL or use defaults
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10; // Fixed limit of 10 users per page
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'dateAdded';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (filterRole) params.append('role', filterRole);
      if (filterEmailVerified) params.append('emailVerified', filterEmailVerified);
      if (filterTwoFactorEnabled) params.append('twoFactorEnabled', filterTwoFactorEnabled);

      const response = await fetch(`/api/users?${params}`);
      const data: UsersResponse = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, filterStatus, filterRole, filterEmailVerified, filterTwoFactorEnabled]);

  const fetchFilters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/filters`);
      const data = await response.json();
      if (data.success) {
        setFilters(data.data);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', field);
    newParams.set('sortOrder', newSortOrder);
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page when filtering
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    navigate(`/users/${user._id}/edit`);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${user._id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          setToast({ message: 'User deleted successfully', type: 'success' });
          fetchUsers();
        } else {
          setToast({ message: data.error || 'Error deleting user', type: 'error' });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setToast({ message: 'Error deleting user', type: 'error' });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const closeToast = () => {
    setToast(null);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  useEffect(() => {
    fetchUsers();
    fetchAvailableFields();
  }, [searchParams, fetchUsers]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAvailableFields();
  }, [refreshKey, fetchUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'Full-time': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Part-time': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Contract': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Intern': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={16} className="text-gray-400" />;
    return sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-600" /> : <ArrowDown size={16} className="text-blue-600" />;
  };

  // Define table columns dynamically based on available database fields
 

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
            <p className="text-gray-600">Manage your lead database efficiently</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowFieldSelector(!showFieldSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings size={16} />
              <span>Customize Fields</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Verified</label>
                <select
                  value={filterEmailVerified}
                  onChange={(e) => setFilterEmailVerified(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Two Factor</label>
                <select
                  value={filterTwoFactorEnabled}
                  onChange={(e) => setFilterTwoFactorEnabled(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} leads
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
          </div>
        </div>
      </div>

      {/* Field Selector */}
      {showFieldSelector && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Select Display Fields</h3>
            <button
              onClick={() => setShowFieldSelector(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableFields.map(field => (
              <button
                key={field}
                onClick={() => toggleField(field)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedFields.includes(field)
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {field}
                {selectedFields.includes(field) && <Check size={14} className="inline ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">User Directory</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/users')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                View All Users
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search users by name, email, department, or skills..."
                  value={search}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      newParams.set('search', e.target.value);
                    } else {
                      newParams.delete('search');
                    }
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sortBy', e.target.value);
                  setSearchParams(newParams);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="department">Department</option>
                <option value="company">Company</option>
                <option value="salary">Salary</option>
              </select>
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  const currentSort = newParams.get('sortBy') || 'dateAdded';
                  const currentOrder = newParams.get('sortOrder') || 'desc';
                  const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                  newParams.set('sortOrder', newOrder);
                  setSearchParams(newParams);
                }}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectedFields.map(field => (
                  <th key={field} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={selectedFields.length + 1} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-12 w-12 text-gray-400" />
                      <span>No users found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    {selectedFields.map(field => {
                      const value = user[field as keyof User];
                      const formattedValue = formatUserFieldValue(user, field);
                      
                      return (
                        <td key={field} className="px-4 py-3">
                          {field === 'email' ? (
                            <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800">
                              {formattedValue}
                            </a>
                          ) : field === 'phone' ? (
                            <a href={`tel:${formattedValue}`} className="text-blue-600 hover:text-blue-800">
                              {formattedValue}
                            </a>
                          ) : field === 'website' ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {formattedValue}
                            </a>
                          ) : (
                            <span title={formattedValue && formattedValue.length > 50 ? formattedValue : ''}>
                              {formattedValue}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-900">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
                className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* User Modal */}
      <UserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default UserList;
