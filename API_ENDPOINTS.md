# Lead Insertion API Endpoints

## Base URL
```
http://localhost:5002/api/leads
```

---

## 1. Single Lead Insertion

### Endpoint
```
POST /api/leads/insert
```

### Headers
```
Content-Type: application/json
```

### Request Body (Single Lead Format)
```json
{
  "leadId": "A100",
  "assignedTo": "user123",
  "data": {
    "companyName": "Tech Solutions Pvt Ltd",
    "contactPerson": "John Doe",
    "email": "john@techsolutions.com",
    "phone": "+91-9876543210",
    "city": "Mumbai",
    "state": "Maharashtra",
    "industry": "Technology",
    "employeeCount": "50-100",
    "headquarters": "Mumbai Maharashtra",
    "plantLocations": "Pune Maharashtra",
    "website": "https://techsolutions.com",
    "annualRevenue": "10-50 Cr",
    "customField1": "Value 1",
    "customField2": "Value 2"
  }
}
```

### Request Body (Without leadId - Auto-generated)
```json
{
  "assignedTo": "user123",
  "data": {
    "companyName": "New Company Ltd",
    "contactPerson": "Jane Smith",
    "email": "jane@newcompany.com",
    "phone": "+91-9876543211",
    "city": "Delhi",
    "state": "Delhi",
    "industry": "Manufacturing",
    "employeeCount": "100-500",
    "headquarters": "Delhi Delhi",
    "website": "https://newcompany.com"
  }
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "leadId": "A100",
    "id": "A100",
    "assignedTo": "user123",
    "customFields": {
      "companyName": "Tech Solutions Pvt Ltd",
      "contactPerson": "John Doe",
      "email": "john@techsolutions.com",
      "phone": "+91-9876543210",
      "city": "Mumbai",
      "state": "Maharashtra",
      "industry": "Technology",
      "employeeCount": "50-100",
      "headquarters": "Mumbai Maharashtra",
      "plantLocations": "Pune Maharashtra",
      "website": "https://techsolutions.com",
      "annualRevenue": "10-50 Cr",
      "customField1": "Value 1",
      "customField2": "Value 2"
    },
    "dateAdded": "2026-02-05T10:30:00.000Z",
    "dateUpdated": "2026-02-05T10:30:00.000Z",
    "createdAt": "2026-02-05T10:30:00.000Z",
    "updatedAt": "2026-02-05T10:30:00.000Z"
  }
}
```

---

## 2. Bulk Lead Insertion (via /insert endpoint)

### Endpoint
```
POST /api/leads/insert
```

### Headers
```
Content-Type: application/json
```

### Request Body (Bulk Format - data as array)
**Note**: `leadId` in data array items will be **ignored**. Sequential leadIds (A1, A2, A3...) will be auto-generated.

```json
{
  "assignedTo": "6982f86ec540cf5f1cc1573d",
  "data": [
    {
      "companyName": "Pharma Company 21",
      "website": "https://company21.com",
      "companyType": "Startup",
      "foundedYear": 1990,
      "headquarters": "Ahmedabad, Gujarat",
      "revenueRangeCr": "100-500",
      "employeeCount": "101-500",
      "manufacturingPlants": 1,
      "plantLocations": ["Ahmedabad"],
      "segment": ["Ointments", "Creams"],
      "exportPercent": 70,
      "certifications": ["WHO-GMP"],
      "productsCount": 13,
      "therapeuticArea": "CNS",
      "keyProduct": "Key Product A",
      "businessModel": "CDMO",
      "exportMarkets": ["Africa"],
      "regulatoryWarnings": 3,
      "usfdaApproval": true,
      "leadSource": "CDSCO",
      "triggerEvent": "Expansion",
      "triggerDate": "2025-01-22",
      "sourceUrl": "https://source.com",
      "contactName": "Decision Maker 21",
      "contactRole": "Head Operations",
      "email": "contact21@company21.com",
      "lastContactedAt": "2025-01-24",
      "contactChannel": "Email",
      "score": 76,
      "priority": "MEDIUM",
      "leadStatus": "Contacted",
      "opportunitySizeLakhs": 532,
      "probabilityPercent": 25,
      "notes": "Auto-generated lead",
      "dataSource": "Fake pharma data"
    },
    {
      "companyName": "Pharma Company 22",
      "website": "https://company22.com",
      "companyType": "Startup",
      "foundedYear": 2011,
      "headquarters": "Hyderabad, Telangana",
      "revenueRangeCr": "500-1000",
      "employeeCount": "101-500",
      "manufacturingPlants": 3,
      "plantLocations": ["Hyderabad"],
      "segment": ["Biologics"],
      "exportPercent": 75,
      "certifications": ["WHO-GMP", "USFDA", "EU-GMP"],
      "productsCount": 28,
      "therapeuticArea": "Diabetology",
      "keyProduct": "Key Product A",
      "businessModel": "API",
      "exportMarkets": ["Africa"],
      "regulatoryWarnings": 2,
      "usfdaApproval": false,
      "leadSource": "News",
      "triggerEvent": "Expansion",
      "triggerDate": "2025-01-23",
      "sourceUrl": "https://source.com",
      "contactName": "Decision Maker 22",
      "contactRole": "Head Operations",
      "email": "contact22@company22.com",
      "lastContactedAt": "2025-01-25",
      "contactChannel": "LinkedIn",
      "score": 78,
      "priority": "MEDIUM",
      "leadStatus": "Proposal",
      "opportunitySizeLakhs": 548,
      "probabilityPercent": 25,
      "notes": "Auto-generated lead",
      "dataSource": "Fake pharma data"
    }
  ]
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Successfully inserted 3 leads",
  "data": [
    {
      "_id": "65f1234567890abcdef12346",
      "leadId": "A101",
      "id": "A101",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Company One",
        "contactPerson": "Person One",
        "email": "one@company.com",
        "phone": "+91-9876543212",
        "city": "Bangalore",
        "state": "Karnataka",
        "industry": "IT Services",
        "employeeCount": "50-100",
        "headquarters": "Bangalore Karnataka"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12347",
      "leadId": "A102",
      "id": "A102",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Company Two",
        "contactPerson": "Person Two",
        "email": "two@company.com",
        "phone": "+91-9876543213",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "industry": "Manufacturing",
        "employeeCount": "100-500",
        "headquarters": "Chennai Tamil Nadu"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12348",
      "leadId": "A103",
      "id": "A103",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Company Three",
        "contactPerson": "Person Three",
        "email": "three@company.com",
        "phone": "+91-9876543214",
        "city": "Hyderabad",
        "state": "Telangana",
        "industry": "Healthcare",
        "employeeCount": "10-50"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    }
  ],
  "count": 3
}
```

---

## 3. Bulk Lead Insertion (via /insert/bulk endpoint)

### Endpoint
```
POST /api/leads/insert/bulk
```

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "assignedTo": "user123",
  "leads": [
    {
      "leadId": "A201",
      "companyName": "Bulk Company One",
      "contactPerson": "Bulk Person One",
      "email": "bulk1@company.com",
      "phone": "+91-9876543221",
      "city": "Pune",
      "state": "Maharashtra",
      "industry": "Software",
      "employeeCount": "200-500",
      "headquarters": "Pune Maharashtra"
    },
    {
      "leadId": "A202",
      "companyName": "Bulk Company Two",
      "contactPerson": "Bulk Person Two",
      "email": "bulk2@company.com",
      "phone": "+91-9876543222",
      "city": "Kolkata",
      "state": "West Bengal",
      "industry": "Finance",
      "employeeCount": "500-1000",
      "headquarters": "Kolkata West Bengal"
    },
    {
      "companyName": "Bulk Company Three",
      "contactPerson": "Bulk Person Three",
      "email": "bulk3@company.com",
      "phone": "+91-9876543223",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "industry": "Retail",
      "employeeCount": "50-100"
    }
  ]
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Successfully inserted 3 leads",
  "data": [
    {
      "_id": "65f1234567890abcdef12349",
      "leadId": "A201",
      "id": "A201",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Bulk Company One",
        "contactPerson": "Bulk Person One",
        "email": "bulk1@company.com",
        "phone": "+91-9876543221",
        "city": "Pune",
        "state": "Maharashtra",
        "industry": "Software",
        "employeeCount": "200-500",
        "headquarters": "Pune Maharashtra"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12350",
      "leadId": "A202",
      "id": "A202",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Bulk Company Two",
        "contactPerson": "Bulk Person Two",
        "email": "bulk2@company.com",
        "phone": "+91-9876543222",
        "city": "Kolkata",
        "state": "West Bengal",
        "industry": "Finance",
        "employeeCount": "500-1000",
        "headquarters": "Kolkata West Bengal"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12351",
      "leadId": "A203",
      "id": "A203",
      "assignedTo": "user123",
      "customFields": {
        "companyName": "Bulk Company Three",
        "contactPerson": "Bulk Person Three",
        "email": "bulk3@company.com",
        "phone": "+91-9876543223",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "industry": "Retail",
        "employeeCount": "50-100"
      },
      "dateAdded": "2026-02-05T10:30:00.000Z",
      "dateUpdated": "2026-02-05T10:30:00.000Z"
    }
  ],
  "count": 3
}
```

---

## Important Notes

1. **Authentication**: Both endpoints are **PUBLIC** (no token required)

2. **leadId**: 
   - **For bulk inserts**: `leadId` in data array items will be **IGNORED**. Sequential leadIds (A1, A2, A3...) will be auto-generated automatically
   - **For single inserts**: If `leadId` is not provided, it will be auto-generated sequentially (A1, A2, A3...)
   - `leadId` is **unique** and **primary** field
   - Sequential IDs are generated based on the maximum existing leadId number + 1

3. **assignedTo**: 
   - Required for bulk inserts
   - Must be a valid MongoDB ObjectId string (e.g., "6982f86ec540cf5f1cc1573d")
   - **Validated**: The system checks if the user exists in the AuthUser collection
   - If invalid user ID is provided, API will return 400 error with message

4. **customFields**: 
   - All fields in the `data` object/array items (except `leadId`) are stored in `customFields`
   - You can add any custom fields you want
   - Supports nested objects, arrays, and all data types

5. **Update Behavior**: 
   - If a lead with the same `leadId` exists, it will be updated (merged with existing customFields)
   - New leads will be created if `leadId` doesn't exist
   - For bulk inserts, sequential IDs ensure no duplicates

6. **Error Handling**: 
   - If some leads fail in bulk insert, they will be reported in the `errors` array
   - Successful leads will still be returned in the `data` array
   - Each error includes the index and error message

---

## Thunder Client Setup

1. **Method**: POST
2. **URL**: `http://localhost:5002/api/leads/insert` or `http://localhost:5002/api/leads/insert/bulk`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body**: Copy any of the sample JSON bodies above

---

## Quick Test Examples

### Test 1: Single Lead with leadId
```json
{
  "leadId": "TEST001",
  "assignedTo": "testuser",
  "data": {
    "companyName": "Test Company",
    "email": "test@company.com",
    "city": "Mumbai"
  }
}
```

### Test 2: Single Lead without leadId (auto-generated)
```json
{
  "assignedTo": "testuser",
  "data": {
    "companyName": "Auto Generated Lead",
    "email": "auto@company.com",
    "city": "Delhi"
  }
}
```

### Test 3: Bulk Insert (3 leads)
```json
{
  "assignedTo": "testuser",
  "data": [
    { "companyName": "Lead 1", "email": "lead1@test.com", "city": "Mumbai" },
    { "companyName": "Lead 2", "email": "lead2@test.com", "city": "Delhi" },
    { "companyName": "Lead 3", "email": "lead3@test.com", "city": "Bangalore" }
  ]
}
```
