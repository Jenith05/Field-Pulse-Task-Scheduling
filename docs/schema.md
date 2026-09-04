# Schema

## Database Collections and Columns

### **Users Collection**
- `_id`: ObjectId (primary key)
- `email`: String (unique, required) - User's email address
- `password`: String (required, hashed) - Bcrypt hashed password
- `name`: String (required) - User's full name
- `role`: String (enum: 'dispatcher', 'technician') - User role for authorization
- `createdAt`: Date - Account creation timestamp
- `updatedAt`: Date - Last update timestamp

### **Jobs Collection**
- `_id`: ObjectId (primary key)
- `customerName`: String (required) - Customer's name
- `siteAddress`: String (required) - Job location address
- `description`: String (required) - Work description
- `priority`: String (enum: 'low', 'medium', 'high', 'emergency') - Job priority level
- `scheduledDate`: Date (required) - When the job is scheduled
- `startTime`: String (required, format: HH:MM) - Start time
- `estimatedDuration`: Number (required) - Duration in hours
- `status`: String (enum: 'unassigned', 'assigned', 'en_route', 'on_site', 'completed') - Current job status
- `assignedTechnicians`: Array of ObjectIds (foreign key to Users) - Technicians assigned to job
- `completionNote`: String - Note when job is completed
- `isArchived`: Boolean - Whether job is archived
- `archivedAt`: Date - When job was archived
- `createdAt`: Date - Job creation timestamp
- `updatedAt`: Date - Last update timestamp

### **Parts Collection**
- `_id`: ObjectId (primary key)
- `job`: ObjectId (foreign key to Jobs, required) - Which job this part belongs to
- `partName`: String (required) - Name of the part
- `quantity`: Number (required, min: 1) - Quantity used
- `recordedBy`: ObjectId (foreign key to Users, required) - Who recorded this part
- `createdAt`: Date - When part was recorded

### **Timeline Collection**
- `_id`: ObjectId (primary key)
- `job`: ObjectId (foreign key to Jobs, required) - Which job this event belongs to
- `eventType`: String (enum: 'created', 'status_change', 'technician_assigned', 'technician_unassigned', 'completed', 'part_added', 'note_added', 'archived', 'restored') - Type of event
- `description`: String (required) - Description of what happened
- `performedBy`: ObjectId (foreign key to Users, required) - Who performed the action
- `metadata`: Object - Additional event data (flexible schema)
- `createdAt`: Date (immutable) - When the event occurred

## Relationships

### **One-to-Many:**
- **User → Jobs**: One user (dispatcher) can create many jobs
- **User → Timeline**: One user can create many timeline entries
- **Job → Parts**: One job can have many parts
- **Job → Timeline**: One job can have many timeline events

### **Many-to-Many:**
- **Jobs ↔ Technicians**: One job can have many technicians, one technician can have many jobs (via `assignedTechnicians` array)

## Constraints

### **Database-Level:**
- Unique email constraint
- Required field validation
- Enum value validation
- Foreign key reference integrity

### **Application-Level:**
- JWT token validation for authentication
- Role-based access control (dispatcher vs technician)
- Status transition rules (cannot skip statuses)
- Scheduling conflict detection (N^2 overlap checking)
- Parts restriction on completed jobs
- Timeline immutability (cannot edit/delete)

**Why draw the line here:** Business logic like status transitions and scheduling conflicts is easier to test and modify in application code. Data integrity (required fields, references) belongs in database for consistency.

## Denormalization

- **Technician Names in Jobs:** Stored ObjectIds but populate with full user details when fetching to reduce queries
- **Status Metadata in Timeline:** Stores old and new status in metadata for complete history, avoids complex historical queries

## Scalability Considerations

### **What would break first at 100x data:**

1. **Indexing:** Need compound indexes on (scheduledDate + status) and on `assignedTechnicians` for performance
2. **Pagination:** Current implementation works but would need cursor-based pagination for large datasets
3. **Memory usage:** Timeline collection would grow very large, would need archiving or cleanup strategy
4. **API response times:** Large queries would slow down, already implemented server-side filtering and pagination
5. **Scheduling conflict detection:** Current N^2 overlap checking would become slow, would need spatial indexing or pre-computed availability windows

## Database Indexing Strategy

### **Current Indexes:**
- **Users:** Unique index on `email` for authentication
- **Jobs:** Default indexes on `_id`, compound index needed on `scheduledDate` + `status`
- **Parts:** Index on `job` for efficient lookups by job
- **Timeline:** Index on `job` and `createdAt` for chronological queries

### **Recommended Additional Indexes:**
- **Jobs:** Index on `assignedTechnicians` for technician job queries
- **Jobs:** Index on `status` for filtering by status
- **Jobs:** Index on `priority` for sorting and filtering
- **Timeline:** Compound index on `job` + `createdAt` for efficient timeline retrieval
- **Parts:** Index on `recordedBy` for technician parts tracking

## Validation Rules

### **User Validation:**
- Email must be valid format and unique
- Password must be at least 6 characters
- Name cannot be empty
- Role must be either 'dispatcher' or 'technician'

### **Job Validation:**
- Customer name, address, description required
- Priority must be valid enum value
- Scheduled date must be a valid date
- Start time must be valid HH:MM format
- Estimated duration must be positive number
- Status must follow allowed transitions

### **Part Validation:**
- Part name cannot be empty
- Quantity must be positive integer
- Job reference must exist
- Recorded by must be valid user

### **Timeline Validation:**
- Event type must be valid enum value
- Description cannot be empty
- Job reference must exist
- Performed by must be valid user
- createdAt is immutable (cannot be modified)

## Database Operations

### **Common Query Patterns:**

### **Job Retrieval:**
```javascript
// Get jobs for specific technician
Job.find({ assignedTechnicians: technicianId })
  .populate('assignedTechnicians', 'name email')
  .sort({ scheduledDate: 1, startTime: 1 })

// Get jobs by date range
Job.find({
  scheduledDate: { $gte: startDate, $lte: endDate }
}).sort({ priority: -1 })

// Search jobs by customer or address
Job.find({
  $or: [
    { customerName: { $regex: search, $options: 'i' } },
    { siteAddress: { $regex: search, $options: 'i' } }
  ]
})
```

### **Assignment Operations:**
```javascript
// Add technician to job
Job.findByIdAndUpdate(
  jobId,
  { $addToSet: { assignedTechnicians: technicianId } },
  { new: true }
)

// Remove technician from job
Job.findByIdAndUpdate(
  jobId,
  { $pull: { assignedTechnicians: technicianId } },
  { new: true }
)
```

### **Timeline Recording:**
```javascript
// Create timeline entry
const timeline = new Timeline({
  job: jobId,
  eventType: 'status_change',
  description: `Status changed from ${oldStatus} to ${newStatus}`,
  performedBy: userId,
  metadata: { oldStatus, newStatus }
})
await timeline.save()
```

## Data Integrity

### **Referential Integrity:**
- Foreign keys are ObjectIds but not enforced by MongoDB
- Application code validates references before operations
- Population used to fetch related documents
- Cascading deletes handled in application code

### **Business Logic Enforcement:**
- Status transitions validated in application code
- Scheduling conflicts checked before assignments
- Parts cannot be added to completed jobs
- Timeline entries cannot be modified or deleted
- Jobs cannot be assigned without valid technicians

## Backup and Recovery

### **Current Setup:**
- MongoDB Atlas provides automated backups
- Point-in-time recovery available
- Snapshots every 6 hours (free tier)
- Backup retention for 35 days (free tier)

### **Recommended for Production:**
- Daily backups with longer retention
- Cross-region backup replication
- Manual backup before major changes
- Export backup scripts for disaster recovery