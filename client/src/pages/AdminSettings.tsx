import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  Database, 
  Key,
  Globe,
  Zap,
  Bell,
  RefreshCw,
  Save,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
  Info
} from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'api-keys' | 'leads' | 'users' | 'preferences'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPreferences, setCurrentPreferences] = useState<any>(null);
  const [apiKeyValues, setApiKeyValues] = useState<Array<{ key: string; value: string }>>([]);
  const [dataKeyValues, setDataKeyValues] = useState<Array<{ key: string; value: string }>>([]);
  const [leadForm, setLeadForm] = useState<any>({});
  const [leadExtraFields, setLeadExtraFields] = useState<Array<{ key: string; value: string }>>([]);
  const [updateLeadId, setUpdateLeadId] = useState('');
  const [leadActionLoading, setLeadActionLoading] = useState(false);
  const [leadModelPreferences, setLeadModelPreferences] = useState<any>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || currentUser.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchUsers();
  }, [token, currentUser.role, navigate]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPreferences(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchLeadModelPreferences();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-preferences/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 404) {
        setCurrentPreferences(null);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setCurrentPreferences(data.data);
        applyPreferencesToSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setCurrentPreferences(null);
    }
  };

  const applyPreferencesToSettings = (prefs: any) => {
    if (prefs?.api?.customKeys) {
      const normalized = prefs.api.customKeys instanceof Map
        ? Object.fromEntries(prefs.api.customKeys)
        : prefs.api.customKeys || {};
      setApiKeyValues(Object.entries(normalized).map(([k, v]) => ({ key: k, value: String(v) })));
    }
    if (prefs?.dataKeys) {
      const normalized = prefs.dataKeys instanceof Map
        ? Object.fromEntries(prefs.dataKeys)
        : prefs.dataKeys || {};
      setDataKeyValues(Object.entries(normalized).map(([k, v]) => ({ key: k, value: String(v) })));
    }
  };

  const createDefaultPreferences = () => ({
    geographic: { cities: [], states: [], countries: [], radius: 50, radiusUnit: 'km' },
    business: { industries: [], companySizes: [], revenueRanges: [] },
    triggers: { events: [], keywords: [], technologies: [] },
    customFilters: {},
    api: { customKeys: {} },
    dataKeys: {}
  });

  const formatList = (items?: string[], emptyLabel = 'Any') => {
    if (!items || items.length === 0) return emptyLabel;
    const visible = items.slice(0, 4);
    const remaining = items.length - visible.length;
    return `${visible.join(', ')}${remaining > 0 ? ` +${remaining} more` : ''}`;
  };

  const normalizeFilters = (filters?: Record<string, string[]> | Map<string, string[]>) => {
    if (!filters) return {};
    if (filters instanceof Map) {
      return Object.fromEntries(filters);
    }
    return filters;
  };

  const summarizeCustomFilters = (filters?: Record<string, string[]> | Map<string, string[]>) => {
    const normalized = normalizeFilters(filters);
    const entries = Object.entries(normalized).filter(([, values]) => (values || []).length > 0);
    if (!entries.length) return 'Any';
    return entries.map(([field, values]) => `${field} (${(values || []).length})`).join(', ');
  };

  const handleEmailLookup = async (email: string) => {
    if (!email || !email.trim()) {
      setMessage({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const found = users.find(u => u.email?.toLowerCase().trim() === normalizedEmail);
    if (found) {
      setSelectedUserId(found._id);
      setMessage(null);
      return;
    }
    try {
      const response = await fetch(`/api/auth/users?search=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        const match = data.data.find((u: any) => u.email?.toLowerCase().trim() === normalizedEmail);
        if (match) {
          setUsers(prev => [...prev, match]);
          setSelectedUserId(match._id);
          setMessage(null);
          return;
        }
      }
      setMessage({ type: 'error', text: 'No user found for that email.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error looking up user.' });
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const prefs = currentPreferences || createDefaultPreferences();
      const apiCustomKeys: Record<string, string> = {};
      apiKeyValues.forEach(({ key, value }) => {
        if (key.trim()) apiCustomKeys[key.trim()] = value.trim();
      });
      const dataKeysObj: Record<string, string> = {};
      dataKeyValues.forEach(({ key, value }) => {
        if (key.trim()) dataKeysObj[key.trim()] = value.trim();
      });
      prefs.api = { ...prefs.api, customKeys: apiCustomKeys };
      prefs.dataKeys = dataKeysObj;

      const response = await fetch(`/api/user-preferences/${selectedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: prefs })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setCurrentPreferences(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const createLead = async () => {
    try {
      setLeadActionLoading(true);
      setMessage(null);
      const customFields: any = {};
      leadExtraFields.forEach(({ key, value }) => {
        if (key.trim()) customFields[key.trim()] = value.trim();
      });
      Object.assign(customFields, leadForm);

      const response = await fetch(`${API_BASE_URL}/leads/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: selectedUserId,
          data: customFields
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Lead created successfully! LeadId: ${data.data.leadId}` });
        setLeadForm({});
        setLeadExtraFields([]);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create lead' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error occurred' });
    } finally {
      setLeadActionLoading(false);
    }
  };

  const updateLead = async () => {
    try {
      setLeadActionLoading(true);
      setMessage(null);
      if (!updateLeadId.trim()) {
        setMessage({ type: 'error', text: 'LeadId is required for update' });
        return;
      }
      const customFields: any = {};
      leadExtraFields.forEach(({ key, value }) => {
        if (key.trim()) customFields[key.trim()] = value.trim();
      });
      Object.assign(customFields, leadForm);

      const response = await fetch(`/api/leads/update/leads/${updateLeadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: selectedUserId,
          data: customFields
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Lead updated successfully! LeadId: ${data.data.leadId}` });
        setLeadForm({});
        setLeadExtraFields([]);
        setUpdateLeadId('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update lead' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error occurred' });
    } finally {
      setLeadActionLoading(false);
    }
  };

  const fetchLeadModelPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await fetch(`${API_BASE_URL}/user-preferences/lead-model/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeadModelPreferences(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load preferences' });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load lead model preferences' });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const saveLeadModelPreferences = async () => {
    if (!leadModelPreferences) {
      setMessage({ type: 'error', text: 'No preferences to save' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch(`${API_BASE_URL}/user-preferences/lead-model/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: leadModelPreferences })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Lead model preferences saved successfully!' });
        setLeadModelPreferences(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-purple-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar userName={currentUser.firstName} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Parameters
              </button>
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'api-keys'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                API & Data Keys
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'leads'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Leads
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'preferences'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lead Model Preferences
              </button>
            </nav>
          </div>
        </div>

        {/* User Parameters Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">User Preferences</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search User by Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter user email"
                    onChange={(e) => {
                      if (e.target.value) handleEmailLookup(e.target.value);
                      else setMessage(null);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.email} ({user.firstName} {user.lastName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentPreferences && (() => {
                // Handle both structures: preferences.preferences.geographic OR preferences.geographic
                const prefs = currentPreferences.preferences || currentPreferences;
                return (
                  <div className="mb-6 bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">User Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div><strong>Cities:</strong> {formatList(prefs.geographic?.cities)}</div>
                      <div><strong>States:</strong> {formatList(prefs.geographic?.states)}</div>
                      <div><strong>Countries:</strong> {formatList(prefs.geographic?.countries)}</div>
                      <div><strong>Radius:</strong> {prefs.geographic?.radius || 0} {prefs.geographic?.radiusUnit || 'km'}</div>
                      <div><strong>Industries:</strong> {formatList(prefs.business?.industries)}</div>
                      <div><strong>Company Sizes:</strong> {formatList(prefs.business?.companySizes)}</div>
                      <div><strong>Revenue Ranges:</strong> {formatList(prefs.business?.revenueRanges)}</div>
                      <div><strong>Trigger Events:</strong> {formatList(prefs.triggers?.events)}</div>
                      <div><strong>Keywords:</strong> {formatList(prefs.triggers?.keywords)}</div>
                      <div><strong>Technologies:</strong> {formatList(prefs.triggers?.technologies)}</div>
                      <div><strong>Scoring Enabled:</strong> {prefs.scoring?.enabled ? 'Yes' : 'No'}</div>
                      {prefs.scoring?.enabled && (
                        <>
                          <div><strong>Industry Weight:</strong> {prefs.scoring?.weights?.industry || 0}%</div>
                          <div><strong>Size Weight:</strong> {prefs.scoring?.weights?.size || 0}%</div>
                          <div><strong>Location Weight:</strong> {prefs.scoring?.weights?.location || 0}%</div>
                          <div><strong>Technology Weight:</strong> {prefs.scoring?.weights?.technology || 0}%</div>
                        </>
                      )}
                      <div><strong>Email Notifications:</strong> {prefs.notifications?.email ? 'Yes' : 'No'}</div>
                      <div><strong>Browser Notifications:</strong> {prefs.notifications?.browser ? 'Yes' : 'No'}</div>
                      <div><strong>Notification Frequency:</strong> {prefs.notifications?.frequency || 'daily'}</div>
                      <div><strong>Custom Filters:</strong> {summarizeCustomFilters(currentPreferences.customFilters || prefs.customFilters)}</div>
                    </div>
                    {(() => {
                      const customFilters = currentPreferences.customFilters || prefs.customFilters;
                      const normalized = normalizeFilters(customFilters);
                      const entries = Object.entries(normalized).filter(([, values]) => (values || []).length > 0);
                      if (!entries.length) return null;
                      return (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {entries.map(([field, values]) => (
                            <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="text-xs font-semibold text-gray-700 capitalize mb-2">
                                {field.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(values || []).map((val) => (
                                  <span
                                    key={`${field}-${val}`}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                                  >
                                    {val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {!currentPreferences && selectedUserId && (
                <div className="text-center py-8 text-gray-500">
                  No preferences found for this user.
                </div>
              )}
            </div>
          </div>
        )}

        {/* API & Data Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">API Custom Keys</h2>
              </div>
              <div className="p-6">
                {apiKeyValues.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) => {
                        const updated = [...apiKeyValues];
                        updated[idx].key = e.target.value;
                        setApiKeyValues(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...apiKeyValues];
                        updated[idx].value = e.target.value;
                        setApiKeyValues(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setApiKeyValues(apiKeyValues.filter((_, i) => i !== idx))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setApiKeyValues([...apiKeyValues, { key: '', value: '' }])}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus size={16} className="inline mr-1" />
                  Add Key-Value Pair
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Data Keys</h2>
              </div>
              <div className="p-6">
                {dataKeyValues.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) => {
                        const updated = [...dataKeyValues];
                        updated[idx].key = e.target.value;
                        setDataKeyValues(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...dataKeyValues];
                        updated[idx].value = e.target.value;
                        setDataKeyValues(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setDataKeyValues(dataKeyValues.filter((_, i) => i !== idx))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setDataKeyValues([...dataKeyValues, { key: '', value: '' }])}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus size={16} className="inline mr-1" />
                  Add Key-Value Pair
                </button>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving || !selectedUserId}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                saving || !selectedUserId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-lg'
              }`}
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Save size={16} className="mr-2" />
                  Save Settings
                </div>
              )}
            </button>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create/Update Leads</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Email (for assignment)
                </label>
                <input
                  type="email"
                  placeholder="Enter user email"
                  onChange={(e) => {
                    if (e.target.value) handleEmailLookup(e.target.value);
                    else setMessage(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update LeadId (leave empty for new lead)
                </label>
                <input
                  type="text"
                  placeholder="e.g., A1, A2 (for update)"
                  value={updateLeadId}
                  onChange={(e) => setUpdateLeadId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={leadForm.companyName || ''}
                    onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="text"
                    value={leadForm.website || ''}
                    onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={leadForm.email || ''}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status</label>
                  <select
                    value={leadForm.leadStatus || ''}
                    onChange={(e) => setLeadForm({ ...leadForm, leadStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Status</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={leadForm.priority || ''}
                    onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Priority</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extra Fields</label>
                {leadExtraFields.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={item.key}
                      onChange={(e) => {
                        const updated = [...leadExtraFields];
                        updated[idx].key = e.target.value;
                        setLeadExtraFields(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...leadExtraFields];
                        updated[idx].value = e.target.value;
                        setLeadExtraFields(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setLeadExtraFields(leadExtraFields.filter((_, i) => i !== idx))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setLeadExtraFields([...leadExtraFields, { key: '', value: '' }])}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus size={16} className="inline mr-1" />
                  Add Field
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createLead}
                  disabled={leadActionLoading || !selectedUserId}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all ${
                    leadActionLoading || !selectedUserId
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {leadActionLoading ? 'Creating...' : 'Create Lead'}
                </button>
                <button
                  onClick={updateLead}
                  disabled={leadActionLoading || !selectedUserId || !updateLeadId}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all ${
                    leadActionLoading || !selectedUserId || !updateLeadId
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {leadActionLoading ? 'Updating...' : 'Update Lead'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Model Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Lead Model Preferences</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLeadModelPreferences}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <button
                  onClick={saveLeadModelPreferences}
                  disabled={saving || preferencesLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6">
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin text-purple-600" size={32} />
                  <span className="ml-3 text-gray-600">Loading preferences...</span>
                </div>
              ) : leadModelPreferences ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Version</span>
                      <span className="text-sm text-gray-600">{leadModelPreferences.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Last Updated</span>
                      <span className="text-sm text-gray-600">
                        {new Date(leadModelPreferences.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Basic Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(leadModelPreferences.leadFields?.basic || {}).map(([key, config]: [string, any]) => (
                        <div key={key} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900">{config.displayName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {config.type} | Required: {config.required ? 'Yes' : 'No'} | Visible: {config.visible ? 'Yes' : 'No'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Status Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(leadModelPreferences.leadFields?.status || {}).map(([key, config]: [string, any]) => (
                        <div key={key} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900">{config.displayName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {config.type} | Required: {config.required ? 'Yes' : 'No'} | Visible: {config.visible ? 'Yes' : 'No'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Priority Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(leadModelPreferences.leadFields?.priority || {}).map(([key, config]: [string, any]) => (
                        <div key={key} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900">{config.displayName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {config.type} | Required: {config.required ? 'Yes' : 'No'} | Visible: {config.visible ? 'Yes' : 'No'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Custom Fields ({Object.keys(leadModelPreferences.leadFields?.custom || {}).length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {Object.entries(leadModelPreferences.leadFields?.custom || {}).map(([key, config]: [string, any]) => (
                        <div key={key} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900">{config.displayName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Type: {config.type} | Required: {config.required ? 'Yes' : 'No'} | Visible: {config.visible ? 'Yes' : 'No'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Display Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Default Fields: </span>
                        <span className="text-sm text-gray-600">
                          {leadModelPreferences.displaySettings?.defaultFields?.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Visible Fields: </span>
                        <span className="text-sm text-gray-600">
                          {leadModelPreferences.displaySettings?.visibleFields?.length || 0} fields
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Sortable Fields: </span>
                        <span className="text-sm text-gray-600">
                          {leadModelPreferences.displaySettings?.sortableFields?.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="text-blue-600 mt-0.5" size={20} />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Note:</p>
                        <p>This is a read-only view. To edit preferences, use the Preferences page in the user dashboard.</p>
                        <p className="mt-2">The same data is used across all users and can be edited by admins.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <AlertCircle className="mx-auto mb-2" size={32} />
                  <p>Failed to load preferences</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
