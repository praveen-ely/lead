# Company Data Management System

A comprehensive web application for managing company data with CRUD operations, analytics dashboard, and advanced filtering capabilities.

## Features

### 🏠 Dashboard
- **Statistics Tiles**: Total companies, today's additions, weekly and monthly growth
- **Visual Analytics**: Industry distribution charts and priority breakdown
- **Quick Stats**: Revenue opportunities and growth metrics

### 📊 Company Management
- **Full CRUD Operations**: Create, Read, Update, Delete companies
- **Advanced Search**: Search by company name, contact person, or email
- **Smart Filtering**: Filter by industry, priority, and location
- **Sorting Options**: Sort by any field with ascending/descending order
- **Pagination**: Efficient data loading with customizable page sizes

### 🎯 Company Details
- **Comprehensive View**: Complete company information display
- **Quick Actions**: Direct links to website, email, and LinkedIn
- **Contact Management**: Full contact information with one-click actions
- **Location & Dates**: Geographic and temporal data visualization

### 🎨 User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Navigation**: Top and left sidebar navigation with icons
- **Clean Layout**: Professional design using Tailwind CSS
- **Interactive Elements**: Hover effects, transitions, and loading states

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **CORS** for cross-origin requests
- **Helmet** for security
- **Rate Limiting** for API protection

## Database Schema

The application stores comprehensive company information including:

- **Basic Info**: Company ID, Name, Website, Industry, Location
- **Company Details**: Employee range, Revenue, Company type, Outsourcing score
- **Contact Information**: Key contact, Role, Email, Phone, LinkedIn
- **Metadata**: Keywords, Trigger events, Notes, Priority, Assignment
- **Timestamps**: Date added, Last website update

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd company-data-management
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```

3. **Environment Setup**
   - Create a `.env` file in the `server` directory
   - Configure your MongoDB connection string:
     ```
    PORT=5002
     MONGODB_URI=mongodb://localhost:27017/company_data
     ```

4. **Start the application**
   ```bash
   npm run dev
   ```

  This will start both the frontend (http://localhost:3001) and backend (http://localhost:5002) concurrently.

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies with pagination and filtering
- `GET /api/companies/:id` - Get a single company
- `POST /api/companies` - Create a new company
- `PUT /api/companies/:id` - Update a company
- `DELETE /api/companies/:id` - Delete a company

### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/filters` - Get available filter options

## Usage

### Navigation
- Use the **top navbar** for search and user profile
- Use the **left sidebar** for main navigation (Dashboard, Companies, etc.)
- Click on company names in the list to view detailed information

### Managing Companies
1. **View Companies**: Navigate to the Companies page to see the full list
2. **Search**: Use the search bar to find specific companies
3. **Filter**: Apply filters by industry, priority, or other criteria
4. **Sort**: Click column headers to sort the data
5. **View Details**: Click the eye icon to see complete company information
6. **Edit**: Click the edit icon to modify company data
7. **Delete**: Click the trash icon to remove a company

### Dashboard Analytics
- Monitor real-time statistics in the dashboard tiles
- View industry distribution and priority breakdowns
- Track growth metrics over different time periods

## Project Structure

```
company-data-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
│   └── package.json
├── server/                # Node.js backend
│   ├── index.js          # Main server file
│   ├── .env              # Environment variables
│   └── package.json
└── package.json          # Root package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For any questions or issues, please open an issue in the repository or contact the development team.
