# AI prompts

I did not use AI extensively for this project. I completed the majority of the development work independently, using AI only for a few specific tasks where I needed quick references or initial scaffolding.

## Database Schema Design

### Prompt
"How to design a MongoDB schema for a field service dispatch system with users, jobs, parts, and timeline"

### What I got
General suggestions about data modeling and relationships

### What I corrected
I designed the specific schema myself based on the actual requirements from the README, ensuring all 10 core requirements were properly represented in the data model.

## Authentication Implementation

### Prompt
"Express.js JWT authentication middleware example with role-based access control"

### What I got
Basic code structure for JWT token generation and validation

### What I corrected
I implemented the authentication system myself based on the example, adding proper error handling, token expiration, and specific role-based middleware (dispatcher vs technician) as required by the specifications.

## Frontend Component Structure

### Prompt
"React project structure with React Router for authentication flow"

### What I got
General guidance on file organization and routing setup

### What I corrected
I organized the components myself based on the specific application needs, creating a logical structure that matches the field service dispatch requirements rather than generic suggestions.

## Chart Implementation

### Prompt
"Recharts library usage for bar charts and pie charts in React"

### What I got
Documentation on Recharts components and basic usage examples

### What I corrected
I implemented the charts myself to match the specific dashboard requirements (completions over 14 days, status breakdown, technician workload) rather than generic examples.

## UI Styling Reference

### Prompt
"Modern CSS styling techniques for dashboard and table layouts"

### What I got
General CSS best practices and modern layout techniques

### What I corrected
I styled the components myself to match the specific FieldPulse design from the reference images, creating custom CSS patterns and specific styling that matches the exact visual requirements.

## AI Prompt That Produced Something Wrong

### Prompt
"Install and configure Tailwind CSS with PostCSS for React project"

### What I got
Installation instructions and configuration files

### What I corrected
The PostCSS configuration had compatibility issues with the newer Tailwind CSS version, causing build errors. I abandoned Tailwind and wrote custom CSS instead, which gave me complete control over the styling and eliminated the build configuration complexity. This was the right decision as it allowed me to precisely match the FieldPulse design specification.

## Overall Approach

The majority of the development work was done independently:
- Designed the complete database schema based on requirements
- Implemented all business logic for job lifecycle, assignments, conflict detection
- Built the complete API with proper authentication and authorization
- Created the frontend interface from scratch
- Implemented the specific UI design from reference images
- Handled MongoDB Atlas setup and connection
- Configured development environment and dependencies

AI was used sparingly for:
- Quick reference when stuck on syntax or library usage
- Initial scaffolding and project setup
- General best practices for security and performance

The core business logic, feature implementation, and system architecture were developed independently based on the detailed requirements provided in the README file.

## Additional AI Interactions

## Scheduling Conflict Algorithm

### Prompt
"Algorithm to detect time overlap between job assignments for technicians"

### What I got
General advice about comparing time ranges and overlap detection

### What I corrected
I implemented the specific overlap detection logic myself, considering job duration, start times, and edge cases like jobs that end exactly when another starts.

## React Chart Configuration

### Prompt
"Recharts bar chart configuration for displaying completion data over time"

### What I got
Basic Recharts component examples with sample data

### What I corrected
I configured the charts myself to match the specific dashboard requirements, setting up proper date formatting, axis labels, and color schemes to match the FieldPulse design.

## Express Validator Usage

### Prompt
"Express-validator middleware for validating API request parameters"

### What I got
Documentation on express-validator syntax and basic validation rules

### What I corrected
I implemented specific validation rules for each endpoint based on the actual data model, adding custom error messages and handling validation failures appropriately.

## MongoDB Atlas Setup

### Prompt
"How to set up MongoDB Atlas connection string and configure Node.js to connect"

### What I got
General MongoDB Atlas setup instructions and connection string format

### What I corrected
I handled the specific connection issues I encountered, including IP whitelist configuration, connection string format, and error handling for connection failures.

## Development Process

### **Independent Work:**
- Read and analyzed the complete README requirements
- Designed the system architecture based on requirements
- Created all database models with appropriate relationships
- Implemented all 10 core features independently
- Built the complete frontend interface
- Resolved technical issues without AI assistance
- Created all documentation files

### **AI-Assisted Work:**
- Initial project setup and configuration
- Quick syntax references for unfamiliar libraries
- General best practices for security
- UI styling techniques and patterns
- Chart library usage and configuration

### **Learning Outcomes:**
- Gained deeper understanding of MERN stack
- Learned MongoDB Atlas cloud database management
- Improved React component architecture skills
- Enhanced authentication and authorization knowledge
- Developed better API design practices
- Improved error handling and validation strategies

### **Time Allocation:**
- **Independent development:** ~80% of time
- **AI-assisted tasks:** ~20% of time
- **Problem-solving:** Mostly independent with occasional AI guidance
- **Architecture and design:** Fully independent
- **Implementation details:** Mostly independent with AI references

### **Quality Assurance:**
- Manually tested all features end-to-end
- Verified all 10 requirements were met
- Tested authentication and authorization
- Validated scheduling conflict detection
- Checked CSV export functionality
- Verified dashboard statistics accuracy
- Tested responsive design on different screen sizes

### **Code Quality:**
- Followed consistent coding standards
- Used meaningful variable and function names
- Added appropriate comments where needed
- Organized code logically with clear separation of concerns
- Implemented proper error handling throughout
- Used secure practices for authentication and data handling