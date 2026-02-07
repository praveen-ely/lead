import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Download,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Info,
  Zap,
  Database,
  Settings,
  Calendar,
  Upload,
  File,
  EyeOff,
  Paperclip
} from 'lucide-react';
import UserNavbar from '../components/UserNavbar';

interface Lead {
  _id: string;
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  status: string;
  priority?: string;
  source?: string;
  score?: number;
  tags?: string[];
  dateAdded: string;
  dateUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    temperature?: string;
    [key: string]: any;
  };
  assignedTo?: string;
  owner?: string;
  notes?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  activities?: any[];
  communicationHistory?: any[];
  conversionProbability?: number;
  daysSinceLastContact?: number;
  documents?: any[];
  estimatedValue?: number;
  followUpCount?: number;
  lastContactedAt?: string;
  leadSourceQuality?: string;
  nextFollowUpAt?: string;
  [key: string]: any; // Allow for dynamic fields
}

interface LeadFilters {
  search: string;
  status: string;
  priority: string;
  assignedTo: string;
  source: string;
  sortBy: string;
  sortOrder: string;
}

const LeadList: React.FC = () => {
  // Helper function to split name into first and last name
  const splitName = (name: string) => {
    const parts = name.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const getCustomFieldsHistory = (lead: any) => {
    if (Array.isArray(lead?.customFields)) return lead.customFields;
    if (lead?.customFields && typeof lead.customFields === 'object') return [lead.customFields];
    return [];
  };

  const getLatestCustomFields = (lead: any) => {
    const history = getCustomFieldsHistory(lead);
    return history[history.length - 1] || {};
  };

  const getUpdatedFields = (history: Array<Record<string, any>>) => {
    if (!Array.isArray(history) || history.length < 2) return [];
    const previous = history[history.length - 2] || {};
    const current = history[history.length - 1] || {};
    const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
    return Array.from(keys).filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
  };

  const getAttachmentDownloadName = (attachmentValue: string) => {
    const match = attachmentValue.match(/^data:([^;]+);base64,/i);
    if (!match) return 'attachment';
    const mime = match[1].toLowerCase();
    const extMap: Record<string, string> = {
      'text/csv': 'csv',
      'text/plain': 'txt',
      'application/pdf': 'pdf',
      'application/json': 'json',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };
    const extension = extMap[mime] || 'bin';
    return `attachment.${extension}`;
  };

  const getLeadAttachmentValue = (lead: Lead) => {
    const latest = lead.latestCustomFields || getLatestCustomFields(lead);
    return (
      latest?.attachments ||
      latest?.Attachments ||
      (lead as any)?.attachments ||
      (lead as any)?.Attachments ||
      ''
    );
  };

  const handleAttachmentDownload = (lead: Lead) => {
    const attachmentValue = getLeadAttachmentValue(lead);
    if (!attachmentValue) return;
    const value = String(attachmentValue);
    if (value.startsWith('data:')) {
      const fileName = getAttachmentDownloadName(value);
      const link = document.createElement('a');
      link.href = value;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (value.startsWith('http')) {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  const normalizeLead = (lead: any): Lead => {
    const history = getCustomFieldsHistory(lead);
    let latestCustomFields = history[history.length - 1] || {};
    
    // Ensure latestCustomFields is an object, not an array
    if (Array.isArray(latestCustomFields)) {
      // If it's an array, convert to object by merging all array elements
      latestCustomFields = latestCustomFields.reduce((acc, item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return { ...acc, ...item };
        }
        return acc;
      }, {});
    } else if (typeof latestCustomFields !== 'object' || latestCustomFields === null) {
      latestCustomFields = {};
    }
    
    latestCustomFields = { ...latestCustomFields };
    
    if (!latestCustomFields.leadId && (lead?.leadId || lead?.id)) {
      latestCustomFields.leadId = lead.leadId || lead.id;
    }
    const updatedFields = getUpdatedFields(history);
    const isUpdatedLead = updatedFields.length > 0;
    const isNewLead = history.length <= 1;
    const leadData = { ...(lead?.data || {}), ...(latestCustomFields || {}) };
    const statusValue = (lead.status || leadData.status || '').toString();
    const priorityValue = (lead.priority || leadData.priority || '').toString();
    const priorityLevelValue = (leadData.priorityLevel || leadData.priority || lead.priority || '').toString();
    const formatLabel = (value: string) => {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    const rawCustomFields = latestCustomFields || {};
    const normalizedCustomFields = { ...rawCustomFields };
    if (normalizedCustomFields.Id && !normalizedCustomFields.id) {
      normalizedCustomFields.id = normalizedCustomFields.Id;
    }
    if (normalizedCustomFields.ID && !normalizedCustomFields.id) {
      normalizedCustomFields.id = normalizedCustomFields.ID;
    }

    return {
      ...lead,
      customFields: latestCustomFields,
      customFieldsHistory: history,
      latestCustomFields,
      updatedFields,
      isUpdatedLead,
      isNewLead,
      ...normalizedCustomFields,
      leadId: lead.leadId || leadData.leadId || leadData.id || lead.leadId || lead.id || '',
      id: leadData.id || leadData.Id || leadData.ID || leadData.uid || lead.leadId || lead.id || '',
      companyName: leadData.companyName || lead.company || leadData.company || '',
      website: lead.website || leadData.website || '',
      companyType: lead.companyType || leadData.companyType || '',
      industry: leadData.industry || '',
      foundedYear: leadData.foundedYear || '',
      headquarters: leadData.headquarters || '',
      revenueRangeCr: leadData.revenueRangeCr || '',
      employeeCount: leadData.employeeCount || '',
      manufacturingPlants: leadData.manufacturingPlants || '',
      plantLocations: leadData.plantLocations || '',
      certifications: leadData.certifications || '',
      exportMarkets: leadData.exportMarkets || '',
      contactName: leadData.contactName || leadData.keyDecisionMaker || '',
      contactRole: leadData.contactRole || leadData.designation || '',
      email: leadData.email || leadData.contactEmail || '',
      phone: leadData.phone || '',
      leadStatus: formatLabel(lead.leadStatus || leadData.leadStatus || leadData.status || statusValue),
      priorityLevel: formatLabel(lead.priorityLevel || leadData.priorityLevel || priorityLevelValue || priorityValue),
      dateAdded: lead.dateAdded || leadData.dateAdded || lead.createdAt || new Date().toISOString(),
      dateUpdated: lead.lastUpdated || lead.updatedAt || lead.dateUpdated
    };
  };

  const getLeadBatchKey = (lead: Lead) => {
    const dateValue = lead.isUpdatedLead
      ? (lead.updatedAt || lead.dateUpdated || lead.dateAdded || lead.createdAt)
      : (lead.dateAdded || lead.createdAt || lead.updatedAt);
    const dateObj = dateValue ? new Date(dateValue) : null;
    if (!dateObj || Number.isNaN(dateObj.getTime())) {
      return 'unknown';
    }
    return dateObj.toISOString().slice(0, 16);
  };

  const formatBatchLabel = (batchKey: string) => {
    if (!batchKey || batchKey === 'unknown') return 'Unknown';
    const date = new Date(batchKey);
    if (Number.isNaN(date.getTime())) return batchKey;
    return date.toLocaleString();
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: '',
    priority: '',
    assignedTo: '',
    source: '',
    sortBy: 'leadId',
    sortOrder: 'asc'
  });
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const modalFields = [
    'leadId',
    'companyName',
    'website',
    'companyType',
    'foundedYear',
    'headquarters',
    'revenueRangeCr',
    'employeeCount',
    'manufacturingPlants',
    'plantLocations',
    'dosageForms',
    'certifications',
    'gmpCertifications',
    'exportPercent',
    'therapeuticArea',
    'keyProduct',
    'businessModel',
    'targetMarkets',
    'recentFdaApprovals',
    'whoPrequalified',
    'triggerEvent',
    'triggerDate',
    'contactName',
    'contactRole',
    'email',
    'leadScore',
    'companyNotes',
    'attachments'
  ];
  const tableFields = modalFields.filter((field) => field !== 'attachments');
  const baseFields = [
    'leadId',
    'companyName',
    'website',
    'companyType',
    'foundedYear'
  ].filter((field) => tableFields.includes(field));
  const hiddenFields = new Set(['id']);
  const [selectedFields, setSelectedFields] = useState<string[]>(baseFields);
  const [batchLeads, setBatchLeads] = useState<Lead[]>([]);
  const [leadBatches, setLeadBatches] = useState<Array<{ key: string; label: string; count: number; newCount: number; updatedCount: number }>>([]);
  const [selectedBatchKey, setSelectedBatchKey] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [viewedRowIds, setViewedRowIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('leadListViewedRowIds');
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  });
  const [expandedBatchDate, setExpandedBatchDate] = useState<string | null>(null);
  const [selectedLeadType, setSelectedLeadType] = useState<'new' | 'updated' | 'thisMonth' | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Rate limiting refs
  const fetchingLeadsRef = useRef(false);
  const mountedRef = useRef(false);
  const lastRateLimitRef = useRef<number>(0);

  const preserveScroll = (action: () => void) => {
    const scrollY = window.scrollY;
    action();
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY });
    });
  };

  const clearLeadFilters = () => {
    preserveScroll(() => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      assignedTo: '',
      source: '',
      sortBy: 'leadId',
      sortOrder: 'asc'
    });
      setDateRange({ from: '', to: '' });
      setPagination(prev => ({ ...prev, page: 1 }));
      setSelectedLeadType(null);
    });
  };

  // Toggle sort by field - same as dashboard
  const toggleSort = (field: string) => {
    preserveScroll(() => {
      setFilters(prev => {
        if (prev.sortBy !== field) {
          return { ...prev, sortBy: field, sortOrder: 'asc' };
        }
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      });
    });
  };

  // Fetch available fields from leads data - same as dashboard
  // Note: Fields are now extracted in fetchLeads, so this function is kept for compatibility
  const fetchAvailableFields = async () => {
    // Fields are extracted in fetchLeads from normalized data
    // This function is called but fields are set in fetchLeads
  };

  // Fetch leads - using same API as dashboard
  const fetchLeads = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingLeadsRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        console.warn('Skipping leads fetch - rate limit was hit recently');
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

    try {
      fetchingLeadsRef.current = true;
      setLoading(true);
      
      // Get token and userId from localStorage inside the function
      const token = localStorage.getItem('token');
      const currentUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
          return null;
        }
      })();
      const userId = currentUser?._id;
      
      if (!token || !userId) {
        setError('Authentication required. Please login.');
        fetchingLeadsRef.current = false;
        return;
      }
      
      // Fetch all leads for client-side pagination (like dashboard)
      const params = new URLSearchParams({
        limit: '1000', // Fetch more leads for client-side pagination
        page: '1'
      });

      const response = await fetch(`/api/leads?${params}&includeAll=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-cache',
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        fetchingLeadsRef.current = false;
        return;
      }

      if (response.status === 429) {
        console.warn('Rate limited - skipping leads fetch. Will retry after 60 seconds.');
        lastRateLimitRef.current = Date.now();
        fetchingLeadsRef.current = false;
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        if (!errorText.includes('Too many')) {
          setError(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
        fetchingLeadsRef.current = false;
        setLoading(false);
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        const normalized = data.data.map(normalizeLead);
        setLeads(normalized);
        setBatchLeads(normalized);
        // Update pagination total but keep client-side pagination
        setPagination(prev => ({
          ...prev,
          total: normalized.length,
          pages: Math.max(1, Math.ceil(normalized.length / prev.limit))
        }));

        // Extract custom fields from latestCustomFields - same as dashboard
        const extraFields = new Set<string>();
        normalized.forEach((lead: any) => {
          const customFields = lead.latestCustomFields || {};
          // Filter out numeric keys (array indices) and only include actual field names
          Object.keys(customFields).forEach((key) => {
            // Skip numeric keys (array indices) and only include string field names
            if (
              isNaN(Number(key)) &&
              typeof key === 'string' &&
              key.trim() !== '' &&
              !hiddenFields.has(key) &&
              tableFields.includes(key)
            ) {
              extraFields.add(key);
            }
          });
        });
        const allFields = Array.from(new Set([...baseFields, ...Array.from(extraFields)]))
          .filter((field) => !hiddenFields.has(field) && tableFields.includes(field));
        setAvailableFields(allFields);
        setSelectedFields((prev) => {
          const next = prev.filter((field) => allFields.includes(field));
          return next.length ? next : baseFields;
        });

        const batchMap: Record<string, { key: string; label: string; count: number; newCount: number; updatedCount: number }> = {};
        normalized.forEach((lead: Lead) => {
          const key = getLeadBatchKey(lead);
          if (!batchMap[key]) {
            batchMap[key] = { key, label: formatBatchLabel(key), count: 0, newCount: 0, updatedCount: 0 };
          }
          batchMap[key].count += 1;
          if (lead.isNewLead) {
            batchMap[key].newCount += 1;
          } else if (lead.isUpdatedLead) {
            batchMap[key].updatedCount += 1;
          }
        });
        const sortedBatches = Object.values(batchMap).sort((a, b) => b.key.localeCompare(a.key));
        setLeadBatches(sortedBatches);
      } else {
        setError(data.message || 'Failed to fetch leads');
      }
    } catch (err: any) {
      // Don't log 429 errors
      if (!err.message?.includes('429') && !err.message?.includes('Too many') && !err.message?.includes('Failed to fetch')) {
        setError('Network error occurred');
      }
      fetchingLeadsRef.current = false;
    } finally {
      setLoading(false);
      // Reset fetching ref after a delay
      if (fetchingLeadsRef.current) {
        setTimeout(() => {
          fetchingLeadsRef.current = false;
        }, 2000);
      }
    }
  }, []); // Empty deps - token/userId accessed from localStorage inside function

  useEffect(() => {
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;

    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit >= 60000) {
        lastRateLimitRef.current = 0;
      } else {
        console.warn('Rate limit still active, skipping initial fetch');
        return;
      }
    }

    setTimeout(() => {
      if (!fetchingLeadsRef.current && lastRateLimitRef.current === 0) {
        fetchLeads();
      }
    }, 500);

    fetchAvailableFields();
  }, [fetchLeads]);

  // Get display value for dynamic field
  const getDisplayValue = (lead: Lead, fieldName: string) => {
    // Direct property access for common fields
    if (fieldName === 'name') return lead.name;
    if (fieldName === 'email') return lead.email;
    if (fieldName === 'phone') return lead.phone || '';
    if (fieldName === 'company') return lead.company || '';
    if (fieldName === 'status') return lead.status;
    if (fieldName === 'priority') return lead.priority || '';
    if (fieldName === 'source') return lead.source || '';
    if (fieldName === 'score') return lead.score?.toString() || '';
    
    return '';
  };

  // Get field type for styling
  const getFieldType = (fieldName: string): string => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('email')) return 'email';
    if (lowerField.includes('phone') || lowerField.includes('mobile')) return 'phone';
    if (lowerField.includes('date')) return 'date';
    if (lowerField.includes('url') || lowerField.includes('website') || lowerField.includes('linkedin')) return 'url';
    if (!isNaN(Number(lowerField))) return 'number';
    return 'text';
  };

  // Format field value for display
  const formatFieldValue = (lead: Lead, field: string) => {
    // First check if it's a custom field
    if (lead.customFields && lead.customFields[field] !== undefined) {
      const value = lead.customFields[field];
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'number') return value.toLocaleString();
      return String(value);
    }

    if (field === 'leadId') return (lead as any).leadId || lead.id || lead._id || 'N/A';
    if (field === 'companyName') return (lead as any).companyName || lead.company || 'N/A';
    if (field === 'leadStatus') return (lead as any).leadStatus || lead.status || 'N/A';
    if (field === 'priorityLevel') return (lead as any).priorityLevel || lead.priority || 'N/A';
    
    // Then check regular fields
    const value = lead[field];
    
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

  const parseLeadId = (value: string) => {
    const match = value.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return null;
    return { prefix: match[1], num: parseInt(match[2], 10) };
  };

  const getSortValue = (lead: Lead, field: string) => {
    // Same logic as dashboard - use latestCustomFields first
    const latestCustomFields = Array.isArray(lead?.customFields)
      ? lead.customFields[lead.customFields.length - 1] || {}
      : (lead?.customFields || lead?.latestCustomFields || {});
    const value = latestCustomFields?.[field] ?? lead?.[field];
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    const normalized = String(value).trim();
    const numeric = Number(normalized.replace(/[%₹,]/g, ''));
    if (!Number.isNaN(numeric) && normalized.match(/^\d/)) return numeric;
    return normalized.toLowerCase();
  };

  const compareValues = (av: any, bv: any, dir: number) => {
    const isEmpty = (value: any) => value === '' || value === null || value === undefined;
    if (isEmpty(av) && isEmpty(bv)) return 0;
    if (isEmpty(av)) return 1;
    if (isEmpty(bv)) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    }
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
  };

  const isThisMonth = (dateValue: any): boolean => {
    if (!dateValue) return false;
    const dateObj = new Date(dateValue);
    if (Number.isNaN(dateObj.getTime())) return false;
    const now = new Date();
    return dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
  };

  const getLeadCreatedDate = (lead: Lead) => {
    return lead.createdAt || lead.dateAdded || lead.updatedAt || lead.dateUpdated || '';
  };

  const filterByLeadType = (list: Lead[]) => {
    if (selectedLeadType === 'new') return list.filter((lead) => lead.isNewLead);
    if (selectedLeadType === 'updated') return list.filter((lead) => lead.isUpdatedLead);
    if (selectedLeadType === 'thisMonth') {
      return list.filter((lead) => {
        const dateValue = lead.isUpdatedLead
          ? (lead.updatedAt || lead.dateUpdated || lead.dateAdded || lead.createdAt)
          : (lead.dateAdded || lead.createdAt || lead.updatedAt);
        return isThisMonth(dateValue);
      });
    }
    return list;
  };

  const baseList = selectedBatchKey
    ? (selectedBatchKey === 'all' ? batchLeads : batchLeads.filter((lead) => getLeadBatchKey(lead) === selectedBatchKey))
    : leads;

  const leadTypeFiltered = filterByLeadType(baseList);

  const displayLeads = leadTypeFiltered.filter((lead) => {
    // Status filter - same as dashboard
    if (filters.status) {
      const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
      const statusValue = (lead.leadStatus || latestCustomFields?.leadStatus || latestCustomFields?.status || lead.status || '')
        .toString()
        .trim()
        .toLowerCase();
      if (statusValue !== filters.status.toLowerCase().trim()) return false;
    }
    // Priority filter - same as dashboard
    if (filters.priority) {
      const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
      const priorityValue = (lead.priorityLevel || latestCustomFields?.priorityLevel || latestCustomFields?.priority || lead.priority || '')
        .toString()
        .trim()
        .toLowerCase();
      if (priorityValue !== filters.priority.toLowerCase().trim()) return false;
    }
    // Search filter - same as dashboard (search in all fields)
    if (filters.search) {
      const searchValue = filters.search.toLowerCase().trim();
      const flatFields = {
        ...lead,
        ...(lead.latestCustomFields || getLatestCustomFields(lead))
      };
      const matches = Object.values(flatFields).some((value) => String(value || '').toLowerCase().includes(searchValue));
      if (!matches) return false;
    }
    // Date filter (database created date)
    if (dateRange.from || dateRange.to) {
      const leadDateValue = getLeadCreatedDate(lead);
      const leadDate = leadDateValue ? new Date(leadDateValue) : null;
      if (!leadDate || Number.isNaN(leadDate.getTime())) return false;
      if (dateRange.from) {
        const start = new Date(dateRange.from);
        start.setHours(0, 0, 0, 0);
        if (leadDate < start) return false;
      }
      if (dateRange.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        if (leadDate > end) return false;
      }
    }
    return true;
  });

  const sortedDisplayLeads = [...displayLeads].sort((a, b) => {
    const dir = filters.sortOrder === 'asc' ? 1 : -1;
    const av = getSortValue(a, filters.sortBy);
    const bv = getSortValue(b, filters.sortBy);
    if (filters.sortBy === 'leadId') {
      const aId = parseLeadId(String(av));
      const bId = parseLeadId(String(bv));
      if (aId && bId) {
        if (aId.prefix !== bId.prefix) return aId.prefix < bId.prefix ? -1 * dir : 1 * dir;
        if (aId.num !== bId.num) return aId.num < bId.num ? -1 * dir : 1 * dir;
        return 0;
      }
    }
    return compareValues(av, bv, dir);
  });

  // Client-side pagination like dashboard
  const totalPages = Math.max(1, Math.ceil(sortedDisplayLeads.length / pagination.limit));
  const pagedLeads = sortedDisplayLeads.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );
  const latestBatchKey = leadBatches[0]?.key || null;
  const statusOptions = Array.from(
    new Set(
      batchLeads
        .map((lead) => lead.leadStatus || lead.latestCustomFields?.leadStatus || lead.latestCustomFields?.status)
        .filter((status) => status)
        .map((status) => String(status || '').trim())
    )
  );
  const priorityOptions = Array.from(
    new Set(
      batchLeads
        .map((lead) => lead.priorityLevel || lead.latestCustomFields?.priorityLevel || lead.latestCustomFields?.priority)
        .filter((priority) => priority)
        .map((priority) => String(priority || '').trim().toUpperCase())
    )
  );

  // Handle field selection
  const toggleField = (fieldName: string) => {
    if (baseFields.includes(fieldName) || hiddenFields.has(fieldName)) return;
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const getFieldLabel = (field: string) => {
    const labelMap: Record<string, string> = {
      leadId: 'ID',
      companyName: 'Company Name',
      companyType: 'Company Type',
      foundedYear: 'Founded Year',
      headquarters: 'Headquarters',
      revenueRangeCr: 'Revenue Range Cr',
      website: 'Website',
      employeeCount: 'Employee Count',
      manufacturingPlants: 'Manufacturing Plants',
      plantLocations: 'Plant Locations',
      dosageForms: 'Dosage Forms',
      certifications: 'Certifications Type',
      gmpCertifications: 'Certifications Type',
      exportPercent: 'Export Percent',
      therapeuticArea: 'Therapeutic Area',
      keyProduct: 'Key Product',
      businessModel: 'Business Model',
      targetMarkets: 'Target Markets',
      recentFdaApprovals: 'Recent Fda Approvals',
      whoPrequalified: 'Who Prequalified',
      triggerEvent: 'Trigger Event',
      triggerDate: 'Trigger Date',
      contactName: 'Contact Name',
      contactRole: 'Contact Role',
      email: 'Email',
      leadScore: 'Lead Score',
      companyNotes: 'Company Notes',
      attachments: 'Attachments'
    };
    const pretty = field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim();
    return labelMap[field] || (pretty.charAt(0).toUpperCase() + pretty.slice(1));
  };

  // Show toast notification
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getExportValue = (lead: Lead, field: string) => {
    const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
    if (field === 'leadId') {
      return lead.leadId || lead.id || lead._id || '';
    }
    const value = latestCustomFields?.[field] ?? (lead as any)?.[field];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (field.toLowerCase().includes('date') || field.toLowerCase().includes('at')) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    }
    return String(value);
  };

  const exportLeadsToCsv = () => {
    if (!selectedFields.length) {
      showToast('warning', 'Please select fields to export');
      return;
    }
    const rows = sortedDisplayLeads;
    if (!rows.length) {
      showToast('warning', 'No leads available to export');
      return;
    }
    const headers = selectedFields.map((field) => getFieldLabel(field));
    const csvRows = [
      headers,
      ...rows.map((lead) => selectedFields.map((field) => getExportValue(lead, field)))
    ];
    const escapeCsv = (value: string) => {
      const needsQuotes = /[",\n]/.test(value);
      const escaped = value.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const csvContent = '\uFEFF' + csvRows.map((row) => row.map((cell) => escapeCsv(String(cell ?? ''))).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle delete confirmation
  const handleDeleteClick = (leadId: string) => {
    setLeadToDelete(leadId);
    setShowDeleteModal(true);
  };

  // Handle delete lead
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('success', 'Lead deleted successfully');
        setShowDeleteModal(false);
        setLeadToDelete(null);
        fetchLeads();
      } else {
        showToast('error', data.message || 'Failed to delete lead');
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      showToast('error', 'Network error occurred');
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLeadToDelete(null);
  };

  // Handle update lead
  const handleUpdateLead = async (leadId: string, updatedData: any) => {
    try {
      const token = localStorage.getItem('token');
      // Update customFields with the new data
      const updatePayload = {
        customFields: updatedData
      };
      
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('success', 'Lead updated successfully');
        setShowEditModal(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        showToast('error', data.message || 'Failed to update lead');
      }
    } catch (err) {
      console.error('Error updating lead:', err);
      showToast('error', 'Network error occurred');
    }
  };


  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Qualified': return 'bg-green-100 text-green-800';
      case 'Converted': return 'bg-purple-100 text-purple-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const token = localStorage.getItem('token');
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  })();
  const userId = currentUser?._id;

  useEffect(() => {
    if (!token || !userId || currentUser?.role !== 'user') {
      navigate('/login');
      return;
    }
  }, [token, userId, currentUser?.role, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem('leadListViewedRowIds', JSON.stringify(Array.from(viewedRowIds)));
    } catch {
      // Ignore storage errors
    }
  }, [viewedRowIds]);

  const seenCount = leads.filter((lead) => viewedRowIds.has(lead._id)).length;
  const unseenCount = Math.max(0, leads.length - seenCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes expandRow {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }
        .expand-row {
          animation: expandRow 0.25s ease-out;
        }
      `}</style>
      <UserNavbar userName={currentUser?.firstName || ''} onLogout={() => navigate('/login')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Colorful Stats Tiles */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div 
            onClick={() => {
              setSelectedLeadType(null);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-indigo-500 to-purple-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === null ? 'ring-4 ring-indigo-300 ring-offset-2' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">Total Leads</div>
                <div className="text-2xl font-semibold mt-1">{pagination.total || leads.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <Database size={20} />
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedLeadType('new');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-emerald-500 to-teal-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'new' ? 'ring-4 ring-emerald-300 ring-offset-2' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">New Leads</div>
                <div className="text-2xl font-semibold mt-1">{leads.filter(l => l.isNewLead).length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <Zap size={20} />
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedLeadType('updated');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-blue-500 to-cyan-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'updated' ? 'ring-4 ring-blue-300 ring-offset-2' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">Updated Leads</div>
                <div className="text-2xl font-semibold mt-1">{leads.filter(l => l.isUpdatedLead).length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <RefreshCw size={20} />
              </div>
            </div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-slate-600 to-slate-800 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">Seen</div>
                <div className="text-2xl font-semibold mt-1">{seenCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <Eye size={20} />
              </div>
            </div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-rose-500 to-pink-500 transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">Unseen</div>
                <div className="text-2xl font-semibold mt-1">{unseenCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <EyeOff size={20} />
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedLeadType('thisMonth');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-amber-500 to-yellow-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'thisMonth' ? 'ring-4 ring-amber-300 ring-offset-2' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-90">This Month</div>
                <div className="text-2xl font-semibold mt-1">
                  {leads.filter(l => {
                    const dateValue = l.isUpdatedLead
                      ? (l.updatedAt || l.dateUpdated || l.dateAdded || l.createdAt)
                      : (l.dateAdded || l.createdAt || l.updatedAt);
                    return isThisMonth(dateValue);
                  }).length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>


        {/* Lead Batches */}
        {leadBatches.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6 rounded-lg shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lead Batches (Last 3 Days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Count</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const getDateKey = (batchKey: string) => batchKey?.slice(0, 10) || 'unknown';
                  const formatDateLabel = (dateKey: string) => {
                    if (!dateKey || dateKey === 'unknown') return 'Unknown';
                    const date = new Date(dateKey);
                    if (Number.isNaN(date.getTime())) return dateKey;
                    return date.toLocaleDateString();
                  };
                  const grouped = leadBatches.reduce((acc, batch) => {
                    const dateKey = getDateKey(batch.key);
                    if (!acc[dateKey]) {
                      acc[dateKey] = {
                        dateKey,
                        label: formatDateLabel(dateKey),
                        count: 0,
                        newCount: 0,
                        updatedCount: 0,
                        items: []
                      };
                    }
                    acc[dateKey].count += batch.count;
                    acc[dateKey].newCount += batch.newCount;
                    acc[dateKey].updatedCount += batch.updatedCount;
                    acc[dateKey].items.push(batch);
                    return acc;
                  }, {} as Record<string, { dateKey: string; label: string; count: number; newCount: number; updatedCount: number; items: Array<{ key: string; label: string; count: number; newCount: number; updatedCount: number }> }>);
                  const groupedList = Object.values(grouped).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
                  groupedList.forEach((group) => group.items.sort((a, b) => b.key.localeCompare(a.key)));
                  return groupedList.map((group) => (
                    <React.Fragment key={group.dateKey}>
                      <tr
                        className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => setExpandedBatchDate((prev) => (prev === group.dateKey ? null : group.dateKey))}
                      >
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{group.label}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{group.count}</td>
                        <td className="px-4 py-2 text-sm text-emerald-700">{group.newCount}</td>
                        <td className="px-4 py-2 text-sm text-amber-700">{group.updatedCount}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">
                          {expandedBatchDate === group.dateKey ? 'Hide' : 'View'}
                        </td>
                      </tr>
                      {expandedBatchDate === group.dateKey &&
                        group.items.map((batch) => (
                          <tr key={batch.key} className={`expand-row hover:bg-gray-50 ${selectedBatchKey === batch.key ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-2 text-sm text-gray-900">{batch.label}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{batch.count}</td>
                            <td className="px-4 py-2 text-sm text-emerald-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatchKey('all');
                                  setSelectedLeadType((prev) => (prev === 'new' ? null : 'new'));
                                }}
                                className="hover:underline"
                              >
                                {batch.newCount}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-sm text-amber-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatchKey('all');
                                  setSelectedLeadType((prev) => (prev === 'updated' ? null : 'updated'));
                                }}
                                className="hover:underline"
                              >
                                {batch.updatedCount}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatchKey(batch.key);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View Leads
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Filters moved into action bar */}

      {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-600">Loading leads...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-600" size={20} />
              <span className="ml-3 text-red-800">{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="mb-6">
              <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm px-4 py-4">
                <div className="flex flex-col gap-3">
                  {!selectedBatchKey && (
                    <div className="w-full">
                      <div className="flex flex-nowrap items-center gap-3 w-full">
                        <div className="relative flex-1 min-w-[240px]">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input
                            value={filters.search}
                            onChange={(e) => {
                              const value = e.target.value;
                              preserveScroll(() => {
                                setFilters(prev => ({ ...prev, search: value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                              });
                            }}
                            placeholder="Search in all fields"
                            className="w-full h-10 rounded-xl border border-gray-200 bg-white/80 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 px-3 h-10 min-w-[320px]">
                          <Calendar size={16} className="text-gray-400" />
                          <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => {
                              const value = e.target.value;
                              preserveScroll(() => {
                                setDateRange((prev) => ({ ...prev, from: value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                              });
                            }}
                            className="text-sm text-gray-700 focus:outline-none bg-transparent"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => {
                              const value = e.target.value;
                              preserveScroll(() => {
                                setDateRange((prev) => ({ ...prev, to: value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                              });
                            }}
                            className="text-sm text-gray-700 focus:outline-none bg-transparent"
                          />
                        </div>
                        <div className="flex items-center h-10 px-3 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-100 text-sm text-gray-700 shadow-sm whitespace-nowrap">
                          <span className="font-semibold text-blue-700">{sortedDisplayLeads.length}</span>
                          <span className="ml-2">record found</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={exportLeadsToCsv}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                    <button
                      onClick={() => setShowFieldSelector(!showFieldSelector)}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                    >
                      <Settings size={16} />
                      Customize Fields
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        fetchLeads();
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Selector - Opens below Customize Fields button */}
            {showFieldSelector && (
              <div className="mt-4 mb-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-lg animate-slideUp">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Settings size={20} className="text-blue-600" />
                    Select Display Fields
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedFields(baseFields)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                    >
                      Reset Fields
                    </button>
                    <button
                      onClick={() => setShowFieldSelector(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableFields.map(field => (
                    <button
                      key={field}
                      onClick={() => toggleField(field)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 flex items-center gap-2 ${
                        selectedFields.includes(field)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {getFieldLabel(field)}
                      {selectedFields.includes(field) && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      {selectedFields.map(field => (
                        <th key={field} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <button 
                            onClick={() => toggleSort(field)} 
                            className="inline-flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
                          >
                            {getFieldLabel(field)}
                            <span className={`text-sm transition-transform duration-200 ${
                              filters.sortBy === field ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                            }`}>
                              {filters.sortBy === field ? (filters.sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </button>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pagedLeads.map((lead, index) => {
                      const leadBatchKey = getLeadBatchKey(lead);
                      const isLatestBatch = latestBatchKey && leadBatchKey === latestBatchKey;
                      const highlightNew = isLatestBatch && lead.isNewLead;
                      const highlightUpdated = isLatestBatch && lead.isUpdatedLead;
                      const displayId = (pagination.page - 1) * pagination.limit + index + 1;
                      return (
                      <tr
                        key={lead._id}
                        onClick={() => setSelectedRowId(lead._id)}
                        className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                          highlightUpdated
                            ? 'bg-yellow-50'
                            : highlightNew
                              ? 'bg-emerald-50'
                              : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/30'
                        } ${selectedRowId === lead._id ? 'ring-2 ring-blue-300 shadow-md' : ''}`}
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        {selectedFields.map(field => {
                          const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
                          const value = field === 'leadId'
                            ? displayId
                            : (latestCustomFields?.[field] ?? lead?.[field] ?? '');
                          const isFieldUpdated = highlightUpdated && Array.isArray(lead.updatedFields) && lead.updatedFields.includes(field);
                          const isUnseen = !viewedRowIds.has(lead._id);
                          return (
                            <td
                              key={field}
                              className={`px-6 py-4 whitespace-nowrap text-sm transition-all duration-200 ${
                                highlightUpdated ? 'bg-yellow-50' : highlightNew ? 'bg-emerald-50' : ''
                              } ${
                                isUnseen ? 'font-semibold text-gray-900' : 'font-normal text-gray-800'
                              }`}
                            >
                              {field === 'attachments' ? (
                                value ? (
                                  <button
                                    onClick={() => handleAttachmentDownload(lead)}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                                  >
                                    Download
                                  </button>
                                ) : (
                                  '-'
                                )
                              ) : (
                                String(value || '-')
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowViewModal(true);
                                setViewedRowIds((prev) => new Set(prev).add(lead._id));
                              }}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowEditModal(true);
                                setViewedRowIds((prev) => new Set(prev).add(lead._id));
                              }}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Edit lead"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(lead._id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Delete lead"
                            >
                              <Trash2 size={16} />
                            </button>
                            {getLeadAttachmentValue(lead) && (
                              <button
                                onClick={() => handleAttachmentDownload(lead)}
                                className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Download attachment"
                              >
                                <Paperclip size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {!selectedBatchKey && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, sortedDisplayLeads.length)} of {sortedDisplayLeads.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-2">
                    <span>Page</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pagination.page}
                      onChange={(e) => {
                        const pageNum = parseInt(e.target.value);
                        if (pageNum >= 1 && pageNum <= totalPages) {
                          setPagination(prev => ({ ...prev, page: pageNum }));
                        }
                      }}
                      onBlur={(e) => {
                        const pageNum = parseInt(e.target.value);
                        if (!pageNum || pageNum < 1) {
                          setPagination(prev => ({ ...prev, page: 1 }));
                        } else if (pageNum > totalPages) {
                          setPagination(prev => ({ ...prev, page: totalPages }));
                        }
                      }}
                      className="w-16 px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{
                        MozAppearance: 'textfield'
                      }}
                    />
                    <span>of {totalPages}</span>
                  </div>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                    disabled={pagination.page === totalPages}
                    className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <div className="relative flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={pagination.limit}
                        onChange={(e) => {
                          const limitNum = parseInt(e.target.value);
                          if (limitNum >= 1 && limitNum <= 1000) {
                            setPagination(prev => ({ ...prev, limit: limitNum, page: 1 }));
                          }
                        }}
                        onBlur={(e) => {
                          const limitNum = parseInt(e.target.value);
                          if (!limitNum || limitNum < 1) {
                            setPagination(prev => ({ ...prev, limit: 10, page: 1 }));
                          } else if (limitNum > 1000) {
                            setPagination(prev => ({ ...prev, limit: 1000, page: 1 }));
                          }
                        }}
                        className="w-20 px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          MozAppearance: 'textfield'
                        }}
                      />
                      <div className="relative">
                        <select
                          value={pagination.limit}
                          onChange={(e) => {
                            setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                          }}
                          className="px-3 py-1 pr-10 rounded border border-gray-200 bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[60px]"
                          style={{ 
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: 'none'
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center justify-center pr-2.5 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* View Modal */}
        {showViewModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Eye className="text-white" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Lead Details</h2>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLead(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200 hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalFields.map((key, index) => {
                    const latest = selectedLead.latestCustomFields || getLatestCustomFields(selectedLead);
                    const value = key === 'leadId'
                      ? (selectedLead.leadId || latest?.leadId || selectedLead.id || '-')
                      : (latest?.[key] ?? (selectedLead as any)?.[key] ?? '-');
                    const isCompanyNotes = key === 'companyNotes';
                    const isAttachments = key === 'attachments';
                    return (
                      <div 
                        key={key} 
                        className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-200 ${isCompanyNotes ? 'md:col-span-2' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wide">
                          {getFieldLabel(key)}
                        </div>
                        {isAttachments ? (
                          value ? (
                            <button
                              onClick={() => handleAttachmentDownload(selectedLead)}
                              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                            >
                              <Download size={16} />
                              Download Attachment
                            </button>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">-</div>
                          )
                        ) : isCompanyNotes ? (
                          <div className="text-sm font-medium text-gray-900 break-words whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {String(value || '-')}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900 break-words">{String(value || '-')}</div>
                        )}
                      </div>
                    );
                  })}
                  {selectedLead.dateAdded && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wide">Date Added</div>
                      <div className="text-sm font-medium text-gray-900">{new Date(selectedLead.dateAdded).toLocaleString()}</div>
                    </div>
                  )}
                  {selectedLead.updatedAt && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wide">Last Updated</div>
                      <div className="text-sm font-medium text-gray-900">{new Date(selectedLead.updatedAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Edit size={16} />
                    Edit Lead
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLead(null);
                  }}
                  className="px-6 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Edit className="text-white" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Edit Lead</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLead(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200 hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-white">
                <EditLeadForm
                  lead={selectedLead}
                  onSave={(updatedData) => handleUpdateLead(selectedLead._id, updatedData)}
                  onCancel={() => {
                    setShowEditModal(false);
                    setSelectedLead(null);
                  }}
                  getFieldLabel={getFieldLabel}
                  modalFields={modalFields}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <AlertCircle className="text-white" size={40} />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  Delete Lead?
                </h3>
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  Are you sure you want to delete this lead? This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-gray-200 font-semibold transform hover:scale-105"
                  >
                    No, Cancel
                  </button>
                  <button
                    onClick={handleDeleteLead}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trash2 size={18} />
                      Yes, Delete
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-20 right-4 z-30 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slideInRight ${
            toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' :
            toast.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
            'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white/20 rounded-lg">
                {toast.type === 'success' && <Check size={20} />}
                {toast.type === 'error' && <X size={20} />}
                {toast.type === 'warning' && <AlertCircle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
              </div>
              <span className="font-semibold">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Lead Form Component
const EditLeadForm: React.FC<{
  lead: Lead;
  onSave: (data: any) => void;
  onCancel: () => void;
  getFieldLabel: (field: string) => string;
  modalFields: string[];
}> = ({ lead, onSave, onCancel, getFieldLabel, modalFields }) => {
  const getLatestCustomFields = (lead: any) => {
    if (Array.isArray(lead?.customFields)) {
      return lead.customFields[lead.customFields.length - 1] || {};
    }
    if (lead?.customFields && typeof lead.customFields === 'object') {
      return lead.customFields;
    }
    return {};
  };

  const [formData, setFormData] = useState<any>(() => {
    const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
    return { ...latestCustomFields };
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      // Handle both lowercase and uppercase field names
      if (field.toLowerCase() === 'attachments') {
        delete newData.Attachments;
        newData.attachments = value;
      } else if (field.toLowerCase() === 'companynotes') {
        delete newData.CompanyNotes;
        newData.companyNotes = value;
      } else {
        newData[field] = value;
      }
      return newData;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadedFileName(file.name);

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Save as data URL or you can upload to server and get URL
        handleChange('attachments', base64String);
        setUploadingFile(false);
      };
      reader.onerror = () => {
        setUploadingFile(false);
        setUploadedFileName(null);
        alert('Error reading file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadingFile(false);
      setUploadedFileName(null);
      alert('Error uploading file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Separate CompanyNotes and Attachments from other fields
  const regularFields = modalFields.filter((key: string) => key !== 'companyNotes' && key !== 'attachments');
  const companyNotes = formData.companyNotes || formData.CompanyNotes || '';
  const attachments = formData.attachments || formData.Attachments || '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {regularFields.length > 0 ? (
          regularFields.map((key: string, index: number) => (
            <div 
              key={key}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-emerald-300"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {getFieldLabel(key)}
              </label>
              <input
                type="text"
                value={key === 'leadId' ? String(lead.leadId || formData[key] || '') : String(formData[key] || '')}
                onChange={(e) => handleChange(key, e.target.value)}
                readOnly={key === 'leadId'}
                className={`w-full px-3 py-1.5 text-sm border-2 rounded-lg transition-all duration-200 ${
                  key === 'leadId'
                    ? 'border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed'
                    : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white'
                }`}
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-500 py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium">No fields available to edit</p>
          </div>
        )}
        
        {/* Attachments Field */}
        {(formData.attachments !== undefined || formData.Attachments !== undefined) && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-emerald-300">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {getFieldLabel('attachments') || 'Attachments'}
            </label>
            
            {/* File Upload Button */}
            <div className="mb-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                  disabled={uploadingFile}
                />
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all duration-200">
                  {uploadingFile ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload File</span>
                    </>
                  )}
                </div>
              </label>
              {uploadedFileName && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-600">
                  <File size={12} />
                  <span>{uploadedFileName}</span>
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="relative">
              <span className="text-xs text-gray-500 mb-1 block">Or enter URL:</span>
              <input
                type="url"
                placeholder="Enter file URL (e.g., https://example.com/file.pdf)"
                value={String(attachments).startsWith('data:') ? '' : String(attachments)}
                onChange={(e) => {
                  handleChange('attachments', e.target.value);
                  setUploadedFileName(null);
                }}
                className="w-full px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>
            
            {/* Show current attachment */}
            {attachments && String(attachments).startsWith('data:') && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <File size={14} />
                  <span>File uploaded (click URL field to change)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* CompanyNotes Field - Bigger and at the end */}
      {(formData.companyNotes !== undefined || formData.CompanyNotes !== undefined) && (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-emerald-300">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {getFieldLabel('companyNotes') || 'Company Notes'}
          </label>
          <textarea
            rows={6}
            value={String(companyNotes)}
            onChange={(e) => handleChange('companyNotes', e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-y"
            placeholder="Enter company notes..."
          />
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={Object.keys(formData).length === 0}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Check size={16} />
            Save Changes
          </div>
        </button>
      </div>
    </form>
  );
};

export default LeadList;