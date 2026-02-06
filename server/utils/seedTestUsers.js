const AuthUser = require('../models/authUserModel');

const testUsers = [
  {
    email: 'makin@user.com',
    password: 'makin@user.com',
    firstName: 'Makin',
    lastName: 'User',
    role: 'user'
  },
  {
    email: 'admin@elymento.ai',
    password: 'admin@elymento.ai',
    firstName: 'Elymento',
    lastName: 'Admin',
    role: 'admin'
  },
  {
    email: 'pn1@gmail.com',
    password: 'pn1@gmail.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  },
  {
    email: 'pn2@gmail.com',
    password: 'pn2@gmail.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    email: 'pn3@gmail.com',
    password: 'pn3@gmail.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  }
];

const ensureTestUsers = async () => {
  try {
    for (const userData of testUsers) {
      const existingUser = await AuthUser.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new AuthUser(userData);
        await user.save();
        continue;
      }

      existingUser.firstName = userData.firstName;
      existingUser.lastName = userData.lastName;
      existingUser.role = userData.role;
      existingUser.isActive = true;
      existingUser.password = userData.password;
      await existingUser.save();
    }
  } catch (error) {
    console.error('Error ensuring test users:', error);
  }
};

module.exports = { ensureTestUsers };
