const buildDummyLeads = (count = 35) => {
  const leads = [];
  for (let i = 0; i < count; i += 1) {
    const idx = i + 1;
    const createdAt = `2026-02-${String(5 + (i % 20)).padStart(2, '0')}T10:22:11`;
    const updatedAt = createdAt;
    const leadId = `U${String(idx).padStart(3, '0')}`;

    leads.push({
      leadId,
      source: 'DummyDataset',
      status: 'qualified',
      priority: 'medium',
      data: {
        id: leadId,
        companyName: `Sample Pharma Company ${idx}`,
        website: `https://company${idx}.com`,
        companyType: 'Private',
        industry: 'Pharmaceuticals',
        foundedYear: 2000 + (idx % 20),
        headquarters: 'Hyderabad',
        revenueRangeCr: '300-600',
        employeeCount: '300-600',
        manufacturingPlants: 3,
        plantLocations: ['Mumbai', 'Pune'],
        certifications: ['ISO', 'USFDA'],
        exportMarkets: ['USA', 'EU'],
        contactName: `Contact Person ${idx}`,
        contactRole: 'Director',
        email: `contact${idx}@company${idx}.com`,
        phone: '+91-9123456789',
        linkedinProfile: `https://linkedin.com/in/contact${idx}`,
        contactScore: 20 + (idx % 10),
        aiScore: 70 + (idx % 20),
        probabilityPercent: 60 + (idx % 30),
        opportunitySizeLakhs: 150 + (idx % 100),
        priority: 'MEDIUM',
        leadStatus: 'Qualified',
        leadSource: 'AI',
        assignedTo: `SalesUser${(idx % 5) + 1}`,
        lastContactedAt: '2026-01-18T10:22:11',
        nextFollowUpAt: '2026-02-05T10:22:11',
        internalNotes: 'AI generated sample lead',
        companyNotes: 'High potential pharmaceutical company',
        attachments: [],
        createdAt,
        updatedAt,
        createdBy: 'system',
        isActive: true
      },
      dateAdded: createdAt,
      lastUpdated: updatedAt
    });
  }

  return leads;
};

module.exports = {
  buildDummyLeads
};
