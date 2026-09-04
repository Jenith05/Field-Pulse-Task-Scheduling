# Submission

## Links

- **GitHub repository:** https://github.com/Jenith05/Field-Pulse-Task-Scheduling
- **Live application:** https://frontend-q6e11yogt-srinivasjenithb-3728s-projects.vercel.app/login

## Notes for the reviewer

Both frontend and backend are deployed and fully functional. MongoDB Atlas free tier may have brief delay on first request. Database is seeded with demo data including multiple jobs, technicians, and customers to demonstrate all features. The application uses the MERN stack with MongoDB Atlas for the database, Express.js for the backend API, and React with Vite for the frontend. All 10 required features are implemented and working correctly in the deployed environment. The UI follows the FieldPulse design specification with the dot pattern background, table layout for jobs, and dashboard charts. Server-side enforcement is implemented for all role-based permissions and business logic rules.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Dispatcher | dispatcher@example.com | password123 |
| Technician | tech1@example.com | password123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React 18, Vite, React Router, Axios, Recharts, Custom CSS | Familiar framework, fast development |
| Backend | Node.js, Express.js, Mongoose, JWT, bcryptjs | Simple, lightweight, extensive middleware |
| Database | MongoDB Atlas (free tier) | Flexible schema, cloud hosting |
| Hosting | Vercel (frontend) + Backend deployed | Free hosting platforms |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles with server-side enforcement | Done | JWT authentication with 24-hour token expiration, dispatcher and technician roles, server-side middleware enforces permissions, dispatchers have full access, technicians can only see assigned jobs |
| 2 | Jobs with create, edit, archive, restore | Done | Full CRUD operations implemented, all required fields validated (customer name, address, description, priority, date, time, duration), archive removes from queue while preserving history, restore functionality included |
| 3 | Parts used per job | Done | Parts tracking with part name, quantity, and recorder, parts belong to exactly one job, can add parts before completion, parts display alongside job details, server prevents adding parts to completed jobs |
| 4 | Job lifecycle with rules | Done | Status transitions: Unassigned→Assigned→En Route→On Site→Completed, server enforces cannot skip statuses, scheduling conflict detection prevents overlapping assignments, completion requires note and at least one part, jobs past window flagged as running late |
| 5 | Assignment with conflict detection | Done | Multiple technicians per job, multiple jobs per technician, N^2 overlap checking calculates time windows, prevents double-booking, only dispatchers can assign/remove, technicians see filtered list of their jobs |
| 6 | Finding jobs with server-side filtering | Done | Text search over customer name and address, filters for status/technician/date, sorting by date/priority/status, pagination with total matches, all filtering happens on server as required |
| 7 | Acting on many jobs at once | Done | Bulk assignment for multiple unassigned jobs to one technician, per-job success/failure reporting with specific reasons, CSV export generates dispatch sheets with customer/technician/window/status |
| 8 | A dashboard | Done | Headline metrics: scheduled today, completed today, running late, unassigned, status breakdown pie chart, technician workload bar chart, 14-day completion line chart, role-appropriate views |
| 9 | History you cannot rewrite | Done | Immutable timeline records creation, status changes with old/new status, assignments/unassignments, completion notes, parts used, timeline includes who performed action and when, cannot be edited or deleted |
| 10 | Running-late alerts | Done | Jobs past scheduled window flagged as running late, alerts show in dedicated area with count badge in navigation, dispatchers can dismiss alerts, alerts reappear if job window changes and passes again while incomplete |

## How much time did you actually spend?

12 hours total: 4 hours backend, 4 hours frontend, 2 hours UI refinement, 1.5 hours documentation, 0.5 hours deployment

## What would you do next, with another 12 hours?

1. **Automated testing** - Implement Jest for backend route testing and React Testing Library for frontend components to catch regressions and provide confidence in the codebase
2. **API documentation** - Generate interactive API documentation with Swagger/OpenAPI to document all endpoints, request/response formats, and error responses
3. **Real-time updates** - Implement Socket.io for real-time dashboard updates so dispatchers see job status changes immediately without page refreshes
4. **Advanced error handling** - Implement custom error classes for different error types and structured logging with Winston for production monitoring
5. **File upload for job attachments** - Implement before/after photo upload capability using Multer and cloud storage for visual documentation
6. **Technician skill matching** - Add skill/certification attributes to technicians and job types to automatically suggest the best technician for specific jobs
7. **Customer portal** - Create a separate customer-facing interface where customers can view scheduled jobs and track technician status
8. **Route optimization** - Integrate mapping API to optimize technician routes for multiple jobs in a day, reducing travel time
9. **Mobile-optimized view** - Create a responsive mobile interface optimized for technicians in the field with larger buttons and simplified workflows
10. **Performance optimization** - Implement Redis caching for frequently accessed data and optimize database queries with additional compound indexes

## What are you least happy with in this codebase, and why?

1. **Backend deployment challenges** - Initial deployment attempts faced GitHub authentication issues, though the backend is now deployed and functional. This consumed time that could have been spent on other improvements.

2. **Basic error handling** - While try-catch blocks are present throughout the codebase, error handling could be more comprehensive with custom error classes and better user-facing error messages. The current implementation provides basic error information but could be more sophisticated.

3. **No automated testing** - Manual testing was performed thoroughly across all features, but no automated tests were written. This would improve confidence in the codebase and catch regressions during future development. Jest for backend and React Testing Library for frontend would be valuable additions.

4. **Simple pagination implementation** - Uses offset-based pagination (skip/limit) which can degrade performance at large offsets. Cursor-based pagination would be better for scale, but the current implementation is sufficient for the current data volume.

5. **No structured logging system** - Added console.log statements for debugging during development but no structured logging system for production monitoring and debugging. A logging framework like Winston would provide better insight into application behavior and performance.

Despite these limitations, the core functionality is solid and all 10 required features are fully implemented and working in the deployed environment. These are areas for improvement rather than fundamental flaws in the system.
