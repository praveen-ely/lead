const mongoose = require('mongoose');
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  occupation: { type: String, required: true },
  company: { type: String, required: true },
  department: { type: String, required: true },
  jobTitle: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  joinDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  workType: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
  status: { type: String, required: true, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'] },
  skills: { type: String, required: true },
  experience: { type: Number, required: true },
  education: { type: String, required: true },
  certifications: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  relationship: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  maritalStatus: { type: String, required: true, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  nationality: { type: String, required: true },
  languages: { type: String, required: true },
  hobbies: { type: String, required: true },
  socialMedia: { type: String, required: true },
  notes: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  assignedTo: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

const additionalUsers = [
  {
    userId: 'USR0037',
    firstName: 'Swati',
    lastName: 'Kumar',
    email: 'swati.kumar@techcorp.com',
    phone: '+91-9876543267',
    dateOfBirth: new Date('1985-07-06T18:30:00.000Z'),
    gender: 'Female',
    address: '552, Main Street',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    zipCode: '553153',
    occupation: 'Coordinator',
    company: 'TechCorp Solutions',
    department: 'Sales',
    jobTitle: 'Coordinator Engineering',
    employeeId: 'TC037',
    joinDate: new Date('2022-10-03T18:30:00.000Z'),
    salary: 862746,
    workType: 'Full-time',
    status: 'Active',
    skills: 'Communication, Leadership',
    experience: 4,
    education: 'B.Tech',
    certifications: 'AWS Certified',
    emergencyContact: 'Swati Kumar Sr.',
    emergencyPhone: '+91-9876544267',
    relationship: 'Mother',
    bloodGroup: 'B+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    languages: 'English, Hindi',
    hobbies: 'Music, Dance',
    socialMedia: 'linkedin.com/in/swatikumar',
    notes: 'Team player with good communication skills',
    priority: 'Low',
    assignedTo: 'Manager E',
    dateAdded: new Date('2023-08-13T18:30:00.000Z')
  },
  {
    userId: 'USR0038',
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@techcorp.com',
    phone: '+91-9876543268',
    dateOfBirth: new Date('1990-03-15T10:00:00.000Z'),
    gender: 'Male',
    address: '123, Park Avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    zipCode: '400001',
    occupation: 'Software Engineer',
    company: 'TechCorp Solutions',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    employeeId: 'TC038',
    joinDate: new Date('2021-06-01T09:00:00.000Z'),
    salary: 1200000,
    workType: 'Full-time',
    status: 'Active',
    skills: 'JavaScript, React, Node.js, MongoDB, Python',
    experience: 6,
    education: 'B.Tech Computer Science',
    certifications: 'AWS Certified Developer, Google Cloud Professional',
    emergencyContact: 'Sharma Sr.',
    emergencyPhone: '+91-9876543269',
    relationship: 'Father',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    nationality: 'Indian',
    languages: 'English, Hindi, Marathi',
    hobbies: 'Coding, Reading, Traveling',
    socialMedia: 'linkedin.com/in/rahulsharma, github.com/rahulsharma',
    notes: 'Full-stack developer with expertise in modern web technologies',
    priority: 'High',
    assignedTo: 'Manager A',
    dateAdded: new Date('2021-06-01T09:00:00.000Z')
  },
  {
    userId: 'USR0039',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@techcorp.com',
    phone: '+91-9876543269',
    dateOfBirth: new Date('1992-08-22T14:30:00.000Z'),
    gender: 'Female',
    address: '456, Residency Road',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zipCode: '560038',
    occupation: 'Product Manager',
    company: 'TechCorp Solutions',
    department: 'Product',
    jobTitle: 'Product Manager',
    employeeId: 'TC039',
    joinDate: new Date('2020-03-15T11:00:00.000Z'),
    salary: 1500000,
    workType: 'Full-time',
    status: 'Active',
    skills: 'Product Strategy, Agile, Scrum, Data Analysis, UX Design',
    experience: 5,
    education: 'MBA Marketing',
    certifications: 'PMP Certified, Scrum Master',
    emergencyContact: 'Patel Sr.',
    emergencyPhone: '+91-9876543270',
    relationship: 'Father',
    bloodGroup: 'A+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    languages: 'English, Hindi, Gujarati',
    hobbies: 'Yoga, Painting, Reading',
    socialMedia: 'linkedin.com/in/priyapatel',
    notes: 'Product manager with strong leadership and strategic thinking skills',
    priority: 'High',
    assignedTo: 'Manager B',
    dateAdded: new Date('2020-03-15T11:00:00.000Z')
  },
  {
    userId: 'USR0040',
    firstName: 'Amit',
    lastName: 'Singh',
    email: 'amit.singh@techcorp.com',
    phone: '+91-9876543270',
    dateOfBirth: new Date('1988-12-10T16:45:00.000Z'),
    gender: 'Male',
    address: '789, Commercial Street',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    zipCode: '110001',
    occupation: 'DevOps Engineer',
    company: 'TechCorp Solutions',
    department: 'Infrastructure',
    jobTitle: 'DevOps Lead',
    employeeId: 'TC040',
    joinDate: new Date('2019-09-20T10:00:00.000Z'),
    salary: 1400000,
    workType: 'Full-time',
    status: 'Active',
    skills: 'Docker, Kubernetes, AWS, Azure, CI/CD, Terraform',
    experience: 8,
    education: 'B.E Computer Science',
    certifications: 'AWS DevOps Engineer, Kubernetes Administrator',
    emergencyContact: 'Singh Sr.',
    emergencyPhone: '+91-9876543271',
    relationship: 'Father',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    nationality: 'Indian',
    languages: 'English, Hindi, Punjabi',
    hobbies: 'Gaming, Trekking, Photography',
    socialMedia: 'linkedin.com/in/amitsingh, github.com/amitsingh',
    notes: 'DevOps expert with cloud specialization and infrastructure automation',
    priority: 'Medium',
    assignedTo: 'Manager C',
    dateAdded: new Date('2019-09-20T10:00:00.000Z')
  },
  {
    userId: 'USR0041',
    firstName: 'Neha',
    lastName: 'Gupta',
    email: 'neha.gupta@techcorp.com',
    phone: '+91-9876543271',
    dateOfBirth: new Date('1993-04-18T12:00:00.000Z'),
    gender: 'Female',
    address: '321, Koramangala 5th Block',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zipCode: '560095',
    occupation: 'UX Designer',
    company: 'TechCorp Solutions',
    department: 'Design',
    jobTitle: 'Senior UX Designer',
    employeeId: 'TC041',
    joinDate: new Date('2021-07-01T10:00:00.000Z'),
    salary: 900000,
    workType: 'Full-time',
    status: 'Active',
    skills: 'Figma, Adobe XD, Sketch, User Research, Prototyping',
    experience: 4,
    education: 'B.Des Visual Communication',
    certifications: 'Google UX Design Certificate',
    emergencyContact: 'Gupta Sr.',
    emergencyPhone: '+91-9876543272',
    relationship: 'Brother',
    bloodGroup: 'AB+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    languages: 'English, Hindi, Bengali',
    hobbies: 'Sketching, Music, Travel',
    socialMedia: 'linkedin.com/in/nehagupta, behance.net/nehagupta',
    notes: 'Creative designer with user-centric approach and modern design principles',
    priority: 'Medium',
    assignedTo: 'Manager D',
    dateAdded: new Date('2021-07-01T10:00:00.000Z')
  }
];

async function addMoreUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists, if not, insert
    let addedCount = 0;
    for (const user of additionalUsers) {
      const existingUser = await User.findOne({ 
        $or: [
          { userId: user.userId },
          { email: user.email }
        ]
      });
      if (!existingUser) {
        await User.create(user);
        console.log(`Added user: ${user.firstName} ${user.lastName} (${user.userId})`);
        addedCount++;
      } else {
        console.log(`User already exists: ${user.userId} / ${user.email}`);
      }
    }

    // Display statistics
    const total = await User.countDocuments();
    console.log(`\nTotal users in database: ${total}`);
    console.log(`New users added: ${addedCount}`);

  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    mongoose.connection.close();
  }
}

addMoreUsers();
