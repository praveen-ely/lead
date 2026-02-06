import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  Briefcase, 
  Target, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  TrendingUp,
  Bell,
  Settings,
  Filter,
  Sparkles,
  BarChart3,
  Globe,
  Building2,
  Zap,
  Info,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import UserNavbar from '../components/UserNavbar';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

interface UserPreference {
  _id: string;
  userId: string;
  preferences: {
    geographic: {
      cities: string[];
      states: string[];
      countries: string[];
      radius: number;
    };
    business: {
      industries: string[];
      companySizes: string[];
      revenueRanges: string[];
    };
    triggers: {
      events: string[];
      keywords: string[];
      technologies: string[];
    };
    scoring: {
      enabled: boolean;
      weights: {
        industry: number;
        size: number;
        location: number;
        technology: number;
        triggers: number;
        revenue: number;
      };
    };
    notifications: {
      email: boolean;
      browser: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    };
  };
  createdAt: string;
  updatedAt: string;
}

const UserPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [availableOptions, setAvailableOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('preferences');
  const [searchFilters, setSearchFilters] = useState({
    city: '',
    industry: '',
    companySize: '',
    revenue: '',
    triggerEvent: '',
    state: '',
    country: '',
    keyword: '',
    technology: ''
  });
  const fetchingPrefsRef = useRef(false);
  const fetchingOptionsRef = useRef(false);
  const mountedRef = useRef(false);
  const lastRateLimitRef = useRef<number>(0);
  const normalizeOption = (value: string): string => value.replace(/,+\s*$/, '').trim();
  const sanitizeOptions = (options: string[]) =>
    Array.from(
      new Set(
        options
          .filter((option) => typeof option === 'string')
          .map((option) => normalizeOption(option))
          .filter((option) => option && option.toLowerCase() !== 'undefined' && option.toLowerCase() !== 'null')
          .filter((option) => !/^\d+$/.test(option))
      )
    ).sort();
  const libraryCountries = useMemo(() => Country.getAllCountries(), []);
  const countryCodeByName = useMemo(() => {
    const map = new Map<string, string>();
    libraryCountries.forEach((country) => {
      if (country?.name && country?.isoCode) {
        map.set(country.name, country.isoCode);
      }
    });
    return map;
  }, [libraryCountries]);
  const countryOptions = useMemo(() => {
    const base = Array.isArray(availableOptions?.countries) ? availableOptions.countries : [];
    const library = libraryCountries.map((country) => country.name).filter(Boolean);
    return sanitizeOptions([...library, ...base]);
  }, [availableOptions?.countries, libraryCountries]);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  })();

  useEffect(() => {
    // Prevent multiple mounts
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;

    const token = localStorage.getItem('token');
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch (error) {
        return null;
      }
    })();

    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Reset rate limit ref on mount if it's been more than 60 seconds
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit >= 60000) {
        lastRateLimitRef.current = 0;
      } else {
        // Still rate limited - don't make calls
        console.warn('Rate limit still active, skipping preferences fetch');
        return;
      }
    }

    // Stagger API calls to prevent simultaneous requests
    setTimeout(() => {
      if (!fetchingPrefsRef.current && lastRateLimitRef.current === 0) {
        fetchPreferences();
      }
    }, 200); // Delay for preferences

    setTimeout(() => {
      if (!fetchingOptionsRef.current && lastRateLimitRef.current === 0) {
        fetchAvailableOptions();
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchPreferences = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingPrefsRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        console.warn('Skipping preferences fetch - rate limit was hit recently');
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'Authentication required. Please login.');
      return;
    }

    try {
      fetchingPrefsRef.current = true;
      setLoading(true);
      
      // Get current user ID
      const userId = currentUser?._id;
      if (!userId) {
        showToast('error', 'User ID not found. Please login again.');
        fetchingPrefsRef.current = false;
        setLoading(false);
        return;
      }

      // Try to fetch from user-preferences endpoint first
      const prefsResponse = await fetch(`${API_BASE_URL}/user-preferences/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (prefsResponse.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        fetchingPrefsRef.current = false;
        setLoading(false);
        return;
      }

      if (prefsResponse.status === 429) {
        console.warn('Rate limited - skipping preferences fetch');
        lastRateLimitRef.current = Date.now();
        fetchingPrefsRef.current = false;
        setLoading(false);
        return;
      }

      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        if (prefsData.success && prefsData.data) {
          setPreferences(prefsData.data);
          fetchingPrefsRef.current = false;
          setLoading(false);
          return;
        }
      }

      // If user-preferences doesn't exist, create defaults directly (no profile call)
      if (prefsResponse.status === 404) {
        const defaultPrefs = createDefaultPreferences(userId);
        const saveResponse = await fetch(`${API_BASE_URL}/user-preferences/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ preferences: defaultPrefs.preferences }),
        });

        if (saveResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        const saveData = await saveResponse.json();
        if (saveData.success && saveData.data) {
          setPreferences(saveData.data);
          fetchingPrefsRef.current = false;
          setLoading(false);
          return;
        }

        showToast('error', saveData.message || 'Failed to save preferences');
      } else if (!prefsResponse.ok) {
        const errorText = await prefsResponse.text();
        if (!errorText.includes('Too many')) {
          showToast('error', 'Failed to load preferences');
        }
      }
    } catch (err: any) {
      // Don't show error for 429 or network errors
      if (!err.message?.includes('429') && !err.message?.includes('Too many') && !err.message?.includes('Failed to fetch')) {
        showToast('error', 'Failed to load preferences');
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        fetchingPrefsRef.current = false;
      }, 1000);
    }
  }, [currentUser]);

  const fetchAvailableOptions = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingOptionsRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        console.warn('Skipping options fetch - rate limit was hit recently');
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

    try {
      fetchingOptionsRef.current = true;
      const response = await fetch(`${API_BASE_URL}/user-preferences/options`, {
        cache: 'no-cache',
      });

      if (response.status === 429) {
        console.warn('Rate limited - skipping options fetch');
        lastRateLimitRef.current = Date.now();
        fetchingOptionsRef.current = false;
        return;
      }

      if (!response.ok) {
        fetchingOptionsRef.current = false;
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setAvailableOptions(data.data);
      }
    } catch (err: any) {
      // Don't log 429 errors
      if (!err.message?.includes('429') && !err.message?.includes('Too many') && !err.message?.includes('Failed to fetch')) {
        console.error('Failed to fetch options:', err);
      }
      fetchingOptionsRef.current = false;
    } finally {
      // Reset fetching ref after a delay
      if (fetchingOptionsRef.current) {
        setTimeout(() => {
          fetchingOptionsRef.current = false;
        }, 1000);
      }
    }
  }, []);

  const createDefaultPreferences = (userId: string): UserPreference => {
    return {
      _id: userId,
      userId: userId,
      preferences: {
        geographic: {
          cities: [],
          states: [],
          countries: [],
          radius: 50
        },
        business: {
          industries: [],
          companySizes: [],
          revenueRanges: []
        },
        triggers: {
          events: [],
          keywords: [],
          technologies: []
        },
        scoring: {
          enabled: false,
          weights: {
            industry: 25,
            size: 25,
            location: 15,
            technology: 20,
            triggers: 15,
            revenue: 5
          }
        },
        notifications: {
          email: true,
          browser: true,
          frequency: 'daily'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const savePreferences = async (prefsToSave?: UserPreference) => {
    const preferencesData = prefsToSave || preferences;
    
    if (!preferencesData) {
      showToast('error', 'No preferences to save');
      return;
    }

    try {
      const geoValidationError = validateGeoSelection(preferencesData);
      if (geoValidationError) {
        showToast('warning', geoValidationError);
        return;
      }

      setSaving(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('error', 'Authentication required. Please login.');
        return;
      }
      
      // Get current user ID
      const userId = currentUser?._id;
      if (!userId) {
        showToast('error', 'User ID not found. Please login again.');
        return;
      }

      const dataToSave = {
        preferences: {
          geographic: {
            cities: preferencesData.preferences.geographic.cities || [],
            states: preferencesData.preferences.geographic.states || [],
            countries: preferencesData.preferences.geographic.countries || [],
            radius: preferencesData.preferences.geographic.radius || 50
          },
          business: {
            industries: preferencesData.preferences.business.industries || [],
            companySizes: preferencesData.preferences.business.companySizes || [],
            revenueRanges: preferencesData.preferences.business.revenueRanges || []
          },
          triggers: {
            events: preferencesData.preferences.triggers.events || [],
            keywords: preferencesData.preferences.triggers.keywords || [],
            technologies: preferencesData.preferences.triggers.technologies || []
          },
          scoring: {
            enabled: preferencesData.preferences.scoring.enabled || false,
            weights: {
              industry: preferencesData.preferences.scoring.weights.industry || 25,
              size: preferencesData.preferences.scoring.weights.size || 25,
              location: preferencesData.preferences.scoring.weights.location || 15,
              technology: preferencesData.preferences.scoring.weights.technology || 20,
              triggers: preferencesData.preferences.scoring.weights.triggers || 15,
              revenue: preferencesData.preferences.scoring.weights.revenue || 5
            }
          },
          notifications: {
            email: preferencesData.preferences.notifications?.email || true,
            browser: preferencesData.preferences.notifications?.browser || true,
            frequency: preferencesData.preferences.notifications?.frequency || 'daily'
          }
        }
      };

      const response = await fetch(`${API_BASE_URL}/user-preferences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        const citiesCount = dataToSave.preferences.geographic.cities.length;
        const industriesCount = dataToSave.preferences.business.industries.length;
        const triggersCount = dataToSave.preferences.triggers.events.length;
        const scoringEnabled = dataToSave.preferences.scoring.enabled;
        
        let successMessage = 'Preferences saved successfully!';
        
        if (citiesCount > 0 || industriesCount > 0 || triggersCount > 0) {
          const details = [];
          if (citiesCount > 0) details.push(`${citiesCount} cities`);
          if (industriesCount > 0) details.push(`${industriesCount} industries`);
          if (triggersCount > 0) details.push(`${triggersCount} triggers`);
          if (scoringEnabled) details.push('scoring enabled');
          
          successMessage += ` (${details.join(', ')})`;
        }
        
        showToast('success', successMessage);
        
        // Refresh preferences after save
        await fetchPreferences();
      } else {
        showToast('error', data.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (path: string, value: any) => {
    if (!preferences) return;
    
    const keys = path.split('.');
    const newPreferences = { ...preferences };
    let current: any = newPreferences.preferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setPreferences(newPreferences);
  };

  const formatList = (items?: string[], maxDisplay = 3) => {
    if (!items || items.length === 0) return 'None';
    if (items.length <= maxDisplay) return items.join(', ');
    return `${items.slice(0, maxDisplay).join(', ')} +${items.length - maxDisplay} more`;
  };

  // City to State mapping for India (comprehensive list)
  const cityToStateMap: { [key: string]: string } = {
    // Maharashtra
    'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Nagpur': 'Maharashtra', 'Thane': 'Maharashtra',
    'Nashik': 'Maharashtra', 'Aurangabad': 'Maharashtra', 'Solapur': 'Maharashtra', 'Kalyan': 'Maharashtra',
    'Vasai-Virar': 'Maharashtra', 'Navi Mumbai': 'Maharashtra', 'Amravati': 'Maharashtra', 'Malegaon': 'Maharashtra',
    'Jalgaon': 'Maharashtra', 'Bhiwandi': 'Maharashtra', 'Parbhani': 'Maharashtra',
    // Karnataka
    'Bangalore': 'Karnataka', 'Bengaluru': 'Karnataka', 'Hubli': 'Karnataka', 'Mysore': 'Karnataka',
    'Belagavi': 'Karnataka', 'Mangalore': 'Karnataka',
    // Tamil Nadu
    'Chennai': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu', 'Madurai': 'Tamil Nadu', 'Tiruchirappalli': 'Tamil Nadu',
    'Salem': 'Tamil Nadu', 'Tirunelveli': 'Tamil Nadu', 'Tirupati': 'Tamil Nadu',
    // West Bengal
    'Kolkata': 'West Bengal', 'Howrah': 'West Bengal', 'Kharagpur': 'West Bengal', 'Bardhaman': 'West Bengal',
    'Maheshtala': 'West Bengal',
    // Gujarat
    'Ahmedabad': 'Gujarat', 'Surat': 'Gujarat', 'Vadodara': 'Gujarat', 'Rajkot': 'Gujarat',
    // Rajasthan
    'Jaipur': 'Rajasthan', 'Jodhpur': 'Rajasthan', 'Kota': 'Rajasthan', 'Udaipur': 'Rajasthan',
    'Bharatpur': 'Rajasthan', 'Morena': 'Rajasthan',
    // Uttar Pradesh
    'Lucknow': 'Uttar Pradesh', 'Kanpur': 'Uttar Pradesh', 'Agra': 'Uttar Pradesh', 'Varanasi': 'Uttar Pradesh',
    'Meerut': 'Uttar Pradesh', 'Allahabad': 'Uttar Pradesh', 'Bareilly': 'Uttar Pradesh', 'Moradabad': 'Uttar Pradesh',
    'Aligarh': 'Uttar Pradesh', 'Ghaziabad': 'Uttar Pradesh', 'Raebareli': 'Uttar Pradesh', 'Mathura': 'Uttar Pradesh',
    // Madhya Pradesh
    'Indore': 'Madhya Pradesh', 'Bhopal': 'Madhya Pradesh', 'Gwalior': 'Madhya Pradesh', 'Jabalpur': 'Madhya Pradesh',
    'Khandwa': 'Madhya Pradesh',
    // Andhra Pradesh
    'Visakhapatnam': 'Andhra Pradesh', 'Vijayawada': 'Andhra Pradesh', 'Nellore': 'Andhra Pradesh',
    // Telangana
    'Hyderabad': 'Telangana',
    // Bihar
    'Patna': 'Bihar', 'Gaya': 'Bihar', 'Bihar Sharif': 'Bihar', 'Muzaffarpur': 'Bihar', 'Darbhanga': 'Bihar',
    // Punjab
    'Ludhiana': 'Punjab', 'Amritsar': 'Punjab', 'Jalandhar': 'Punjab', 'Panipat': 'Punjab',
    // Haryana
    'Faridabad': 'Haryana', 'Gurgaon': 'Haryana', 'Gurugram': 'Haryana', 'Karnal': 'Haryana',
    'Noida': 'Haryana', 'Greater Noida': 'Haryana',
    // Jharkhand
    'Ranchi': 'Jharkhand', 'Dhanbad': 'Jharkhand',
    // Chhattisgarh
    'Raipur': 'Chhattisgarh', 'Bilaspur': 'Chhattisgarh',
    // Odisha
    'Bhubaneswar': 'Odisha',
    // Assam
    'Guwahati': 'Assam',
    // Jammu and Kashmir
    'Srinagar': 'Jammu and Kashmir', 'Jammu': 'Jammu and Kashmir',
    // Delhi
    'Delhi': 'Delhi',
    // Chandigarh
    'Chandigarh': 'Chandigarh'
  };

  // State to Country mapping
  const stateToCountryMap: { [key: string]: string } = {
    // All Indian states map to India
    'Andhra Pradesh': 'India', 'Arunachal Pradesh': 'India', 'Assam': 'India', 'Bihar': 'India',
    'Chhattisgarh': 'India', 'Goa': 'India', 'Gujarat': 'India', 'Haryana': 'India',
    'Himachal Pradesh': 'India', 'Jharkhand': 'India', 'Karnataka': 'India', 'Kerala': 'India',
    'Madhya Pradesh': 'India', 'Maharashtra': 'India', 'Manipur': 'India', 'Meghalaya': 'India',
    'Mizoram': 'India', 'Nagaland': 'India', 'Odisha': 'India', 'Punjab': 'India',
    'Rajasthan': 'India', 'Sikkim': 'India', 'Tamil Nadu': 'India', 'Telangana': 'India',
    'Tripura': 'India', 'Uttar Pradesh': 'India', 'Uttarakhand': 'India', 'West Bengal': 'India',
    'Delhi': 'India', 'Jammu and Kashmir': 'India', 'Ladakh': 'India', 'Puducherry': 'India',
    'Chandigarh': 'India', 'Daman and Diu': 'India', 'Dadra and Nagar Haveli': 'India',
    'Andaman and Nicobar Islands': 'India', 'Lakshadweep': 'India',
    // Abbreviations
    'AP': 'India', 'UP': 'India', 'MP': 'India', 'TN': 'India', 'MH': 'India',
    'GJ': 'India', 'KA': 'India', 'WB': 'India', 'RJ': 'India', 'PB': 'India'
  };

  // All Indian states list (from static model)
  const allIndianStatesList = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Puducherry', 'Chandigarh', 'Daman and Diu', 'Dadra and Nagar Haveli',
    'Andaman and Nicobar Islands', 'Lakshadweep',
    'AP', 'UP', 'MP', 'TN', 'MH', 'GJ', 'KA', 'WB', 'RJ', 'PB'
  ];

  // Filter states based on selected countries
  const getFilteredStates = (): string[] => {
    const selectedCountries = prefs.geographic?.countries || [];
    const statesFromLibrary = selectedCountries.flatMap((countryName) => {
      const code = countryCodeByName.get(countryName);
      if (!code) return [];
      return State.getStatesOfCountry(code).map((state) => state.name);
    });

    if (selectedCountries.length === 0) {
      return [];
    }

    if (selectedCountries.includes('India')) {
      const merged = [...statesFromLibrary, ...allIndianStatesList];
      return sanitizeOptions(merged);
    }

    return sanitizeOptions(statesFromLibrary);
  };

  // All Indian cities list (from static model)
  const allIndianCitiesList = [
    'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
    'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Allahabad',
    'Ranchi', 'Howrah', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
    'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli',
    'Tiruchirappalli', 'Mysore', 'Bareilly', 'Moradabad', 'Gurgaon', 'Gurugram',
    'Aligarh', 'Jalandhar', 'Tirunelveli', 'Bhubaneswar', 'Salem',
    'Noida', 'Greater Noida', 'Kalyan', 'Vasai-Virar',
    'Aurangabad', 'Dhanbad', 'Amravati', 'Nellore', 'Gaya', 'Jammu',
    'Belagavi', 'Mangalore', 'Malegaon', 'Jalgaon',
    'Udaipur', 'Maheshtala', 'Tirupati', 'Karnal', 'Bihar Sharif', 'Parbhani',
    'Panipat', 'Darbhanga', 'Khandwa', 'Morena', 'Raebareli', 'Bilaspur',
    'Kharagpur', 'Bharatpur', 'Bardhaman', 'Bhiwandi', 'Muzaffarpur', 'Mathura'
  ];

  // Filter cities based on selected states
  const getFilteredCities = (): string[] => {
    const citiesFromOptions: string[] = Array.isArray(availableOptions?.cities)
      ? availableOptions.cities
      : [];
    const selectedCountries = prefs.geographic?.countries || [];
    const selectedStates = prefs.geographic?.states || [];

    if (selectedStates.length === 0) {
      if (selectedCountries.includes('India')) {
        const allCities = [...citiesFromOptions, ...allIndianCitiesList];
        return sanitizeOptions(allCities);
      }
      return sanitizeOptions(citiesFromOptions);
    }

    const stateRecords = selectedCountries.flatMap((countryName) => {
      const code = countryCodeByName.get(countryName);
      if (!code) return [];
      return State.getStatesOfCountry(code);
    });
    const stateKeyMap = new Map(
      stateRecords.map((state) => [state.name, { countryCode: state.countryCode, isoCode: state.isoCode }])
    );
    const citiesFromLibrary = selectedStates.flatMap((stateName) => {
      const match = stateKeyMap.get(stateName);
      if (!match) return [];
      return City.getCitiesOfState(match.countryCode, match.isoCode).map((city) => city.name);
    });

    const filteredCities = citiesFromOptions.filter((city: string) => {
      const state = cityToStateMap[city];
      if (!state) return false;
      return selectedStates.includes(state);
    });

    const citiesFromStaticList = allIndianCitiesList.filter((city: string) => {
      const state = cityToStateMap[city];
      if (!state) return false;
      return selectedStates.includes(state);
    });

    const allCities = [...citiesFromLibrary, ...citiesFromStaticList, ...filteredCities];
    return sanitizeOptions(allCities);
  };

  const validateGeoSelection = (prefsToValidate: UserPreference): string | null => {
    const selectedCountries = (prefsToValidate.preferences?.geographic?.countries || []).map(normalizeOption);
    const selectedStates = (prefsToValidate.preferences?.geographic?.states || []).map(normalizeOption);
    const selectedCities = (prefsToValidate.preferences?.geographic?.cities || []).map(normalizeOption);

    if (selectedCountries.length === 0) return null;

    const stateRecords = selectedCountries.flatMap((countryName) => {
      const code = countryCodeByName.get(countryName);
      if (!code) return [];
      return State.getStatesOfCountry(code);
    });
    const stateToCountry = new Map(
      stateRecords.map((state) => [state.name, state.countryCode])
    );
    const allowedCountryCodes = new Set(
      selectedCountries
        .map((countryName) => countryCodeByName.get(countryName))
        .filter((code): code is string => Boolean(code))
    );

    const invalidStates = selectedStates.filter((state) => {
      const stateCountryCode = stateToCountry.get(state);
      const mappedCountry = stateToCountryMap[state];
      if (stateCountryCode) {
        return !allowedCountryCodes.has(stateCountryCode);
      }
      if (mappedCountry) {
        return !selectedCountries.includes(mappedCountry);
      }
      return false;
    });
    if (invalidStates.length > 0) {
      return `Selected state(s) do not belong to chosen country: ${invalidStates.join(', ')}`;
    }

    const stateKeyMap = new Map(
      stateRecords.map((state) => [state.name, { countryCode: state.countryCode, isoCode: state.isoCode }])
    );
    const cityToCountryCode = new Map<string, string>();
    selectedStates.forEach((stateName) => {
      const match = stateKeyMap.get(stateName);
      if (!match) return;
      City.getCitiesOfState(match.countryCode, match.isoCode).forEach((city) => {
        if (city?.name) {
          cityToCountryCode.set(city.name, match.countryCode);
        }
      });
    });

    const invalidCities = selectedCities.filter((city) => {
      const mappedState = cityToStateMap[city];
      if (mappedState) {
        const mappedCountry = stateToCountryMap[mappedState] || 'India';
        return !selectedCountries.includes(mappedCountry);
      }
      const cityCountryCode = cityToCountryCode.get(city);
      if (cityCountryCode) {
        return !allowedCountryCodes.has(cityCountryCode);
      }
      return false;
    });
    if (invalidCities.length > 0) {
      return `Selected city(s) do not belong to chosen country: ${invalidCities.join(', ')}`;
    }

    return null;
  };

  // Custom MultiSelect Component with Dropdown
  const MultiSelect: React.FC<{
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
  }> = ({ options, selected, onChange, searchValue, onSearchChange, placeholder = "Search..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter(opt => 
      opt.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    // Auto-focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        // Small delay to ensure dropdown is rendered
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }, [isOpen]);

    const toggleOption = (option: string) => {
      if (selected.includes(option)) {
        onChange(selected.filter(item => item !== option));
      } else {
        onChange([...selected, option]);
      }
    };

    const removeSelected = (option: string) => {
      onChange(selected.filter(item => item !== option));
    };

    // Close dropdown when clicking outside (but not on search input)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        // Use a slight delay to avoid closing immediately when opening
        const timeoutId = setTimeout(() => {
          document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        
        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isOpen]);

    return (
      <div className="space-y-2" ref={dropdownRef}>
        {/* Selected Chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[48px]">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelected(item);
                  }}
                  className="hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left"
          >
            <span className="text-sm text-gray-700">
              {selected.length > 0 ? `${selected.length} selected` : 'Select options...'}
            </span>
            {isOpen ? (
              <ChevronUp className="text-gray-500" size={20} />
            ) : (
              <ChevronDown className="text-gray-500" size={20} />
            )}
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div 
              className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => {
                      e.stopPropagation();
                      const value = e.target.value;
                      onSearchChange(value);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      // Close dropdown on Escape, but clear search first if there's text
                      if (e.key === 'Escape') {
                        if (searchValue) {
                          onSearchChange('');
                        } else {
                          setIsOpen(false);
                        }
                      }
                      // Prevent Enter from submitting forms
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Options List - Fixed Height */}
              <div className="overflow-y-auto max-h-[250px]">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {searchValue ? 'No options found' : 'No options available'}
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selected.includes(option);
                    return (
                      <div
                        key={option}
                        onClick={() => toggleOption(option)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="text-blue-600 flex-shrink-0" size={18} />
                        ) : (
                          <Square className="text-gray-400 flex-shrink-0" size={18} />
                        )}
                        <span className={`text-sm flex-1 ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar userName={currentUser?.firstName || ''} onLogout={() => navigate('/login')} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-600">Loading preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar userName={currentUser?.firstName || ''} onLogout={() => navigate('/login')} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <span className="text-red-800">Failed to load preferences</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const prefs = preferences.preferences || preferences as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar userName={currentUser?.firstName || ''} onLogout={() => navigate('/login')} />
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          toast.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {toast.type === 'success' && <Check size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-600 hover:text-gray-800">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="text-purple-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Lead Preferences</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Set your preferences to prioritize matching leads. Leads will still appear even if preferences don't match.
                  </p>
                </div>
              </div>
              <button
                onClick={() => savePreferences()}
                disabled={saving}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
        </div>

        {/* Current Preferences Summary Card */}
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-purple-200 mb-8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Filter className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Current Preferences Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="text-blue-600" size={18} />
                <span className="font-semibold text-gray-700">Countries</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.geographic?.countries)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-green-600" size={18} />
                <span className="font-semibold text-gray-700">States</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.geographic?.states)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-blue-600" size={18} />
                <span className="font-semibold text-gray-700">Cities</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.geographic?.cities)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="text-purple-600" size={18} />
                <span className="font-semibold text-gray-700">Industries</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.business?.industries)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-indigo-600" size={18} />
                <span className="font-semibold text-gray-700">Company Sizes</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.business?.companySizes)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-amber-600" size={18} />
                <span className="font-semibold text-gray-700">Revenue Ranges</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.business?.revenueRanges)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-red-600" size={18} />
                <span className="font-semibold text-gray-700">Trigger Events</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.triggers?.events)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-yellow-600" size={18} />
                <span className="font-semibold text-gray-700">Technologies</span>
              </div>
              <p className="text-sm text-gray-600">{formatList(prefs.triggers?.technologies)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-600" size={18} />
                <span className="font-semibold text-gray-700">Scoring</span>
              </div>
              <p className="text-sm text-gray-600">{prefs.scoring?.enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="text-pink-600" size={18} />
                <span className="font-semibold text-gray-700">Notifications</span>
              </div>
              <p className="text-sm text-gray-600">
                {prefs.notifications?.email ? 'Email' : ''} {prefs.notifications?.browser ? 'Browser' : ''} 
                {prefs.notifications?.frequency ? ` (${prefs.notifications.frequency})` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Form - Tabbed View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Configure Preferences</h2>
            <p className="text-sm text-gray-600 mt-1">
              These preferences will match with lead customFields to prioritize matching leads. Leads will still appear even if preferences don't match.
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex space-x-2 px-6">
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 relative ${
                  activeTab === 'preferences'
                    ? 'border-purple-600 text-purple-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Filter className="size-4" />
                  Lead Preferences
                </span>
                {activeTab === 'preferences' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 relative ${
                  activeTab === 'settings'
                    ? 'border-purple-600 text-purple-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Settings className="size-4" />
                  Settings
                </span>
                {activeTab === 'settings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab 1: Lead Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
            {/* Geographic Preferences */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <MapPin className="text-blue-600" size={22} />
                </div>
                Geographic Preferences
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="text-blue-500" size={16} />
                      Countries
                    </span>
                    {prefs.geographic?.countries?.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.geographic.countries.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={countryOptions}
                    selected={prefs.geographic?.countries || []}
                    onChange={(selected) => updatePreference('geographic.countries', selected.map(normalizeOption))}
                    searchValue={searchFilters.country}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, country: value})}
                    placeholder="Search countries..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{countryOptions.length} countries available</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="text-blue-500" size={16} />
                      States
                      {prefs.geographic?.countries && prefs.geographic.countries.length > 0 && (
                        <span className="text-xs text-gray-500 font-normal">
                          (from {prefs.geographic.countries.join(', ')})
                        </span>
                      )}
                    </span>
                    {prefs.geographic?.states?.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.geographic.states.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={getFilteredStates()}
                    selected={prefs.geographic?.states || []}
                    onChange={(selected) => {
                      const cleanedStates = selected.map(normalizeOption);
                      updatePreference('geographic.states', cleanedStates);
                      // Clear cities that don't belong to selected states
                      if (prefs.geographic?.cities) {
                        const validCities = prefs.geographic.cities
                          .map(normalizeOption)
                          .filter(city => {
                          const cityState = cityToStateMap[city];
                          return !cityState || cleanedStates.includes(cityState);
                        });
                        if (validCities.length !== prefs.geographic.cities.length) {
                          updatePreference('geographic.cities', validCities);
                        }
                      }
                    }}
                    searchValue={searchFilters.state}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, state: value})}
                    placeholder="Search states..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {getFilteredStates().length} states available
                    {prefs.geographic?.countries && prefs.geographic.countries.length > 0 && ' (filtered by country)'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="text-blue-500" size={16} />
                      Cities
                      {prefs.geographic?.states && prefs.geographic.states.length > 0 && (
                        <span className="text-xs text-gray-500 font-normal">
                          (from {prefs.geographic.states.slice(0, 2).join(', ')}{prefs.geographic.states.length > 2 ? '...' : ''})
                        </span>
                      )}
                    </span>
                    {prefs.geographic?.cities?.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.geographic.cities.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={getFilteredCities()}
                    selected={prefs.geographic?.cities || []}
                    onChange={(selected) => updatePreference('geographic.cities', selected.map(normalizeOption))}
                    searchValue={searchFilters.city}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, city: value})}
                    placeholder="Search cities..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {getFilteredCities().length} cities available
                    {prefs.geographic?.states && prefs.geographic.states.length > 0 && ' (filtered by state)'}
                  </p>
                </div>
                
              </div>
            </div>

            {/* Business Preferences */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Briefcase className="text-green-600" size={22} />
                </div>
                Business Preferences
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="text-green-500" size={16} />
                      Industries
                    </span>
                    {prefs.business?.industries?.length > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.business.industries.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.industries || []}
                    selected={prefs.business?.industries || []}
                    onChange={(selected) => updatePreference('business.industries', selected)}
                    searchValue={searchFilters.industry}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, industry: value})}
                    placeholder="Search industries..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.industries?.length || 0} industries available</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="text-green-500" size={16} />
                      Company Sizes
                    </span>
                    {prefs.business?.companySizes?.length > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.business.companySizes.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.companySizes || []}
                    selected={prefs.business?.companySizes || []}
                    onChange={(selected) => updatePreference('business.companySizes', selected)}
                    searchValue={searchFilters.companySize}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, companySize: value})}
                    placeholder="Search company sizes..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.companySizes?.length || 0} sizes available</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="text-green-500" size={16} />
                      Revenue Ranges (₹ Crores)
                    </span>
                    {prefs.business?.revenueRanges?.length > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.business.revenueRanges.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.revenueRanges || []}
                    selected={prefs.business?.revenueRanges || []}
                    onChange={(selected) => updatePreference('business.revenueRanges', selected)}
                    searchValue={searchFilters.revenue}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, revenue: value})}
                    placeholder="Search revenue ranges..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.revenueRanges?.length || 0} ranges available</p>
                </div>
              </div>
            </div>

            {/* Triggers */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Target className="text-purple-600" size={22} />
                </div>
                Trigger Preferences
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="text-purple-500" size={16} />
                      Trigger Events
                    </span>
                    {prefs.triggers?.events?.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.triggers.events.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.events || []}
                    selected={prefs.triggers?.events || []}
                    onChange={(selected) => updatePreference('triggers.events', selected)}
                    searchValue={searchFilters.triggerEvent}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, triggerEvent: value})}
                    placeholder="Search trigger events..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.events?.length || 0} events available</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="text-purple-500" size={16} />
                      Keywords
                    </span>
                    {prefs.triggers?.keywords?.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.triggers.keywords.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.keywords || []}
                    selected={prefs.triggers?.keywords || []}
                    onChange={(selected) => updatePreference('triggers.keywords', selected)}
                    searchValue={searchFilters.keyword}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, keyword: value})}
                    placeholder="Search keywords..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.keywords?.length || 0} keywords available</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="text-purple-500" size={16} />
                      Technologies
                    </span>
                    {prefs.triggers?.technologies?.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {prefs.triggers.technologies.length} selected
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={availableOptions?.technologies || []}
                    selected={prefs.triggers?.technologies || []}
                    onChange={(selected) => updatePreference('triggers.technologies', selected)}
                    searchValue={searchFilters.technology}
                    onSearchChange={(value) => setSearchFilters({...searchFilters, technology: value})}
                    placeholder="Search technologies..."
                  />
                  <p className="text-xs text-gray-500 mt-2">{availableOptions?.technologies?.length || 0} technologies available</p>
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Tab 2: Settings (Search Radius, Lead Scoring, Notifications) */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Search Radius */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="text-blue-600 mr-2" size={22} />
                    Search Radius Settings
                  </h3>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-gray-700">
                        Search Radius
                      </label>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {prefs.geographic?.radius || 50} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={prefs.geographic?.radius || 50}
                      onChange={(e) => updatePreference('geographic.radius', parseInt(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((prefs.geographic?.radius || 50) - 10) / 490 * 100}%, #e5e7eb ${((prefs.geographic?.radius || 50) - 10) / 490 * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span className="font-medium">10 km</span>
                      <span className="font-medium">500 km</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      💡 This radius will be used to filter leads based on geographic proximity to your selected cities.
                    </p>
                  </div>
                </div>

                {/* Lead Scoring */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="text-purple-600 mr-2" size={22} />
                    Lead Scoring
                  </h3>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <label className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-all">
                      <input
                        type="checkbox"
                        checked={prefs.scoring?.enabled || false}
                        onChange={(e) => updatePreference('scoring.enabled', e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-lg font-semibold text-gray-900">Enable Lead Scoring</span>
                    </label>
                    
                    {prefs.scoring?.enabled && (
                      <div className="space-y-4 mt-6">
                        <p className="text-sm text-gray-700 font-semibold mb-4 flex items-center gap-2">
                          <Sparkles className="text-purple-600" size={16} />
                          Scoring Weights (must total 100%)
                        </p>
                        <div className="space-y-3">
                          {Object.entries(prefs.scoring.weights || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <label className="w-32 text-sm font-medium text-gray-700 capitalize">{key}</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={value as number}
                                onChange={(e) => {
                                  const newWeights = { ...prefs.scoring.weights };
                                  newWeights[key as keyof typeof newWeights] = parseInt(e.target.value) || 0;
                                  updatePreference('scoring.weights', newWeights);
                                }}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                              <span className="text-sm font-semibold text-gray-600 w-8">%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Bell className="text-yellow-600 mr-2" size={22} />
                    Notification Preferences
                  </h3>
                  <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:from-yellow-100 hover:to-orange-100 transition-all">
                      <input
                        type="checkbox"
                        checked={prefs.notifications?.email || false}
                        onChange={(e) => updatePreference('notifications.email', e.target.checked)}
                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                      />
                      <span className="text-gray-900 font-semibold">Email Notifications</span>
                    </label>
                    
                    <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:from-yellow-100 hover:to-orange-100 transition-all">
                      <input
                        type="checkbox"
                        checked={prefs.notifications?.browser || false}
                        onChange={(e) => updatePreference('notifications.browser', e.target.checked)}
                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                      />
                      <span className="text-gray-900 font-semibold">Browser Notifications</span>
                    </label>
                    
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Notification Frequency</label>
                      <select
                        value={prefs.notifications?.frequency || 'daily'}
                        onChange={(e) => updatePreference('notifications.frequency', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-all"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesPage;
