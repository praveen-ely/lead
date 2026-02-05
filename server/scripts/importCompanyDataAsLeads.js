const mongoose = require('mongoose');
const UserPreference = require('../models/userPreferenceModel');
const Company = require('../models/companyModel');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/company-data-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample company data for import
const sampleCompanies = [
  {
    name: 'TechCorp Solutions',
    website: 'https://techcorp.com',
    email: 'contact@techcorp.com',
    phone: '+1-555-0123',
    industry: 'Technology',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    employeeRange: '51-250',
    revenueRange: '$10M-$100M',
    technologies: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
    description: 'Leading technology company specializing in AI and machine learning solutions.',
    founded: 2015,
    linkedinProfile: 'https://linkedin.com/company/techcorp-solutions',
    annualRevenue: 25000000,
    employees: 250,
    tags: ['AI', 'Machine Learning', 'Cloud Computing', 'Enterprise'],
    status: 'Active',
    confidence: 95,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'Digital Innovations Inc',
    website: 'https://digitalinnovations.io',
    email: 'info@digitalinnovations.io',
    phone: '+1-555-0456',
    industry: 'Software',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    employeeRange: '51-250',
    revenueRange: '$1M-$10M',
    technologies: ['Angular', 'Java', 'Azure', 'MongoDB', 'Redis'],
    description: 'Digital transformation company helping businesses modernize their operations.',
    founded: 2018,
    linkedinProfile: 'https://linkedin.com/company/digital-innovations',
    annualRevenue: 15000000,
    employees: 120,
    tags: ['Digital Transformation', 'Cloud', 'Enterprise Software', 'Modernization'],
    status: 'Active',
    confidence: 92,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'Smart Systems LLC',
    website: 'https://smartsystems.tech',
    email: 'hello@smartsystems.tech',
    phone: '+1-555-0789',
    industry: 'Internet of Things',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    employeeRange: '11-50',
    revenueRange: '$1M-$10M',
    technologies: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'Firebase'],
    description: 'IoT and smart home solutions provider.',
    founded: 2016,
    linkedinProfile: 'https://linkedin.com/company/smart-systems',
    annualRevenue: 8000000,
    employees: 85,
    tags: ['IoT', 'Smart Home', 'Embedded Systems', 'Hardware'],
    status: 'Active',
    confidence: 88,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'Global Technologies Ltd',
    website: 'https://globaltech.com',
    email: 'sales@globaltech.com',
    phone: '+1-555-0234',
    industry: 'Manufacturing',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    employeeRange: '251-1000',
    revenueRange: '$100M-$1B',
    technologies: ['PLC', 'SCADA', 'Industrial IoT', 'Machine Learning', 'Big Data'],
    description: 'Industrial manufacturing technology solutions provider.',
    founded: 2010,
    linkedinProfile: 'https://linkedin.com/company/global-technologies',
    annualRevenue: 500000000,
    employees: 750,
    tags: ['Manufacturing', 'Industrial IoT', 'Automation', 'Big Data'],
    status: 'Active',
    confidence: 94,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'HealthTech Solutions',
    website: 'https://healthtech.com',
    email: 'info@healthtech.com',
    phone: '+1-555-0567',
    industry: 'Healthcare',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    employeeRange: '51-250',
    revenueRange: '$10M-$100M',
    technologies: ['HIPAA', 'Electronic Health Records', 'Telemedicine', 'AI', 'Blockchain'],
    description: 'Healthcare technology solutions for hospitals and clinics.',
    founded: 2017,
    linkedinProfile: 'https://linkedin.com/company/healthtech-solutions',
    annualRevenue: 35000000,
    employees: 180,
    tags: ['Healthcare', 'HIPAA', 'Telemedicine', 'Electronic Health Records'],
    status: 'Active',
    confidence: 91,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'FinTech Innovations',
    website: 'https://fintech.io',
    email: 'contact@fintech.io',
    phone: '+1-555-0890',
    industry: 'Finance',
    city: 'Miami',
    state: 'FL',
    country: 'United States',
    employeeRange: '11-50',
    revenueRange: '$1M-$10M',
    technologies: ['Blockchain', 'Cryptocurrency', 'Smart Contracts', 'DeFi', 'API'],
    description: 'Financial technology company specializing in blockchain and cryptocurrency solutions.',
    founded: 2019,
    linkedinProfile: 'https://linkedin.com/company/fintech-innovations',
    annualRevenue: 12000000,
    employees: 45,
    tags: ['FinTech', 'Blockchain', 'Cryptocurrency', 'DeFi', 'Smart Contracts'],
    status: 'Active',
    confidence: 87,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'EduTech Platforms',
    website: 'https://edutech.com',
    email: 'support@edutech.com',
    phone: '+1-555-0123',
    industry: 'Education',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    employeeRange: '51-250',
    revenueRange: '$10M-$100M',
    technologies: ['LMS', 'VR', 'AR', 'AI', 'Cloud Computing'],
    description: 'Educational technology platform for online learning and virtual classrooms.',
    founded: 2014,
    linkedinProfile: 'https://linkedin.com/company/edutech-platforms',
    annualRevenue: 28000000,
    employees: 160,
    tags: ['Education', 'LMS', 'Virtual Reality', 'Online Learning', 'EdTech'],
    status: 'Active',
    confidence: 93,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'RetailTech Solutions',
    website: 'https://retailtech.com',
    email: 'sales@retailtech.com',
    phone: '+1-555-0345',
    industry: 'Retail',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    employeeRange: '251-1000',
    revenueRange: '$100M-$1B',
    technologies: ['E-commerce', 'POS', 'Inventory Management', 'AI', 'Analytics'],
    description: 'Retail technology solutions for e-commerce and brick-and-mortar stores.',
    founded: 2012,
    linkedinProfile: 'https://linkedin.com/company/retailtech-solutions',
    annualRevenue: 450000000,
    employees: 680,
    tags: ['Retail', 'E-commerce', 'POS', 'Inventory Management', 'Analytics'],
    status: 'Active',
    confidence: 90,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'LogisticsPro',
    website: 'https://logisticspro.com',
    email: 'info@logisticspro.com',
    phone: '+1-555-0678',
    industry: 'Transportation',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    employeeRange: '51-250',
    revenueRange: '$10M-$100M',
    technologies: ['GPS', 'Route Optimization', 'Fleet Management', 'IoT', 'Cloud'],
    description: 'Logistics and transportation management solutions.',
    founded: 2016,
    linkedinProfile: 'https://linkedin.com/company/logisticspro',
    annualRevenue: 32000000,
    employees: 220,
    tags: ['Logistics', 'Transportation', 'Fleet Management', 'Route Optimization', 'IoT'],
    status: 'Active',
    confidence: 89,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  },
  {
    name: 'CloudScale Systems',
    website: 'https://cloudscale.com',
    email: 'contact@cloudscale.com',
    phone: '+1-555-0901',
    industry: 'Cloud Computing',
    city: 'Denver',
    state: 'CO',
    country: 'United States',
    employeeRange: '11-50',
    revenueRange: '$1M-$10M',
    technologies: ['AWS', 'Azure', 'Google Cloud', 'Kubernetes', 'Serverless'],
    description: 'Cloud infrastructure and scaling solutions for modern applications.',
    founded: 2020,
    linkedinProfile: 'https://linkedin.com/company/cloudscale-systems',
    annualRevenue: 9000000,
    employees: 38,
    tags: ['Cloud Computing', 'AWS', 'Kubernetes', 'Serverless', 'DevOps'],
    status: 'Active',
    confidence: 86,
    source: 'Manual Import',
    dateAdded: new Date(),
    lastUpdated: new Date()
  }
];

// Function to generate leads from company data
function generateLeadsFromCompany(company, userPreference) {
  const leads = [];
  const score = userPreference.calculateLeadScore({
    industry: company.industry,
    city: company.city,
    employeeRange: company.employeeRange,
    revenueRange: company.revenueRange,
    technologies: company.technologies
  });

  const lead = {
    _id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    leadId: `L${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    source: 'Import Script',
    status: 'New',
    priority: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
    assignedTo: null,
    data: {
      name: company.name,
      email: company.email,
      phone: company.phone,
      company: company.name,
      website: company.website,
      industry: company.industry,
      city: company.city,
      state: company.state,
      country: company.country,
      employeeRange: company.employeeRange,
      revenueRange: company.revenueRange,
      technologies: company.technologies,
      description: company.description,
      founded: company.founded,
      linkedinProfile: company.linkedinProfile,
      score: score
    },
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    notes: `Imported from company data. Industry: ${company.industry}, Employees: ${company.employees}`,
    aiProcessed: true,
    aiConfidence: company.confidence,
    aiModel: 'Import-Script-v1.0'
  };

  leads.push(lead);
  return leads;
}

// Main import function
async function importCompanyDataAsLeads() {
  try {
    console.log('Starting company data import...');

    // Get or create default user preference
    let userPreference = await UserPreference.findOne({ userId: 'user123' });
    
    if (!userPreference) {
      console.log('Creating default user preferences...');
      userPreference = new UserPreference({
        userId: 'user123',
        preferences: {
          geographic: {
            cities: ['San Francisco', 'New York', 'Austin', 'Chicago', 'Boston', 'Miami', 'Seattle', 'Los Angeles', 'Atlanta', 'Denver'],
            states: ['CA', 'NY', 'TX', 'IL', 'MA', 'FL', 'WA', 'CO', 'GA'],
            countries: ['United States'],
            regions: [],
            radius: 50,
            radiusUnit: 'km'
          },
          business: {
            industries: ['Technology', 'Software', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Transportation', 'Cloud Computing'],
            companySizes: ['Startup (1-10)', 'Small (11-50)', 'Medium (51-250)', 'Large (251-1000)', 'Enterprise (1000+)'],
            revenueRanges: ['$0-$1M', '$1M-$10M', '$10M-$100M', '$100M-$1B', '$1B+'],
            employeeRanges: ['1-10', '11-50', '51-250', '251-1000', '1000+'],
            companyTypes: ['Startup', 'SME', 'Enterprise', 'Corporation'],
            technologies: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'Angular', 'Java', 'Azure'],
            businessModels: ['B2B', 'B2C', 'SaaS', 'Marketplace']
          },
          triggers: {
            events: ['Funding', 'Hiring', 'Expansion', 'Product Launch', 'Acquisition'],
            keywords: ['AI', 'Machine Learning', 'Cloud Computing', 'Digital Transformation', 'IoT'],
            timeframes: {
              lastFunding: '6months',
              lastHiring: '3months',
              lastExpansion: '12months',
              lastWebsiteUpdate: '3months'
            }
          },
          scoring: {
            weights: {
              industry: 25,
              size: 20,
              location: 15,
              technology: 20,
              triggers: 15,
              revenue: 5
            },
            thresholds: {
              minimum: 40,
              high: 80,
              medium: 60,
              low: 40
            }
          },
          notifications: {
            email: true,
            sms: false,
            push: true,
            frequency: 'daily',
            filters: {
              minimumScore: 60,
              industries: [],
              locations: []
            }
          },
          api: {
            endpoints: {
              crunchbase: 'https://api.crunchbase.com/v4',
              hunter: 'https://api.hunter.io/v2',
              clearbit: 'https://api.clearbit.com/v1',
              linkedin: 'https://api.linkedin.com/v2'
            },
            keys: {
              crunchbase: '',
              hunter: '',
              clearbit: '',
              linkedin: ''
            },
            rateLimits: {
              requestsPerMinute: 100,
              requestsPerHour: 5000,
              requestsPerDay: 50000
            }
          }
        },
        stats: {
          totalLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          lastSync: new Date(),
          apiCalls: 0,
          successRate: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await userPreference.save();
      console.log('Default user preferences created');
    }

    // Clear existing companies
    await Company.deleteMany({});
    console.log('Cleared existing companies');

    // Import companies
    const insertedCompanies = await Company.insertMany(sampleCompanies);
    console.log(`Inserted ${insertedCompanies.length} companies`);

    // Generate leads from companies
    const allLeads = [];
    for (const company of insertedCompanies) {
      const leads = generateLeadsFromCompany(company, userPreference);
      allLeads.push(...leads);
    }

    // Update user preference statistics
    const qualifiedLeads = allLeads.filter(lead => lead.data.score >= userPreference.preferences.scoring.thresholds.high).length;
    const convertedLeads = Math.floor(qualifiedLeads * 0.2); // Mock 20% conversion rate

    await userPreference.updateStats({
      totalLeads: allLeads.length,
      qualifiedLeads: qualifiedLeads,
      convertedLeads: convertedLeads,
      apiCalls: 0,
      successRate: 95
    });

    console.log('Import completed successfully!');
    console.log(`Total companies imported: ${insertedCompanies.length}`);
    console.log(`Total leads generated: ${allLeads.length}`);
    console.log(`Qualified leads: ${qualifiedLeads}`);
    console.log(`Converted leads: ${convertedLeads}`);

    // Display lead summary
    console.log('\n=== Lead Summary ===');
    allLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.data.name} - ${lead.data.industry} - Score: ${lead.data.score} - Priority: ${lead.priority}`);
    });

    return {
      companies: insertedCompanies.length,
      leads: allLeads.length,
      qualified: qualifiedLeads,
      converted: convertedLeads
    };

  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importCompanyDataAsLeads()
    .then((result) => {
      console.log('\n=== Import Summary ===');
      console.log(`Companies imported: ${result.companies}`);
      console.log(`Leads generated: ${result.leads}`);
      console.log(`Qualified leads: ${result.qualified}`);
      console.log(`Converted leads: ${result.converted}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = importCompanyDataAsLeads;
