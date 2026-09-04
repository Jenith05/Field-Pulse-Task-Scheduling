# Decisions

## Decision 1: MongoDB vs PostgreSQL

- **Chose:** MongoDB with Mongoose ODM
- **Rejected:** PostgreSQL with SQL database
- **Why:**
  - Flexible schema beneficial during development as requirements evolved
  - MongoDB Atlas provides easy cloud hosting with free tier
  - Mongoose provides excellent validation and middleware
  - Document-based data structure fits requirements well

## Decision 2: React vs Other Frontend Frameworks

- **Chose:** React with Vite
- **Rejected:** Vue.js, Angular, Svelte
- **Why:**
  - Familiarity and speed of development
  - Large ecosystem and community support
  - Vite provides fast development server
  - Recharts library available for easy charting
  - Component-based architecture matches modular requirements

## Decision 3: Custom CSS vs Tailwind CSS (Later Reversed)

- **Chose:** Custom CSS (originally tried Tailwind)
- **Rejected:** Tailwind CSS
- **Why:**
  - Tailwind had PostCSS plugin compatibility issues
  - Custom CSS gave full control without build complexity
  - Could create exact patterns needed for FieldPulse design
  - Avoided dependency on external CSS framework
- **Later reversed:** Initially tried Tailwind for rapid development, but switched to custom CSS due to build errors. This was the right choice as it eliminated configuration issues and gave complete control over final appearance.

## Decision 4: Express.js vs Other Backend Frameworks

- **Chose:** Express.js
- **Rejected:** Koa, Fastify, NestJS
- **Why:**
  - Most popular Node.js framework with extensive documentation
  - Large ecosystem of middleware packages
  - Simple and lightweight for this project scope
  - Easy to find solutions for common problems
  - No learning curve compared to opinionated frameworks

## Decision 5: JWT vs Session-Based Authentication

- **Chose:** JWT (JSON Web Tokens)
- **Rejected:** Session-based authentication with cookies
- **Why:**
  - Stateless authentication scales better
  - No server-side session storage needed
  - Easy to implement with frontend
  - Industry standard for modern REST APIs
  - Supports easy separation of frontend and backend
  - Simpler for this scale than managing session stores

## Decision 6: Server-Side vs Client-Side Filtering

- **Chose:** Server-side filtering, sorting, and pagination
- **Rejected:** Client-side filtering (load all data and filter in browser)
- **Why:**
  - Performance: Only load data that's actually needed
  - Security: Users can only access data they're authorized to see
  - Scalability: Database grows faster than client memory
  - Requirement explicitly stated server-side filtering was mandatory
  - Prevents unauthorized data access
  - Better pagination and search performance on large datasets

## Decision 7: Simple Pagination vs Cursor-Based Pagination

- **Chose:** Simple offset-based pagination (skip/limit)
- **Rejected:** Cursor-based pagination (using timestamps or IDs)
- **Why:**
  - Simpler to implement for this scale
  - Built-in MongoDB skip/limit support
  - Easier to understand and debug
  - Sufficient for current data volume
  - Trade-off: Performance degradation at large offsets

## Decision 8: Virtual Routes vs Separate Router Files

- **Chose:** Separate router files for each feature area
- **Rejected:** Single router file with all routes
- **Why:**
  - Better code organization and maintainability
  - Easier to find and modify specific features
  - Clear separation of concerns
  - Easier to test individual routes
  - Scales better as application grows

## Decision 9: Immutable Timeline vs Editable History

- **Chose:** Immutable timeline entries (cannot be edited or deleted)
- **Rejected:** Editable history with edit/deletion capabilities
- **Why:**
  - Requirement specified immutable timeline
  - Provides reliable audit trail
  - Prevents tampering with historical data
  - Simpler to implement and validate
  - Trade-off: Cannot correct mistakes in timeline

## Decision 10: CSV Export vs Advanced Reporting

- **Chose:** Simple CSV export for dispatch sheets
- **Rejected:** Advanced reporting with multiple formats
- **Why:**
  - Requirement specified CSV export for dispatch sheets
  - Simpler to implement and maintain
  - Sufficient for immediate use case
  - Could add advanced reporting later
  - Trade-off: Limited reporting capabilities

## Additional Technical Decisions

### **Authentication Token Expiration:**
- **Chose:** 24-hour token expiration
- **Rejected:** Shorter expiration (1 hour) or no expiration
- **Why:** Balance between security and user experience

### **Password Hashing Algorithm:**
- **Chose:** bcryptjs with 10 salt rounds
- **Rejected:** Plain text, MD5, or simpler hashing
- **Why:** Industry standard, good security vs performance balance

### **Database Connection Pooling:**
- **Chose:** Default Mongoose connection pooling
- **Rejected:** Custom pool configuration
- **Why:** Mongoose defaults work well for this scale

### **API Response Format:**
- **Chose:** Consistent JSON responses with message and data
- **Rejected:** Variable response formats
- **Why:** Consistent client-side error handling

### **Frontend State Management:**
- **Chose:** Built-in React useState/useEffect
- **Rejected:** Redux, Context API, or Zustand
- **Why:** Simple enough for this application size

### **Error Handling Strategy:**
- **Chose:** Try-catch with user-friendly messages
- **Rejected:** Global error boundary only
- **Why:** More granular error handling provides better UX

### **Component File Structure:**
- **Chose:** Single file per component
- **Rejected:** Component folders with separate files
- **Why:** Simpler for this scale, easier to navigate

### **Environment Variable Management:**
- **Chose:** .env file with dotenv
- **Rejected:** Hardcoded values or config files
- **Why:** Security best practice, easy deployment

### **API Versioning:**
- **Chose:** No versioning (v1 implied)
- **Rejected:** Versioned API routes (/api/v1/)
- **Why:** MVP doesn't need versioning yet

### **Database Indexing Strategy:**
- **Chose:** Minimal indexing initially
- **Rejected:** Comprehensive indexing from start
- **Why:** Add indexes based on actual query patterns