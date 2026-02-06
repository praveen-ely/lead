export interface Company {
  _id?: string;
  companyId: string;
  companyName: string;
  website: string;
  industry: string;
  city: string;
  state: string;
  employeeRange: string;
  estimatedRevenue: string;
  outsourcingScore: number;
  companyType: string;
  keyContact: string;
  contactRole: string;
  email: string;
  phone: string;
  linkedInProfile: string;
  keywordsFound: string;
  triggerEvents: string;
  lastWebsiteUpdate: Date;
  notes: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  dateAdded: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Stats {
  total: number;
  today: number;
  lastWeek: number;
  lastMonth: number;
  byIndustry: Array<{ _id: string; count: number }>;
  byPriority: Array<{ _id: string; count: number }>;
}

export interface Filters {
  industries: string[];
  priorities: string[];
  states: string[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CompaniesResponse {
  companies: Company[];
  pagination: PaginationInfo;
}
