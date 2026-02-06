import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Globe, 
  Bell, 
  Shield, 
  Key, 
  Save, 
  RefreshCw, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Zap, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload 
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

interface Settings {
  _id: string;
  key: string;
  schedule: {
    maxLeadsPerRun: number;
    enabled: boolean;
    timezone: string;
    retryAttempts: number;
    retryDelay: number;
  };
  apis: Array<{
    id: string;
    name: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    params: Record<string, any>;
    fieldMapping: Record<string, string>;
    schedule: string;
    enabled: boolean;
    lastRun?: string;
    status?: string;
  }>;
  fields: Array<{
    validation: {
      options: string[];
    };
    display: {
      showInList: boolean;
      showInDetails: boolean;
      width: string;
    };
    fieldName: string;
    displayName: string;
    type: string;
    required: boolean;
    options: string[];
  }>;
  notifications: Array<{
    settings: {
      method: string;
      browser: boolean;
      headers: Record<string, string>;
      email?: string;
    };
    id: string;
    type: string;
    enabled: boolean;
    triggers: string[];
  }>;
  updatedBy: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('api');
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [showPassword, setShowPassword] = useState('');

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/settings`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        showToast('error', data.message || 'Failed to load settings');
      }
    } catch (err) {
      showToast('error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        showToast('success', 'Settings saved successfully');
      } else {
        showToast('error', data.message || 'Failed to save settings');
      }
    } catch (err) {
      showToast('error', 'Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Test API connection
  const testApiConnection = async (apiId: string) => {
    if (!settings) return;

    try {
      setTestingApi(true);
      const api = settings.apis.find(a => a.id === apiId);
      if (!api) return;

      const response = await fetch(`${API_BASE_URL}/settings/test-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api: api.name,
          endpoint: api.url,
          apiKey: api.headers.Authorization || ''
        })
      });

      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        showToast('success', `${api.name} API connection successful`);
      } else {
        showToast('error', `${api.name} API connection failed`);
      }
    } catch (err) {
      showToast('error', 'API test failed');
    } finally {
      setTestingApi(false);
    }
  };

  // Add custom field
  const addCustomField = () => {
    if (!settings) return;

    const newField = {
      validation: { options: [] },
      display: { showInList: true, showInDetails: true, width: 'auto' },
      fieldName: `field_${Date.now()}`,
      displayName: 'New Field',
      type: 'text',
      required: false,
      options: []
    };

    setSettings({
      ...settings,
      fields: [...settings.fields, newField]
    });
  };

  // Update custom field
  const updateCustomField = (index: number, field: any) => {
    if (!settings) return;

    const updatedFields = [...settings.fields];
    updatedFields[index] = field;

    setSettings({
      ...settings,
      fields: updatedFields
    });
  };

  // Delete custom field
  const deleteCustomField = (index: number) => {
    if (!settings) return;

    const updatedFields = settings.fields.filter((_, i) => i !== index);

    setSettings({
      ...settings,
      fields: updatedFields
    });
  };

  // Show toast notification
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Update setting helper
  const updateSetting = (path: string, value: any) => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i] as keyof typeof current];
    }

    current[keys[keys.length - 1] as keyof typeof current] = value;
    newSettings.updatedAt = new Date().toISOString();

    setSettings(newSettings);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Settings</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={fetchSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'api', label: 'API Settings', icon: Key },
    { id: 'fields', label: 'Custom Fields', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'schedule', label: 'Schedule', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="text-blue-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Configure your application settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* API Settings */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
                <button
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showApiKeys ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>{showApiKeys ? 'Hide' : 'Show'} API Keys</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {settings.apis.map((api) => (
                  <div key={api.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{api.name}</h4>
                        <p className="text-sm text-gray-500">{api.method} {api.url}</p>
                        {api.lastRun && (
                          <p className="text-xs text-gray-400">Last run: {new Date(api.lastRun).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={api.enabled}
                          onChange={(e) => {
                            const updatedApis = settings.apis.map(a => 
                              a.id === api.id ? { ...a, enabled: e.target.checked } : a
                            );
                            setSettings({ ...settings, apis: updatedApis });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
                        <input
                          type="text"
                          value={api.url}
                          onChange={(e) => {
                            const updatedApis = settings.apis.map(a => 
                              a.id === api.id ? { ...a, url: e.target.value } : a
                            );
                            setSettings({ ...settings, apis: updatedApis });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                        <select
                          value={api.method}
                          onChange={(e) => {
                            const updatedApis = settings.apis.map(a => 
                              a.id === api.id ? { ...a, method: e.target.value } : a
                            );
                            setSettings({ ...settings, apis: updatedApis });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => testApiConnection(api.id)}
                        disabled={testingApi}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {testingApi ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
                <button
                  onClick={addCustomField}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Field</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {settings.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={field.displayName}
                          onChange={(e) => updateCustomField(index, { ...field, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(index, { ...field, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required</label>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateCustomField(index, { ...field, required: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-2"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => deleteCustomField(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {field.type === 'select' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateCustomField(index, { 
                            ...field, 
                            options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              
              <div className="space-y-4">
                {settings.notifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">{notification.type} Notifications</h4>
                        <p className="text-sm text-gray-500">
                          Triggers: {notification.triggers.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={notification.enabled}
                          onChange={(e) => {
                            const updatedNotifications = settings.notifications.map(n => 
                              n.id === notification.id ? { ...n, enabled: e.target.checked } : n
                            );
                            setSettings({ ...settings, notifications: updatedNotifications });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable</span>
                      </div>
                    </div>

                    {notification.type === 'email' && notification.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={notification.settings.email || ''}
                            onChange={(e) => {
                              const updatedNotifications = settings.notifications.map(n => 
                                n.id === notification.id 
                                  ? { ...n, settings: { ...n.settings, email: e.target.value } }
                                  : n
                              );
                              setSettings({ ...settings, notifications: updatedNotifications });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                          <select
                            value={notification.settings.method}
                            onChange={(e) => {
                              const updatedNotifications = settings.notifications.map(n => 
                                n.id === notification.id 
                                  ? { ...n, settings: { ...n.settings, method: e.target.value } }
                                  : n
                              );
                              setSettings({ ...settings, notifications: updatedNotifications });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {notification.type === 'browser' && notification.enabled && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={notification.settings.browser}
                          onChange={(e) => {
                            const updatedNotifications = settings.notifications.map(n => 
                              n.id === notification.id 
                                ? { ...n, settings: { ...n.settings, browser: e.target.checked } }
                                : n
                            );
                            setSettings({ ...settings, notifications: updatedNotifications });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Show browser notifications</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Leads Per Run</label>
                  <input
                    type="number"
                    value={settings.schedule.maxLeadsPerRun}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      schedule: { ...settings.schedule, maxLeadsPerRun: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <input
                    type="text"
                    value={settings.schedule.timezone}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      schedule: { ...settings.schedule, timezone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retry Attempts</label>
                  <input
                    type="number"
                    value={settings.schedule.retryAttempts}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      schedule: { ...settings.schedule, retryAttempts: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retry Delay (seconds)</label>
                  <input
                    type="number"
                    value={settings.schedule.retryDelay}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      schedule: { ...settings.schedule, retryDelay: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.schedule.enabled}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      schedule: { ...settings.schedule, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Scheduled Imports</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-30 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          toast.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-3">
            {toast.type === 'success' && <Check size={20} />}
            {toast.type === 'error' && <X size={20} />}
            {toast.type === 'warning' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
