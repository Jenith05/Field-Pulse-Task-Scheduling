# Architecture

## Moving Pieces and Communication

### **Frontend (React + Vite)**
- **Location:** Client-side browser application
- **Responsibilities:** User interface, authentication, job management, technician assignment, parts tracking, dashboard with charts
- **Technology:** React 18, Vite, React Router, Axios, Recharts, custom CSS
- **Communication:** HTTP requests to backend API via Axios with JWT tokens

### **Backend (Node.js + Express)**
- **Location:** Server-side application (deployable to Render/Heroku)
- **Responsibilities:** REST API endpoints, authentication, authorization, business logic, database operations
- **Technology:** Express.js, Mongoose, JWT, bcryptjs, express-validator
- **Communication:** Serves REST API at `/api/*`, connects to MongoDB Atlas

### **Database (MongoDB Atlas)**
- **Location:** Cloud-hosted MongoDB database (free tier)
- **Responsibilities:** Data persistence, relationships, indexing
- **Technology:** MongoDB Atlas, Mongoose ODM
- **Communication:** Connected via Mongoose from backend

## Request Path Example: Technician Updating Job Status

1. **User Action:** Technician clicks "Mark as En Route" button
2. **Frontend:** Calls `lifecycleAPI.updateStatus(jobId, 'en_route')` via Axios with JWT token
3. **API Request:** PUT `/api/lifecycle/{jobId}/status` with authorization header
4. **Backend:**
   - Middleware validates JWT token and technician role
   - Validates status transition rules
   - Checks if technician is assigned to the job
   - Updates job status in MongoDB
   - Creates timeline entry for audit trail
5. **Database:** MongoDB updates job document and inserts timeline entry
6. **Response:** Success message with updated job data
7. **Frontend:** Updates UI with new status and shows success message

## Component Architecture

### **Frontend Components:**
- **Login.jsx:** Authentication with demo quick sign-in
- **Dashboard.jsx:** Statistics, charts, navigation
- **JobsList.jsx:** Job table with filters, search, pagination
- **JobDetail.jsx:** Job view with status progression, parts, assignments
- **ProtectedRoute.jsx:** Authentication guard

### **Backend Routes:**
- **auth.js:** Authentication endpoints
- **jobs.js:** Job CRUD, search, filter, archive
- **assignments.js:** Technician assignment, bulk assignment
- **lifecycle.js:** Status transitions, running-late alerts
- **parts.js:** Parts CRUD operations
- **dashboard.js:** Statistics, CSV export

### **Backend Middleware:**
- **auth.js:** JWT validation, role-based access control

### **Data Models:**
- **User.js:** User schema with password hashing
- **Job.js:** Job schema with status lifecycle
- **Part.js:** Parts schema with job reference
- **Timeline.js:** Timeline schema with immutable constraints

## Security Architecture

### **Authentication:**
- JWT tokens stored in localStorage
- Tokens included in Authorization header
- 24-hour token expiration
- Passwords hashed with bcryptjs

### **Authorization:**
- **Dispatcher role:** Full access to all operations
- **Technician role:** Can only see/edit assigned jobs
- Server-side role checks in middleware

### **Data Security:**
- Environment variables for sensitive data
- No credentials in repository
- MongoDB Atlas IP whitelist

## What I Decided Not to Build

- **Real-time notifications:** Could add WebSockets later
- **Mobile app:** Focused on web application
- **Route optimization:** Would require mapping API
- **File upload for attachments:** Would add storage complexity
- **Technician skill matching:** Not in core requirements
- **Email notifications:** Would require SMTP integration
- **Advanced reporting:** Kept to CSV export as required

## Technology Choices

- **MongoDB over PostgreSQL:** Flexible schema, Atlas free tier, document-based model fits requirements
- **React over Vue/Angular:** Familiarity, large ecosystem, Recharts integration
- **Custom CSS over Tailwind:** Eliminated PostCSS configuration issues, precise design control
- **Express.js over NestJS:** Simplicity, lightweight, extensive middleware
- **JWT over Sessions:** Stateless, industry standard, easier to scale

## Data Flow Patterns

### **User Registration Flow:**
1. User submits registration form with email, password, name, role
2. Frontend validates input format
3. Backend hashes password with bcryptjs
4. User document created in MongoDB
5. JWT token generated and returned
6. Frontend stores token and redirects to dashboard

### **Job Creation Flow:**
1. Dispatcher fills job creation form
2. Frontend validates required fields
3. Backend validates enum values (priority, status)
4. Job document created with initial status 'unassigned'
5. Timeline entry created for job creation event
6. Dashboard statistics updated

### **Bulk Assignment Flow:**
1. Dispatcher selects multiple unassigned jobs
2. Frontend sends array of job IDs and technician ID
3. Backend processes each job sequentially
4. For each job: checks scheduling conflicts
5. Updates assignment and status where no conflicts
6. Returns detailed success/failure report
7. Frontend displays results to user

## Error Handling Strategy

### **Frontend Error Handling:**
- Try-catch blocks around all API calls
- User-friendly error messages displayed
- Form validation before API requests
- Loading states during async operations
- Fallback UI for failed data loads

### **Backend Error Handling:**
- Express error handling middleware
- Validation errors returned with 400 status
- Authentication errors return 401 status
- Authorization errors return 403 status
- Database errors return 500 status
- Consistent error response format

## Performance Considerations

### **Database Optimization:**
- Indexes on frequently queried fields
- Population of related documents to reduce queries
- Server-side filtering to limit data transfer
- Pagination to limit large result sets

### **Frontend Optimization:**
- Lazy loading of data when needed
- Debounced search inputs
- Efficient state updates
- Minimal re-renders with React hooks
- Cached API responses where appropriate

## Security Best Practices

### **Input Validation:**
- All user inputs validated on backend
- Express-validator for schema validation
- Sanitization of user-generated content
- Length limits on text fields
- Type checking for numeric fields

### **API Security:**
- CORS configuration for allowed origins
- Rate limiting on sensitive endpoints
- HTTPS enforcement in production
- Secure headers (helmet middleware)
- SQL injection prevention (not applicable with MongoDB)

### **Data Protection:**
- Passwords never stored in plain text
- JWT secrets in environment variables
- Database connection strings in environment variables
- No sensitive data in repository
- Regular security updates for dependencies