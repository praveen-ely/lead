export interface User {
  _id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  occupation: string;
  company: string;
  department: string;
  jobTitle: string;
  employeeId: string;
  joinDate: Date;
  salary: number;
  workType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  skills: string;
  experience: number;
  education: string;
  certifications: string;
  emergencyContact: string;
  emergencyPhone: string;
  relationship: string;
  bloodGroup: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  nationality: string;
  languages: string;
  hobbies: string;
  socialMedia: string;
  notes: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  dateAdded: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  total: number;
  today: number;
  lastWeek: number;
  lastMonth: number;
  byDepartment: Array<{ _id: string; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  byWorkType: Array<{ _id: string; count: number }>;
}

export interface UserFilters {
  departments: string[];
  statuses: string[];
  workTypes: string[];
  cities: string[];
  states: string[];
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
