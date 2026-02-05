const axios = require('axios');
const Lead = require('../models/leadModel');

class ThirdPartyLeadService {
  constructor() {
    this.rateLimits = new Map();
    this.apiEndpoints = {
      jsonplaceholder: 'https://jsonplaceholder.typicode.com/users',
      randomuser: 'https://randomuser.me/api/',
      dummyjson: 'https://dummyjson.com/users'
    };
  }

  // Fetch leads from third-party sources
  async fetchLeadsFromThirdParty(source = 'jsonplaceholder') {
    try {
      const endpoint = this.apiEndpoints[source];
      if (!endpoint) {
        throw new Error(`Unsupported source: ${source}`);
      }

      // Check rate limiting
      if (this.isRateLimited(source)) {
        throw new Error(`Rate limit exceeded for ${source}`);
      }

      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'LeadGen-Pro/1.0'
        }
      });

      const leads = this.transformToLeadFormat(response.data, source);
      await this.saveLeads(leads);
      
      this.updateRateLimit(source);
      
      return {
        success: true,
        source,
        leadsFetched: leads.length,
        leads
      };
    } catch (error) {
      console.error(`Error fetching leads from ${source}:`, error.message);
      return {
        success: false,
        source,
        error: error.message
      };
    }
  }

  // Transform third-party data to lead format
  transformToLeadFormat(data, source) {
    let leads = [];

    switch (source) {
      case 'jsonplaceholder':
        leads = data.map(user => ({
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company?.name || 'Unknown Company',
          website: user.website,
          source: 'jsonplaceholder',
          status: 'new',
          priority: 'medium',
          score: Math.floor(Math.random() * 100),
          tags: ['imported', 'jsonplaceholder'],
          metadata: {
            temperature: 'cold',
            sourceId: user.id
          }
        }));
        break;

      case 'randomuser':
        if (data.results) {
          leads = data.results.map(user => ({
            name: `${user.name.first} ${user.name.last}`,
            email: user.email,
            phone: user.phone,
            company: 'Random Company',
            source: 'randomuser',
            status: 'new',
            priority: 'low',
            score: Math.floor(Math.random() * 100),
            tags: ['imported', 'randomuser'],
            metadata: {
              temperature: 'cold',
              sourceId: user.login.uuid
            }
          }));
        }
        break;

      case 'dummyjson':
        if (data.users) {
          leads = data.users.map(user => ({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            company: user.company?.name || 'Unknown Company',
            source: 'dummyjson',
            status: 'new',
            priority: 'medium',
            score: Math.floor(Math.random() * 100),
            tags: ['imported', 'dummyjson'],
            metadata: {
              temperature: 'cold',
              sourceId: user.id
            }
          }));
        }
        break;
    }

    return leads;
  }

  // Save leads to database
  async saveLeads(leads) {
    const savedLeads = [];
    
    for (const leadData of leads) {
      try {
        // Check if lead already exists
        const existingLead = await Lead.findOne({ 
          email: leadData.email,
          source: leadData.source
        });

        if (!existingLead) {
          const lead = new Lead({
            ...leadData,
            leadId: `${leadData.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dateAdded: new Date(),
            dateUpdated: new Date()
          });
          
          const savedLead = await lead.save();
          savedLeads.push(savedLead);
        }
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }

    return savedLeads;
  }

  // Rate limiting check
  isRateLimited(source) {
    const now = Date.now();
    const lastRequest = this.rateLimits.get(source);
    
    if (lastRequest && (now - lastRequest) < 60000) { // 1 minute cooldown
      return true;
    }
    
    return false;
  }

  // Update rate limit
  updateRateLimit(source) {
    this.rateLimits.set(source, Date.now());
  }

  // Get available sources
  getAvailableSources() {
    return Object.keys(this.apiEndpoints);
  }

  // Manual trigger for lead import
  async triggerManualImport(source) {
    console.log(`Starting manual import from ${source}...`);
    const result = await this.fetchLeadsFromThirdParty(source);
    console.log(`Import result:`, result);
    return result;
  }
}

module.exports = new ThirdPartyLeadService();
