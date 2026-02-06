import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Terminal,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  bodyExample?: any;
  responseExample?: any;
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/leads',
    description: 'Get all leads with pagination, search, and filtering',
    parameters: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Number of leads per page (default: 10)' },
      { name: 'search', type: 'string', required: false, description: 'Search term for name, email, phone, etc.' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status (new, contacted, qualified, converted, lost)' },
      { name: 'priority', type: 'string', required: false, description: 'Filter by priority (low, medium, high)' },
      { name: 'source', type: 'string', required: false, description: 'Filter by source' },
      { name: 'sortBy', type: 'string', required: false, description: 'Sort field (default: dateAdded)' },
      { name: 'sortOrder', type: 'string', required: false, description: 'Sort order: asc or desc (default: desc)' }
    ],
    responseExample: {
      success: true,
      data: [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "John Smith",
          email: "john.smith@company.com",
          phone: "+1-555-0123",
          company: "Tech Corp",
          status: "new",
          priority: "medium",
          source: "jsonplaceholder",
          score: 85
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        pages: 3
      }
    }
  },
  {
    method: 'POST',
    path: '/api/leads/import/third-party',
    description: 'Import leads from third-party sources',
    bodyExample: {
      source: 'jsonplaceholder'
    },
    responseExample: {
      success: true,
      message: "Successfully imported 10 leads from jsonplaceholder",
      data: {
        success: true,
        source: "jsonplaceholder",
        leadsFetched: 10,
        leads: [
          {
            name: "John Smith",
            email: "john.smith@techcorp.com",
            phone: "+1-555-0123",
            company: "Tech Corporation",
            status: "new",
            priority: "medium",
            score: 85
          }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/leads/import/sources',
    description: 'Get available third-party sources for lead import',
    responseExample: {
      success: true,
      data: ['jsonplaceholder', 'randomuser', 'dummyjson']
    }
  },
  {
    method: 'GET',
    path: '/api/leads/stats',
    description: 'Get lead statistics by status',
    responseExample: {
      success: true,
      data: [
        { _id: 'new', count: 5 },
        { _id: 'contacted', count: 3 },
        { _id: 'qualified', count: 2 },
        { _id: 'converted', count: 1 }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/users',
    description: 'Get all users with pagination, search, and filtering',
    parameters: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Number of users per page (default: 10)' },
      { name: 'search', type: 'string', required: false, description: 'Search term for name, email, phone, etc.' },
      { name: 'department', type: 'string', required: false, description: 'Filter by department' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status' },
      { name: 'workType', type: 'string', required: false, description: 'Filter by work type' },
      { name: 'city', type: 'string', required: false, description: 'Filter by city' },
      { name: 'state', type: 'string', required: false, description: 'Filter by state' },
      { name: 'sortBy', type: 'string', required: false, description: 'Sort field (default: dateAdded)' },
      { name: 'sortOrder', type: 'string', required: false, description: 'Sort order: asc or desc (default: desc)' }
    ],
    responseExample: {
      success: true,
      data: [
        {
          _id: "507f1f77bcf86cd799439011",
          userId: "USER001",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+1234567890",
          department: "Engineering",
          status: "Active",
          workType: "Full-time"
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        pages: 3
      }
    }
  },
  {
    method: 'GET',
    path: '/api/users/stats',
    description: 'Get user statistics',
    responseExample: {
      success: true,
      data: {
        total: 100,
        today: 5,
        lastWeek: 25,
        lastMonth: 80,
        byDepartment: [
          { _id: "Engineering", count: 40 },
          { _id: "Sales", count: 30 },
          { _id: "Marketing", count: 30 }
        ],
        byStatus: [
          { _id: "Active", count: 85 },
          { _id: "Inactive", count: 15 }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/users/filters',
    description: 'Get user filter options',
    responseExample: {
      success: true,
      data: {
        departments: ["Engineering", "Sales", "Marketing"],
        statuses: ["Active", "Inactive", "On Leave"],
        workTypes: ["Full-time", "Part-time", "Contract"],
        cities: ["New York", "Los Angeles", "Chicago"],
        states: ["NY", "CA", "IL"],
        companies: ["Tech Corp", "Startup Inc"]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    description: 'Get single user by ID',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'User ID (MongoDB _id)' }
    ],
    responseExample: {
      success: true,
      data: {
        _id: "507f1f77bcf86cd799439011",
        userId: "USER001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        department: "Engineering",
        status: "Active"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/users/userId/:userId',
    description: 'Get single user by userId',
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User custom ID' }
    ]
  },
  {
    method: 'POST',
    path: '/api/users',
    description: 'Create new user',
    bodyExample: {
      userId: "USER002",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "+1234567891",
      department: "Sales",
      status: "Active",
      workType: "Full-time"
    },
    responseExample: {
      success: true,
      data: {
        _id: "507f1f77bcf86cd799439012",
        userId: "USER002",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com"
      },
      message: "User created successfully"
    }
  },
  {
    method: 'POST',
    path: '/api/users/bulk',
    description: 'Create multiple users',
    bodyExample: {
      users: [
        {
          userId: "USER003",
          firstName: "Alice",
          lastName: "Johnson",
          email: "alice.johnson@example.com"
        },
        {
          userId: "USER004",
          firstName: "Bob",
          lastName: "Wilson",
          email: "bob.wilson@example.com"
        }
      ]
    }
  },
  {
    method: 'PUT',
    path: '/api/users/:id',
    description: 'Update user by ID',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'User ID (MongoDB _id)' }
    ],
    bodyExample: {
      firstName: "John Updated",
      email: "john.updated@example.com",
      status: "Active"
    }
  },
  {
    method: 'PATCH',
    path: '/api/users/:id',
    description: 'Partially update user',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'User ID (MongoDB _id)' }
    ],
    bodyExample: {
      status: "On Leave"
    }
  },
  {
    method: 'PUT',
    path: '/api/users/bulk',
    description: 'Update multiple users',
    bodyExample: {
      users: [
        {
          _id: "507f1f77bcf86cd799439011",
          status: "Active"
        },
        {
          _id: "507f1f77bcf86cd799439012",
          status: "Active"
        }
      ]
    }
  },
  {
    method: 'DELETE',
    path: '/api/users/:id',
    description: 'Delete user by ID',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'User ID (MongoDB _id)' }
    ],
    responseExample: {
      success: true,
      message: "User deleted successfully"
    }
  },
  {
    method: 'DELETE',
    path: '/api/users/bulk',
    description: 'Delete multiple users',
    bodyExample: {
      userIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
    }
  },
  {
    method: 'GET',
    path: '/api/settings',
    description: 'Get system settings',
    responseExample: {
      success: true,
      data: {
        api: {
          endpoints: {
            crunchbase: "https://api.crunchbase.com/v4",
            hunter: "https://api.hunter.io/v2",
            clearbit: "https://api.clearbit.com/v1"
          },
          keys: {
            crunchbase: "your_crunchbase_key",
            hunter: "your_hunter_key",
            clearbit: "your_clearbit_key"
          }
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/settings',
    description: 'Update system settings',
    bodyExample: {
      api: {
        endpoints: {
          crunchbase: "https://api.crunchbase.com/v4"
        },
        keys: {
          crunchbase: "new_crunchbase_key"
        }
      }
    },
    responseExample: {
      success: true,
      data: {
        api: {
          endpoints: {
            crunchbase: "https://api.crunchbase.com/v4"
          },
          keys: {
            crunchbase: "new_crunchbase_key"
          }
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/settings/test-api',
    description: 'Test API connection',
    bodyExample: {
      api: "crunchbase",
      endpoint: "https://api.crunchbase.com/v4",
      apiKey: "your_crunchbase_key"
    },
    responseExample: {
      success: true,
      message: "API connection successful",
      data: {
        responseTime: 250,
        status: "connected"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/user-preferences/options',
    description: 'Get available preference options',
    responseExample: {
      success: true,
      data: {
        cities: ["New York", "Los Angeles", "Chicago"],
        industries: ["Technology", "Healthcare", "Finance"],
        companySizes: ["Small", "Medium", "Large"]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/user-preferences/:userId',
    description: 'Get user preferences',
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User ID' }
    ],
    responseExample: {
      success: true,
      data: {
        userId: "user123",
        preferences: {
          geographic: {
            cities: ["New York", "San Francisco"],
            radius: 50
          },
          business: {
            industries: ["Technology", "Healthcare"],
            companySizes: ["Medium", "Large"]
          }
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/user-preferences',
    description: 'Create user preferences',
    bodyExample: {
      userId: "user123",
      preferences: {
        geographic: {
          cities: ["New York"],
          radius: 50
        }
      }
    },
    responseExample: {
      success: true,
      data: {
        _id: "507f1f77bcf86cd799439013",
        userId: "user123",
        preferences: {
          geographic: {
            cities: ["New York"],
            radius: 50
          }
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/user-preferences/:userId',
    description: 'Update user preferences',
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User ID' }
    ],
    bodyExample: {
      preferences: {
        geographic: {
          cities: ["New York", "Los Angeles"],
          radius: 75
        }
      }
    },
    responseExample: {
      success: true,
      data: {
        _id: "507f1f77bcf86cd799439013",
        userId: "user123",
        preferences: {
          geographic: {
            cities: ["New York", "Los Angeles"],
            radius: 75
          }
        }
      }
    }
  }
];

const ApiDocumentationSimple: React.FC = () => {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'GET': return '📖';
      case 'POST': return '➕';
      case 'PUT': return '✏️';
      case 'PATCH': return '🔧';
      case 'DELETE': return '🗑️';
      default: return '📋';
    }
  };

  const getActionColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-50 border-green-200 text-green-700';
      case 'POST': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'PUT': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'PATCH': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'DELETE': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCurlCommand = (endpoint: ApiEndpoint) => {
    let curl = `curl -X ${endpoint.method} \\\n`;
    curl += `  http://localhost:5002${endpoint.path} \\\n`;
    curl += `  -H "Content-Type: application/json"`;
    
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.bodyExample) {
      curl += ` \\\n  -d '${JSON.stringify(endpoint.bodyExample, null, 2)}'`;
    }
    
    return curl;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <BookOpen size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">🚀 API Documentation</h1>
                <p className="text-blue-100 mt-1">Complete REST API reference for your User Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Globe size={20} />
                <span className="font-medium">v1.0.0</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Shield size={20} />
                <span className="font-medium">REST API</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Terminal className="mr-3" size={28} />
              🚀 API Endpoints
            </h2>
            <p className="text-gray-600 mt-2">Complete REST API reference for your User Management System</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className={`text-2xl font-bold ${getActionColor(endpoint.method)} px-3 py-1 rounded-lg border`}>
                        {getMethodIcon(endpoint.method)} {endpoint.method}
                      </span>
                      <code className="text-lg font-mono bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-lg text-gray-800 font-medium mb-3">{endpoint.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                        📋 REST API
                      </span>
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                        🗄️ MongoDB
                      </span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                        ⚡ Express.js
                      </span>
                    </div>
                    
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">📋 Parameters:</p>
                        <div className="flex flex-wrap gap-2">
                          {endpoint.parameters.slice(0, 4).map((param, paramIndex) => (
                            <span key={paramIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300">
                              {param.name}: {param.type}
                              {param.required && <span className="text-red-500 font-medium"> *</span>}
                            </span>
                          ))}
                          {endpoint.parameters.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs border border-gray-300">
                              +{endpoint.parameters.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      onClick={() => copyToClipboard(generateCurlCommand(endpoint), `curl-${index}`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                      title="Copy cURL command"
                    >
                      <Terminal size={16} />
                      <span>Copy cURL</span>
                      {copiedCode === `curl-${index}` && <Check size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setExpandedEndpoint(expandedEndpoint === endpoint.path ? null : endpoint.path);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {expandedEndpoint === endpoint.path ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{expandedEndpoint === endpoint.path ? 'Hide' : 'Show'} Details</span>
                    </button>
                  </div>
                </div>
                
                {expandedEndpoint === endpoint.path && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {endpoint.parameters && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            📋 Parameters
                          </h4>
                          <div className="space-y-3">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <div key={paramIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-300">
                                    {param.name}
                                  </code>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    param.required 
                                      ? 'bg-red-100 text-red-700 border-red-200' 
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}>
                                    {param.required ? 'Required' : 'Optional'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{param.description}</p>
                                <p className="text-xs text-gray-500 mt-1">Type: {param.type}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {endpoint.bodyExample && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            📝 Request Body Example
                          </h4>
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                            <pre className="text-sm overflow-x-auto">
                              <code className="text-green-400">{JSON.stringify(endpoint.bodyExample, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {endpoint.responseExample && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            📤 Response Example
                          </h4>
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                            <pre className="text-sm overflow-x-auto">
                              <code className="text-blue-400">{JSON.stringify(endpoint.responseExample, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        💻 cURL Command
                      </h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          <code className="text-green-400">{generateCurlCommand(endpoint)}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationSimple;
