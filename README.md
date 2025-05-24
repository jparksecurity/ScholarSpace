# ScholarSpace

A comprehensive academic workspace for homeschooling families, built with Next.js, Prisma, and Clerk authentication.

## Features

### Student Management
- **Multi-Student Support**: Parents can manage multiple children
- **Progress Tracking**: Track completion status and scores for each curriculum unit
- **Subject Progress**: Monitor current position in each subject area (Math, ELA, Science, Humanities)

### Curriculum Integration
- **Khan Academy Curriculum**: Pre-loaded with Khan Academy's K-12 curriculum structure
- **Prerequisite Relationships**: Maintains learning dependencies between curriculum units
- **Grade-Level Organization**: Content organized by grade levels and subjects

### Learning Plans
- **AI-Generated Plans**: Create personalized 1-year learning plans using AI
- **Curriculum Mapping**: Plans are built from actual curriculum units with proper sequencing
- **Parent Preferences**: AI considers parent input when generating plans

### Authentication & Security
- Clerk authentication integration for secure user management
- Parent-student relationship management (parents can only access their own students)
- Protected routes with middleware

### Database Schema
- **Students**: Core student information linked to parent Clerk user ID
- **Student Progress**: Tracks progress on individual curriculum nodes
- **Student Enrollments**: Manages subject enrollments with start/end dates
- **Curriculum Nodes**: Learning units with relationships and prerequisites
- **Curriculum Edges**: Defines relationships between curriculum nodes
- **Learning Plans**: AI-generated 1-year learning plans with metadata and preferences
- **Learning Plan Items**: Individual curriculum units scheduled by month with progress tracking

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4-turbo
- **UI Components**: Custom components built with Radix UI primitives

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Set up your environment variables in `.env`
4. Run database migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`
6. Start the development server: `npm run dev`

## API Endpoints

### Students
- `GET /api/students` - Get all students for authenticated user
- `POST /api/students` - Create a new student
- `GET /api/students/[id]` - Get specific student
- `PUT /api/students/[id]` - Update student information
- `DELETE /api/students/[id]` - Soft delete student

### Learning Plans
- `POST /api/learning-plans/generate` - Generate AI-powered learning plan
- `GET /api/learning-plans/[studentId]` - Get learning plans for student
- `DELETE /api/learning-plans/[studentId]?planId=<id>` - Delete specific learning plan

## Project Structure

```
app/
├── api/
│   ├── students/          # Student API routes
│   └── learning-plans/    # Learning plan API routes
├── dashboard/students/    # Student management UI
├── learning-plans/        # Learning plan generator UI
├── layout.tsx            # Root layout with navigation
components/
├── learning-plans/       # Learning plan components
└── ui/                   # Reusable UI components
hooks/
├── useStudents.ts        # Student data management hook
prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
```

## Development

This project follows the Google TypeScript Guide and 12-factor app principles. The database uses PostgreSQL with Prisma for type-safe database operations.

## Learning Plan Generation

ScholarSpace uses a sophisticated two-step approach to generate personalized learning plans that respect curriculum prerequisites:

### Step 1: Goal Selection
- AI analyzes student's current progress and parent preferences
- Selects appropriate end goals for each subject (Math, ELA, Science, Humanities)  
- Considers student's age, grade level, and completed coursework
- Chooses challenging but achievable targets

### Step 2: Path Creation
- Uses curriculum prerequisite graph to create ordered learning paths
- Starts from student's current position (started but not completed units)
- Builds sequential paths to selected end goals following prerequisite relationships
- Filters out already completed units
- Ensures logical progression respecting dependencies

### Key Features
- **Prerequisite Awareness**: Follows proper sequential and foundational relationships between curriculum units
- **Progress Tracking**: Uses ProgressLog to identify completed vs. in-progress units
- **Multi-Subject Planning**: Balances coverage across all subjects
- **Adaptive Starting Points**: Begins from where student left off, not random starting points
- **Goal-Oriented**: Works backward from meaningful end targets

### Technical Implementation
The system uses graph traversal algorithms to:
- Find prerequisite chains using depth-first search
- Create ordered paths between start and end nodes
- Respect both sequential (within-course) and foundational (cross-course) relationships
- Handle multiple starting points per subject

This approach ensures students receive coherent, properly sequenced learning plans instead of random collections of curriculum units.