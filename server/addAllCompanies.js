const mongoose = require('mongoose');
require('dotenv').config();

const companySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  website: { type: String, required: true },
  industry: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  employeeRange: { type: String, required: true },
  estimatedRevenue: { type: String, required: true },
  outsourcingScore: { type: Number, required: true },
  companyType: { type: String, required: true },
  keyContact: { type: String, required: true },
  contactRole: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  linkedInProfile: { type: String, required: true },
  keywordsFound: { type: String, required: true },
  triggerEvents: { type: String, required: true },
  lastWebsiteUpdate: { type: Date, required: true },
  notes: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  assignedTo: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);

const allCompanyData = [
  {
    companyId: 'CMP0001',
    companyName: 'Oconnor, Marshall and Lyons',
    website: 'http://www.blake.org/',
    industry: 'Healthcare',
    city: 'Davidsonmouth',
    state: 'IL',
    employeeRange: '500+',
    estimatedRevenue: '<$1M',
    outsourcingScore: 23,
    companyType: 'Startup',
    keyContact: 'Gina Villegas',
    contactRole: 'VP Engineering',
    email: 'davidboone@scott.org',
    phone: '978.096.6134',
    linkedInProfile: 'https://www.linkedin.com/in/zachary36',
    keywordsFound: 'AI, Cloud',
    triggerEvents: 'Hiring Surge',
    lastWebsiteUpdate: new Date('2026-01-20'),
    notes: 'Writer expect office shoulder knowledge already top.',
    priority: 'Low',
    assignedTo: 'Danielle',
    dateAdded: new Date('2026-02-01')
  },
  {
    companyId: 'CMP0002',
    companyName: 'Stevenson Ltd',
    website: 'https://roberts.net/',
    industry: 'Finance',
    city: 'South Elizabeth',
    state: 'FL',
    employeeRange: '51-200',
    estimatedRevenue: '$50M-$100M',
    outsourcingScore: 79,
    companyType: 'Startup',
    keyContact: 'Mckenzie Smith',
    contactRole: 'IT Manager',
    email: 'emily87@rosales-rogers.com',
    phone: '527.164.7662',
    linkedInProfile: 'https://www.linkedin.com/in/montgomerychristopher',
    keywordsFound: 'Data, Security',
    triggerEvents: 'Funding Round',
    lastWebsiteUpdate: new Date('2025-09-05'),
    notes: 'Hear reach book policy gun writer member someone.',
    priority: 'Medium',
    assignedTo: 'Brandon',
    dateAdded: new Date('2026-02-01')
  },
  {
    companyId: 'CMP0003',
    companyName: 'Gonzalez and Sons',
    website: 'https://wilson.com/',
    industry: 'Education',
    city: 'Ramseyborough',
    state: 'CT',
    employeeRange: '51-200',
    estimatedRevenue: '$10M-$50M',
    outsourcingScore: 42,
    companyType: 'Startup',
    keyContact: 'Nicholas Olson',
    contactRole: 'CEO',
    email: 'brandywade@thomas.biz',
    phone: '7529834240',
    linkedInProfile: 'https://www.linkedin.com/in/rford',
    keywordsFound: 'Automation, DevOps',
    triggerEvents: 'Product Launch',
    lastWebsiteUpdate: new Date('2025-07-11'),
    notes: 'Act information action spring claim ahead director central majority.',
    priority: 'Low',
    assignedTo: 'Mercedes',
    dateAdded: new Date('2026-02-01')
  },
  {
    companyId: 'CMP0004',
    companyName: 'Kramer Inc',
    website: 'http://www.thomas.com/',
    industry: 'Retail',
    city: 'Harrisland',
    state: 'DC',
    employeeRange: '11-50',
    estimatedRevenue: '<$1M',
    outsourcingScore: 91,
    companyType: 'Enterprise',
    keyContact: 'Philip Kirk',
    contactRole: 'IT Manager',
    email: 'wrightdavid@white-richards.com',
    phone: '426.975.5047',
    linkedInProfile: 'https://www.linkedin.com/in/cory83',
    keywordsFound: 'AI, Cloud',
    triggerEvents: 'Funding Round',
    lastWebsiteUpdate: new Date('2025-05-29'),
    notes: 'Rather forward let story pretty.',
    priority: 'Low',
    assignedTo: 'Andrea',
    dateAdded: new Date('2026-02-01')
  }
];

async function addAllCompanies() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Company.insertMany(allCompanyData);
    console.log(`Inserted ${allCompanyData.length} companies`);
    
    await mongoose.connection.close();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
  }
}

addAllCompanies();
