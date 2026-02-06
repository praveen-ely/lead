import React, { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Activity,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Zap,
  Database,
  Settings
} from 'lucide-react';
import UserNavbar from '../components/UserNavbar';

const dashboardStyles = `
  @keyframes pulseZoom {
    0% { transform: scale(1); }
    50% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  .pulse-zoom {
    animation: pulseZoom 1.2s ease-in-out infinite;
    display: inline-block;
  }
  @keyframes expandRow {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .expand-row {
    animation: expandRow 0.25s ease-out;
  }
`;

const UserDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<any>(null);
  const [batchLeads, setBatchLeads] = useState<any[]>([]);
  const [leadBatches, setLeadBatches] = useState<Array<{ key: string; label: string; count: number; newCount: number; updatedCount: number }>>([]);
  const [selectedBatchKey, setSelectedBatchKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSearch, setRecentSearch] = useState('');
  const [recentStatus, setRecentStatus] = useState('');
  const [recentPriority, setRecentPriority] = useState('');
  const [selectedLeadType, setSelectedLeadType] = useState<'new' | 'updated' | 'thisMonth' | null>(null);
  const [recentSortBy, setRecentSortBy] = useState('leadId');
  const [recentSortOrder, setRecentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [recentPage, setRecentPage] = useState(1);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showRecentFieldSelector, setShowRecentFieldSelector] = useState(false);
  const [availableRecentFields, setAvailableRecentFields] = useState<string[]>([]);
  const allowedRecentFields = [
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
  const hiddenRecentFields = new Set(['id']);
  const [expandedBatchDate, setExpandedBatchDate] = useState<string | null>(null);
  const fixedRecentFields = [
    'leadId',
    'companyName',
    'website',
    'companyType',
    'foundedYear'
  ];
  const [selectedRecentFields, setSelectedRecentFields] = useState<string[]>(fixedRecentFields);
  const recentPageSize = 10;
  const navigate = useNavigate();
  const fetchingStatsRef = useRef(false);
  const fetchingBatchesRef = useRef(false);
  const mountedRef = useRef(false);
  const lastRateLimitRef = useRef<number>(0);
  const initialLoadStartRef = useRef<number | null>(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  })();
  const userId = currentUser?._id;

  // Helper functions (needed by fetch functions)
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

  const getLeadTimestamp = (lead: any, mode: 'created' | 'updated' | 'auto' = 'auto') => {
    const history = getCustomFieldsHistory(lead);
    const isUpdated = history.length > 1;
    if (mode === 'updated') return lead.updatedAt || lead.dateAdded || lead.createdAt;
    if (mode === 'created') return lead.dateAdded || lead.createdAt || lead.updatedAt;
    return isUpdated ? (lead.updatedAt || lead.dateAdded || lead.createdAt) : (lead.dateAdded || lead.createdAt || lead.updatedAt);
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

  const handleAttachmentDownload = (attachmentValue: string) => {
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
    }
  };

  const getLeadBatchKey = (lead: any) => {
    const dateValue = getLeadTimestamp(lead, 'auto');
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

  const normalizeLead = (lead: any) => {
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
    const isUpdatedLead = history.length > 1;
    const isNewLead = history.length <= 1;
    const leadData = { ...(lead?.data || {}), ...(latestCustomFields || {}) };
    const statusValue = (lead.status || leadData.status || '').toString();
    const priorityValue = (lead.priority || leadData.priority || '').toString();
    const priorityLevelValue = (leadData.priorityLevel || leadData.priority || lead.priority || '').toString();

    const formatLabel = (value: string) => {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    return {
      ...lead,
      customFields: latestCustomFields,
      customFieldsHistory: history,
      latestCustomFields,
      updatedFields,
      isUpdatedLead,
      isNewLead,
      leadId: lead.leadId || leadData.leadId || leadData.id || lead.id || '',
      id: leadData.id || leadData.Id || leadData.ID || leadData.uid || lead.leadId || lead.id || '',
      companyName: leadData.companyName || lead.company || leadData.company || '',
      website: lead.website || leadData.website || '',
      companyType: lead.companyType || leadData.companyType || '',
      industry: leadData.industry || '',
      foundedYear: leadData.foundedYear || '',
      headquarters: leadData.headquarters || '',
      revenueRangeCr: leadData.revenueRangeCr || '',
      leadStatus: formatLabel(lead.leadStatus || leadData.leadStatus || leadData.status || statusValue),
      priorityLevel: formatLabel(lead.priorityLevel || leadData.priorityLevel || priorityLevelValue || priorityValue)
    };
  };

  // Define fetch functions before useEffect
  const fetchUserStats = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingStatsRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        console.warn('Skipping stats fetch - rate limit was hit recently');
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

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
      return;
    }

    try {
      fetchingStatsRef.current = true;
      const response = await fetch(`/api/user-preferences/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 429) {
        console.warn('Rate limited - skipping stats fetch. Will retry after 60 seconds.');
        lastRateLimitRef.current = Date.now(); // Record rate limit time
        fetchingStatsRef.current = false; // Reset immediately
        // Don't show error to user, just skip silently
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (!errorText.includes('Too many')) {
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
        fetchingStatsRef.current = false; // Reset on error
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserStats(data.data);
      }
    } catch (error: any) {
      // Don't log 429 errors
      if (!error.message?.includes('429') && !error.message?.includes('Too many')) {
        console.error('Error fetching user stats:', error);
      }
      fetchingStatsRef.current = false; // Reset on catch
    } finally {
      // Only delay reset if successful, otherwise reset immediately
      if (fetchingStatsRef.current) {
        setTimeout(() => {
          fetchingStatsRef.current = false;
        }, 2000); // Longer delay for successful calls
      }
    }
  }, []);

  const fetchLeadBatches = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingBatchesRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        console.warn('Skipping batches fetch - rate limit was hit recently');
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

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
      return;
    }

    try {
      fetchingBatchesRef.current = true;
      // Only show loading on initial mount, not on refresh
      if (!mountedRef.current) {
        setLoading(true);
      }
      const response = await fetch(`/api/leads?limit=200&page=1&includeAll=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 429) {
        console.warn('Rate limited - skipping batches fetch. Will retry after 60 seconds.');
        lastRateLimitRef.current = Date.now(); // Record rate limit time
        fetchingBatchesRef.current = false; // Reset immediately
        setLoading(false);
        // Don't show error to user, just skip silently
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (!errorText.includes('Too many')) {
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
        fetchingBatchesRef.current = false; // Reset on error
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        const normalized = data.data.map(normalizeLead);
        setBatchLeads(normalized);

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
              !hiddenRecentFields.has(key) &&
              allowedRecentFields.includes(key)
            ) {
              extraFields.add(key);
            }
          });
        });
        const allFields = Array.from(new Set([...fixedRecentFields, ...Array.from(extraFields)]))
          .filter((field) => !hiddenRecentFields.has(field) && allowedRecentFields.includes(field));
        setAvailableRecentFields(allFields);
        setSelectedRecentFields((prev) => {
          const next = prev.filter((field) => allFields.includes(field));
          return next.length ? next : fixedRecentFields;
        });

        const batchMap: Record<string, { key: string; label: string; count: number; newCount: number; updatedCount: number }> = {};
        normalized.forEach((lead: any) => {
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
      }
    } catch (error: any) {
      // Don't log 429 errors
      if (!error.message?.includes('429') && !error.message?.includes('Too many')) {
        console.error('Error fetching lead batches:', error);
      }
      fetchingBatchesRef.current = false; // Reset on catch
    } finally {
      const finishLoading = () => {
        setLoading(false);
        initialLoadStartRef.current = null;
      };
      if (initialLoadStartRef.current) {
        const elapsed = Date.now() - initialLoadStartRef.current;
        const remaining = 500 - elapsed;
        if (remaining > 0) {
          setTimeout(finishLoading, remaining);
        } else {
          finishLoading();
        }
      } else {
        setLoading(false);
      }
      // Only delay reset if successful, otherwise already reset
      if (fetchingBatchesRef.current) {
        setTimeout(() => {
          fetchingBatchesRef.current = false;
        }, 2000); // Longer delay for successful calls
      }
    }
  }, []);

  useEffect(() => {
    // CRITICAL: Check mountedRef FIRST before any operations
    if (mountedRef.current) {
      // Already mounted - just refresh data without showing loading
      const token = localStorage.getItem('token');
      const user = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
          return null;
        }
      })();

      if (!token || !user || user?.role !== 'user') {
        navigate('/login');
        return;
      }

      // Refresh data silently without showing loading state
      if (!fetchingStatsRef.current && lastRateLimitRef.current === 0) {
        fetchUserStats();
      }
      if (!fetchingBatchesRef.current && lastRateLimitRef.current === 0) {
        fetchLeadBatches();
      }
      return;
    }
    mountedRef.current = true; // Mark as mounted immediately

    const token = localStorage.getItem('token');
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch (error) {
        return null;
      }
    })();

    if (!token || !user || user?.role !== 'user') {
      navigate('/login');
      return;
    }

    // Ensure initial loading shows for at least 0.5s on first render
    setLoading(true);
    initialLoadStartRef.current = Date.now();

    // Reset rate limit ref on mount if it's been more than 60 seconds
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit >= 60000) {
        lastRateLimitRef.current = 0; // Reset if enough time has passed
      } else {
        // Still rate limited - don't make any calls
        console.warn('Rate limit still active, skipping initial fetch');
        const elapsed = Date.now() - (initialLoadStartRef.current || Date.now());
        const remaining = 500 - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
            initialLoadStartRef.current = null;
          }, remaining);
        } else {
          setLoading(false);
          initialLoadStartRef.current = null;
        }
        return;
      }
    }

    // Stagger API calls to prevent simultaneous requests
    // This helps when multiple components mount at once
    setTimeout(() => {
      if (!fetchingStatsRef.current && lastRateLimitRef.current === 0) {
        fetchUserStats();
      }
    }, 100); // Small delay for stats

    setTimeout(() => {
      if (!fetchingBatchesRef.current && lastRateLimitRef.current === 0) {
        fetchLeadBatches();
      }
    }, 300); // Slightly longer delay for batches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - empty deps

  useEffect(() => {
    setRecentPage(1);
  }, [recentSearch, recentStatus, recentPriority, recentSortBy, recentSortOrder, showAllRecent]);

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

  const preserveScroll = (action: () => void) => {
    const scrollY = window.scrollY;
    action();
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY });
    });
  };

  const toggleRecentSort = (field: string) => {
    preserveScroll(() => {
      setRecentSortBy((prev) => {
        if (prev !== field) {
          setRecentSortOrder('asc');
          return field;
        }
        setRecentSortOrder(recentSortOrder === 'asc' ? 'desc' : 'asc');
        return prev;
      });
    });
  };

  const clearRecentFilters = () => {
    setRecentSearch('');
    setRecentStatus('');
    setRecentPriority('');
    setRecentSortBy('leadId');
    setRecentSortOrder('asc');
    setRecentPage(1);
    setSelectedLeadType(null);
  };

  const getRecentFieldLabel = (field: string) => {
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

  const parseLeadId = (value: string) => {
    const match = value.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return null;
    return { prefix: match[1], num: parseInt(match[2], 10) };
  };

  const getSortValue = (lead: any, field: string) => {
    const latestCustomFields = Array.isArray(lead?.customFields)
      ? lead.customFields[lead.customFields.length - 1] || {}
      : (lead?.customFields || {});
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

  const filteredRecent = useMemo(() => {
    const baseList = selectedBatchKey
      ? (selectedBatchKey === 'all' ? batchLeads : batchLeads.filter((lead) => getLeadBatchKey(lead) === selectedBatchKey))
      : batchLeads;

    let leadTypeFiltered = baseList;
    if (selectedLeadType === 'new') {
      leadTypeFiltered = baseList.filter((lead) => lead.isNewLead);
    } else if (selectedLeadType === 'updated') {
      leadTypeFiltered = baseList.filter((lead) => lead.isUpdatedLead);
    } else if (selectedLeadType === 'thisMonth') {
      leadTypeFiltered = baseList.filter((lead) => {
        const dateValue = lead.isUpdatedLead
          ? (lead.updatedAt || lead.dateUpdated || lead.dateAdded || lead.createdAt)
          : (lead.dateAdded || lead.createdAt || lead.updatedAt);
        return isThisMonth(dateValue);
      });
    }

    return leadTypeFiltered.filter((lead) => {
      if (recentStatus) {
        const statusValue = (lead.leadStatus || lead.latestCustomFields?.leadStatus || lead.latestCustomFields?.status || '')
          .toString()
          .trim()
          .toLowerCase();
        if (statusValue !== recentStatus.toLowerCase().trim()) return false;
      }
      if (recentPriority) {
        const priorityValue = (lead.priorityLevel || lead.latestCustomFields?.priorityLevel || lead.latestCustomFields?.priority || '')
          .toString()
          .trim()
          .toLowerCase();
        if (priorityValue !== recentPriority.toLowerCase().trim()) return false;
      }
      if (recentSearch) {
        const searchValue = recentSearch.toLowerCase().trim();
        const flatFields = {
          ...lead,
          ...lead.latestCustomFields
        };
        const matches = Object.values(flatFields).some((value) => String(value || '').toLowerCase().includes(searchValue));
        if (!matches) return false;
      }
      return true;
    });
  }, [batchLeads, recentSearch, recentStatus, recentPriority, selectedBatchKey, selectedLeadType]);

  const sortedRecent = recentSortBy
    ? [...filteredRecent].sort((a, b) => {
        const dir = recentSortOrder === 'asc' ? 1 : -1;
        const av = getSortValue(a, recentSortBy);
        const bv = getSortValue(b, recentSortBy);
        if (recentSortBy === 'leadId') {
          const aId = parseLeadId(String(av));
          const bId = parseLeadId(String(bv));
          if (aId && bId) {
            if (aId.prefix !== bId.prefix) return aId.prefix < bId.prefix ? -1 * dir : 1 * dir;
            if (aId.num !== bId.num) return aId.num < bId.num ? -1 * dir : 1 * dir;
            return 0;
          }
        }
        return compareValues(av, bv, dir);
      })
    : filteredRecent;

  const recentTotalPages = Math.max(1, Math.ceil(sortedRecent.length / recentPageSize));
  const pagedRecent = sortedRecent.slice((recentPage - 1) * recentPageSize, recentPage * recentPageSize);
  const latestBatchKey = leadBatches[0]?.key || null;

  // Memoized stat tiles component
  const StatTiles = memo(({ 
    batchLeads, 
    selectedLeadType, 
    onTileClick, 
    isThisMonth 
  }: { 
    batchLeads: any[]; 
    selectedLeadType: 'new' | 'updated' | 'thisMonth' | null; 
    onTileClick: (type: 'new' | 'updated' | 'thisMonth' | null) => void;
    isThisMonth: (dateValue: any) => boolean;
  }) => {
    const totalLeads = batchLeads.length;
    const newLeads = useMemo(() => batchLeads.filter(l => l.isNewLead).length, [batchLeads]);
    const updatedLeads = useMemo(() => batchLeads.filter(l => l.isUpdatedLead).length, [batchLeads]);
    const thisMonthLeads = useMemo(() => batchLeads.filter(l => {
      const dateValue = l.isUpdatedLead
        ? (l.updatedAt || l.dateUpdated || l.dateAdded || l.createdAt)
        : (l.dateAdded || l.createdAt || l.updatedAt);
      return isThisMonth(dateValue);
    }).length, [batchLeads, isThisMonth]);

    return (
      <div className="flex flex-wrap gap-4 mb-8">
        <div 
          onClick={() => onTileClick(null)}
          className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-indigo-500 to-purple-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === null ? 'ring-4 ring-indigo-300 ring-offset-2' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-90">Total Leads</div>
              <div className="text-2xl font-semibold mt-1">{totalLeads}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/20">
              <Database size={20} />
            </div>
          </div>
        </div>
        <div 
          onClick={() => onTileClick('new')}
          className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-emerald-500 to-teal-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'new' ? 'ring-4 ring-emerald-300 ring-offset-2' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-90">New Leads</div>
              <div className="text-2xl font-semibold mt-1">{newLeads}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/20">
              <Zap size={20} />
            </div>
          </div>
        </div>
        <div 
          onClick={() => onTileClick('updated')}
          className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-blue-500 to-cyan-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'updated' ? 'ring-4 ring-blue-300 ring-offset-2' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-90">Updated Leads</div>
              <div className="text-2xl font-semibold mt-1">{updatedLeads}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/20">
              <RefreshCw size={20} />
            </div>
          </div>
        </div>
        <div 
          onClick={() => onTileClick('thisMonth')}
          className={`min-w-[140px] flex-1 rounded-xl shadow px-5 py-4 text-white bg-gradient-to-r from-amber-500 to-yellow-500 cursor-pointer transition-all hover:scale-105 ${selectedLeadType === 'thisMonth' ? 'ring-4 ring-amber-300 ring-offset-2' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-90">This Month</div>
              <div className="text-2xl font-semibold mt-1">{thisMonthLeads}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/20">
              <Calendar size={20} />
            </div>
          </div>
        </div>
      </div>
    );
  });
  StatTiles.displayName = 'StatTiles';

  // Memoized batches table component
  const BatchesTable = memo(({ 
    leadBatches, 
    selectedBatchKey, 
    onBatchSelect, 
    onNewClick, 
    onUpdatedClick,
    expandedDate,
    onToggleDate
  }: { 
    leadBatches: Array<{ key: string; label: string; count: number; newCount: number; updatedCount: number }>; 
    selectedBatchKey: string | null; 
    onBatchSelect: (key: string) => void;
    onNewClick: () => void;
    onUpdatedClick: () => void;
    expandedDate: string | null;
    onToggleDate: (dateKey: string) => void;
  }) => {
    const getDateKey = (batchKey: string) => {
      if (!batchKey || batchKey === 'unknown') return 'unknown';
      return batchKey.slice(0, 10);
    };

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
    groupedList.forEach((group) => {
      group.items.sort((a, b) => b.key.localeCompare(a.key));
    });

    return (
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Lead Batches (Last 3 Days)</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedList.length > 0 ? (
                groupedList.map((group) => (
                  <React.Fragment key={group.dateKey}>
                    <tr
                      className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => onToggleDate(group.dateKey)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {group.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-700">{group.newCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-700">{group.updatedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {expandedDate === group.dateKey ? 'Hide' : 'View'}
                      </td>
                    </tr>
                    {expandedDate === group.dateKey &&
                      group.items.map((batch: { key: string; label: string; count: number; newCount: number; updatedCount: number }) => (
                        <tr key={batch.key} className={`expand-row hover:bg-gray-50 ${selectedBatchKey === batch.key ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNewClick();
                              }}
                              className="hover:underline"
                            >
                              {batch.newCount}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdatedClick();
                              }}
                              className="hover:underline"
                            >
                              {batch.updatedCount}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onBatchSelect(batch.key);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View Leads
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No batches available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
  BatchesTable.displayName = 'BatchesTable';

  // Memoized callback functions
  const handleTileClick = useCallback((type: 'new' | 'updated' | 'thisMonth' | null) => {
    setSelectedLeadType(type);
    setRecentPage(1);
  }, []);

  const handleBatchSelect = useCallback((key: string) => {
    setSelectedBatchKey(key);
  }, []);

  const handleNewClick = useCallback(() => {
    setSelectedBatchKey('all');
    setSelectedLeadType((prev) => (prev === 'new' ? null : 'new'));
  }, []);

  const handleUpdatedClick = useCallback(() => {
    setSelectedBatchKey('all');
    setSelectedLeadType((prev) => (prev === 'updated' ? null : 'updated'));
  }, []);

  const handleToggleBatchDate = useCallback((dateKey: string) => {
    setExpandedBatchDate((prev) => (prev === dateKey ? null : dateKey));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{dashboardStyles}</style>
      <UserNavbar userName={currentUser?.firstName || ''} onLogout={() => navigate('/login')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* Colorful Stats Tiles */}
            <StatTiles 
              batchLeads={batchLeads}
              selectedLeadType={selectedLeadType}
              onTileClick={handleTileClick}
              isThisMonth={isThisMonth}
            />

            <BatchesTable 
              leadBatches={leadBatches}
              selectedBatchKey={selectedBatchKey}
              onBatchSelect={handleBatchSelect}
              onNewClick={handleNewClick}
              onUpdatedClick={handleUpdatedClick}
              expandedDate={expandedBatchDate}
              onToggleDate={handleToggleBatchDate}
            />

            <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedBatchKey ? 'Batch Leads' : 'Recent Leads'}
              </h2>
              {!selectedBatchKey && (
                <div className="flex items-center gap-3">
                  
                  <button
                    onClick={() => setShowRecentFieldSelector((prev) => !prev)}
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Customize Fields
                  </button>
                </div>
              )}
            </div>
            {showRecentFieldSelector && !selectedBatchKey && (
              <div className="mb-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Settings size={20} className="text-blue-600" />
                    Select Display Fields
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedRecentFields(fixedRecentFields)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                    >
                      Reset Fields
                    </button>
                    <button
                      onClick={() => setShowRecentFieldSelector(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableRecentFields.map((field) => (
                    <button
                      key={field}
                      onClick={() => {
                        if (fixedRecentFields.includes(field)) return;
                        setSelectedRecentFields((prev) =>
                          prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
                        );
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                        selectedRecentFields.includes(field)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {getRecentFieldLabel(field)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!selectedBatchKey && (
              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    value={recentSearch}
                    onChange={(event) =>
                      preserveScroll(() => setRecentSearch(event.target.value))
                    }
                    placeholder="Search in all fields"
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <select
                    value={recentStatus}
                    onChange={(event) =>
                      preserveScroll(() => setRecentStatus(event.target.value))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    style={{ 
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: 'none'
                    }}
                  >
                    <option value="">All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={recentPriority}
                    onChange={(event) =>
                      preserveScroll(() => setRecentPriority(event.target.value))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    style={{ 
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: 'none'
                    }}
                  >
                    <option value="">All Priorities</option>
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={clearRecentFilters}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-blue-600" size={28} />
              <span className="ml-3 text-gray-600">Loading leads...</span>
            </div>
          ) : (
            <>
              <div className={`overflow-x-auto bg-red-50 ${showAllRecent && !selectedBatchKey ? 'max-h-[520px] overflow-y-auto' : ''}`}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedRecentFields.map((field) => (
                        <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button onClick={() => toggleRecentSort(field)} className="inline-flex items-center gap-1 hover:text-gray-700">
                            {getRecentFieldLabel(field)}
                            <span className="text-[10px]">
                              {recentSortBy === field ? (recentSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedBatchKey ? filteredRecent : pagedRecent).length > 0 ? (
                      (selectedBatchKey ? filteredRecent : pagedRecent).map((lead) => {
                        const leadBatchKey = getLeadBatchKey(lead);
                        const isLatestBatch = latestBatchKey && leadBatchKey === latestBatchKey;
                        const highlightNew = isLatestBatch && lead.isNewLead;
                        const highlightUpdated = isLatestBatch && lead.isUpdatedLead;
                        return (
                      <tr
                        key={lead._id}
                        className={`${highlightUpdated ? 'bg-red-50' : highlightNew ? 'bg-emerald-100' : ''} hover:bg-gray-50`}
                      >
                            {selectedRecentFields.map((field) => {
                              const latestCustomFields = lead.latestCustomFields || getLatestCustomFields(lead);
                              const value = latestCustomFields?.[field] ?? lead?.[field] ?? '';
                          const isFieldUpdated = highlightUpdated;
                              return (
                            <td
                              key={field}
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isFieldUpdated ? 'font-semibold text-gray-900' : 'text-gray-900'
                              }`}
                            >
                              {field === 'attachments' ? (
                                value ? (
                                  <button
                                    onClick={() => handleAttachmentDownload(String(value))}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                                  >
                                    Download
                                  </button>
                                ) : (
                                  '-'
                                )
                              ) : isFieldUpdated ? (
                                <span className="pulse-zoom">{String(value || '')}</span>
                              ) : (
                                String(value || '')
                              )}
                            </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={selectedRecentFields.length} className="px-6 py-4 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="text-gray-400 mb-2" size={32} />
                            <p>No leads found matching your preferences</p>
                            <button
                              onClick={() => navigate('/preferences')}
                              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Set Preferences to See Leads
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!selectedBatchKey && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {(recentPage - 1) * recentPageSize + 1}-{Math.min(recentPage * recentPageSize, sortedRecent.length)} of {sortedRecent.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRecentPage((prev) => Math.max(1, prev - 1))}
                      disabled={recentPage === 1}
                      className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span>Page {recentPage} of {recentTotalPages}</span>
                    <button
                      onClick={() => setRecentPage((prev) => Math.min(recentTotalPages, prev + 1))}
                      disabled={recentPage === recentTotalPages}
                      className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setShowAllRecent((prev) => !prev)}
                      className="px-3 py-1 rounded border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {showAllRecent ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
