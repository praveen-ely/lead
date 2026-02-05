const express = require('express');
const router = express.Router();

// Mock API endpoints for testing third-party integrations

// Mock Crunchbase API endpoints
router.get('/crunchbase/v4/entities/organizations', (req, res) => {
  const mockData = {
    entities: [
      {
        properties: {
          identifier: {
            uuid: 'cb-12345678-1234-1234-1234-123456789012'
          },
          name: 'TechCorp Solutions',
          website: 'https://techcorp.com',
          short_description: 'Leading technology company specializing in AI and machine learning solutions.',
          founded_on: '2015-06-15',
          total_funding_usd: 25000000,
          employee_count: 250
        },
        category: {
          group: {
            name: 'Technology'
          }
        },
        location_identifiers: [
          {
            location_identifiers: [
              {
                name: 'San Francisco',
                location_type: 'city'
              },
              {
                name: 'California',
                location_type: 'state'
              },
              {
                name: 'United States',
                location_type: 'country'
              }
            ]
          }
        ]
      },
      {
        properties: {
          identifier: {
            uuid: 'cb-87654321-4321-4321-4321-210987654321'
          },
          name: 'Digital Innovations Inc',
          website: 'https://digitalinnovations.io',
          short_description: 'Digital transformation company helping businesses modernize their operations.',
          founded_on: '2018-03-20',
          total_funding_usd: 15000000,
          employee_count: 120
        },
        category: {
          group: {
            name: 'Software'
          }
        },
        location_identifiers: [
          {
            location_identifiers: [
              {
                name: 'New York',
                location_type: 'city'
              },
              {
                name: 'New York',
                location_type: 'state'
              },
              {
                name: 'United States',
                location_type: 'country'
              }
            ]
          }
        ]
      },
      {
        properties: {
          identifier: {
            uuid: 'cb-11112222-3333-4444-5555-666677778888'
          },
          name: 'Smart Systems LLC',
          website: 'https://smartsystems.tech',
          short_description: 'IoT and smart home solutions provider.',
          founded_on: '2016-11-08',
          total_funding_usd: 8000000,
          employee_count: 85
        },
        category: {
          group: {
            name: 'Internet of Things'
          }
        },
        location_identifiers: [
          {
            location_identifiers: [
              {
                name: 'Austin',
                location_type: 'city'
              },
              {
                name: 'Texas',
                location_type: 'state'
              },
              {
                name: 'United States',
                location_type: 'country'
              }
            ]
          }
        ]
      }
    ],
    paging: {
      total_items: 3,
      first_item_url: null,
      last_item_url: null,
      prev_item_url: null,
      next_item_url: null
    }
  };

  res.json(mockData);
});

// Mock Hunter.io API endpoints
router.get('/hunter/v2/me', (req, res) => {
  const mockData = {
    data: {
      id: 'hunter-12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      plan_name: 'Free',
      plan_level: 'free',
      calls: {
        available: 50,
        used: 25
      },
      reset_date: '2024-02-01'
    }
  };

  res.json(mockData);
});

router.get('/hunter/v2/domain-search', (req, res) => {
  const mockData = {
    data: [
      {
        id: 'hunter-001',
        name: 'TechCorp Solutions',
        domain: 'techcorp.com',
        email: 'contact@techcorp.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        state: 'California',
        country: 'United States',
        industry: 'Technology',
        employees: 250,
        confidence: 98,
        description: 'Leading technology company specializing in AI solutions.'
      },
      {
        id: 'hunter-002',
        name: 'Digital Innovations',
        domain: 'digitalinnovations.io',
        email: 'info@digitalinnovations.io',
        phone: '+1-555-0456',
        location: 'New York, NY',
        state: 'New York',
        country: 'United States',
        industry: 'Software',
        employees: 120,
        confidence: 95,
        description: 'Digital transformation and modernization services.'
      },
      {
        id: 'hunter-003',
        name: 'Smart Systems',
        domain: 'smartsystems.tech',
        email: 'hello@smartsystems.tech',
        phone: '+1-555-0789',
        location: 'Austin, TX',
        state: 'Texas',
        country: 'United States',
        industry: 'IoT',
        employees: 85,
        confidence: 92,
        description: 'IoT and smart home solutions provider.'
      }
    ],
    meta: {
      results: 3,
      limit: 10,
      offset: 0,
      params: {
        api_key: '[REDACTED]',
        limit: '10',
        offset: '0'
      }
    }
  };

  res.json(mockData);
});

// Mock Clearbit API endpoints
router.get('/clearbit/v1/companies/lookup', (req, res) => {
  const domain = req.query.domain;
  
  const mockCompanies = {
    'techcorp.com': {
      id: 'clearbit-001',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      description: 'Leading technology company specializing in AI and machine learning solutions.',
      location: 'San Francisco, CA',
      state: 'California',
      country: 'United States',
      foundedYear: 2015,
      category: {
        industry: 'Technology',
        sector: 'Information Technology',
        subIndustry: 'Software'
      },
      tech: [
        'React',
        'Node.js',
        'Python',
        'AWS',
        'Docker',
        'Kubernetes'
      ],
      metrics: {
        employees: 250,
        employeesRange: '101-250',
        annualRevenue: 25000000,
        raised: 25000000,
        marketCap: null,
        estimatedAnnualRevenue: 25000000
      }
    },
    'digitalinnovations.io': {
      id: 'clearbit-002',
      name: 'Digital Innovations',
      domain: 'digitalinnovations.io',
      description: 'Digital transformation company helping businesses modernize their operations.',
      location: 'New York, NY',
      state: 'New York',
      country: 'United States',
      foundedYear: 2018,
      category: {
        industry: 'Software',
        sector: 'Information Technology',
        subIndustry: 'Enterprise Software'
      },
      tech: [
        'Angular',
        'Java',
        'Azure',
        'MongoDB',
        'Redis'
      ],
      metrics: {
        employees: 120,
        employeesRange: '51-100',
        annualRevenue: 15000000,
        raised: 15000000,
        marketCap: null,
        estimatedAnnualRevenue: 15000000
      }
    },
    'smartsystems.tech': {
      id: 'clearbit-003',
      name: 'Smart Systems',
      domain: 'smartsystems.tech',
      description: 'IoT and smart home solutions provider.',
      location: 'Austin, TX',
      state: 'Texas',
      country: 'United States',
      foundedYear: 2016,
      category: {
        industry: 'Internet of Things',
        sector: 'Consumer Electronics',
        subIndustry: 'Smart Home'
      },
      tech: [
        'Arduino',
        'Raspberry Pi',
        'Python',
        'MQTT',
        'Firebase'
      ],
      metrics: {
        employees: 85,
        employeesRange: '51-100',
        annualRevenue: 8000000,
        raised: 8000000,
        marketCap: null,
        estimatedAnnualRevenue: 8000000
      }
    }
  };

  const company = mockCompanies[domain] || {
    id: 'clearbit-default',
    name: domain.split('.')[0],
    domain: domain,
    description: 'Company information not available.',
    location: 'Unknown',
    state: 'Unknown',
    country: 'Unknown',
    foundedYear: null,
    category: {
      industry: 'Unknown',
      sector: 'Unknown',
      subIndustry: 'Unknown'
    },
    tech: [],
    metrics: {
      employees: null,
      employeesRange: null,
      annualRevenue: null,
      raised: null,
      marketCap: null,
      estimatedAnnualRevenue: null
    }
  };

  res.json(company);
});

// Mock LinkedIn API endpoints
router.get('/linkedin/v2/people', (req, res) => {
  const mockData = {
    elements: [
      {
        id: 'linkedin-001',
        firstName: 'John',
        lastName: 'Doe',
        headline: 'CEO at TechCorp Solutions',
        location: 'San Francisco Bay Area',
        industry: 'Information Technology and Services',
        summary: 'Experienced technology executive with a passion for innovation and digital transformation.',
        positions: {
          elements: [
            {
              title: 'CEO',
              company: 'TechCorp Solutions',
              location: 'San Francisco, CA',
              startDate: {
                year: 2015,
                month: 6
              },
              isCurrent: true
            }
          ]
        },
        educations: {
          elements: [
            {
              schoolName: 'Stanford University',
              degree: 'MBA',
              fieldOfStudy: 'Business Administration',
              startDate: {
                year: 2010,
                month: 9
              },
              endDate: {
                year: 2012,
                month: 6
              }
            }
          ]
        }
      },
      {
        id: 'linkedin-002',
        firstName: 'Jane',
        lastName: 'Smith',
        headline: 'CTO at Digital Innovations',
        location: 'New York, NY',
        industry: 'Computer Software',
        summary: 'Technology leader with expertise in cloud computing and enterprise software.',
        positions: {
          elements: [
            {
              title: 'CTO',
              company: 'Digital Innovations',
              location: 'New York, NY',
              startDate: {
                year: 2018,
                month: 3
              },
              isCurrent: true
            }
          ]
        },
        educations: {
          elements: [
            {
              schoolName: 'MIT',
              degree: 'MS',
              fieldOfStudy: 'Computer Science',
              startDate: {
                year: 2008,
                month: 9
              },
              endDate: {
                year: 2010,
                month: 6
              }
            }
          ]
        }
      }
    ]
  };

  res.json(mockData);
});

// Mock API health check endpoints
router.get('/crunchbase/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'crunchbase',
    version: 'v4'
  });
});

router.get('/hunter/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'hunter',
    version: 'v2'
  });
});

router.get('/clearbit/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'clearbit',
    version: 'v1'
  });
});

router.get('/linkedin/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'linkedin',
    version: 'v2'
  });
});

// Mock API rate limit endpoints
router.get('/crunchbase/rate-limit', (req, res) => {
  res.json({
    calls: {
      remaining: 4500,
      used: 500,
      reset: Math.floor(Date.now() / 1000) + 3600
    }
  });
});

router.get('/hunter/rate-limit', (req, res) => {
  res.json({
    calls: {
      available: 50,
      used: 25,
      reset: Math.floor(Date.now() / 1000) + 3600
    }
  });
});

router.get('/clearbit/rate-limit', (req, res) => {
  res.json({
    calls: {
      remaining: 450,
      used: 50,
      reset: Math.floor(Date.now() / 1000) + 3600
    }
  });
});

router.get('/linkedin/rate-limit', (req, res) => {
  res.json({
    calls: {
      remaining: 900,
      used: 100,
      reset: Math.floor(Date.now() / 1000) + 3600
    }
  });
});

// Mock API error endpoints for testing
router.get('/crunchbase/error', (req, res) => {
  res.status(429).json({
    error: {
      type: 'rate_limit_exceeded',
      message: 'API rate limit exceeded. Please try again later.',
      details: {
        reset_time: Math.floor(Date.now() / 1000) + 3600
      }
    }
  });
});

router.get('/hunter/error', (req, res) => {
  res.status(401).json({
    error: {
      type: 'authentication_error',
      message: 'Invalid API key provided.',
      details: {
        code: 'INVALID_API_KEY'
      }
    }
  });
});

router.get('/clearbit/error', (req, res) => {
  res.status(404).json({
    error: {
      type: 'not_found',
      message: 'Company not found.',
      details: {
        domain: req.query.domain || 'unknown'
      }
    }
  });
});

router.get('/linkedin/error', (req, res) => {
  res.status(403).json({
    error: {
      type: 'permission_denied',
      message: 'Insufficient permissions to access this resource.',
      details: {
        required_scope: 'r_basicprofile'
      }
    }
  });
});

// Mock API timeout endpoint
router.get('/timeout', (req, res) => {
  // Simulate a timeout by not responding
  setTimeout(() => {
    res.status(500).json({
      error: {
        type: 'timeout',
        message: 'Request timeout'
      }
    });
  }, 30000);
});

// Mock API malformed response endpoint
router.get('/malformed', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('This is not a valid JSON response');
});

module.exports = router;
