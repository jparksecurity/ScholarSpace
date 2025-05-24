# ScholarSpace

A comprehensive academic workspace for homeschooling families, built with Next.js, Prisma, and Clerk authentication.

## Features

### Student Management
- **Multi-Student Support**: Parents can manage multiple children
- **Progress Tracking**: Track completion status and scores for each curriculum unit
- **Subject Progress**: Monitor current position in each subject area (Math, ELA, Science, Humanities)
- **Progress Updates**: Parents can mark curriculum units as "started" or "completed"
- **Visual Progress Tracking**: Color-coded status indicators and percentage-based progress display

### Progress Update System
- **Dedicated Progress Interface**: `/students/[studentId]/progress` for comprehensive progress management
- **One Unit Per Subject**: Students focus on one unit at a time per subject for better learning outcomes
- **Simplified Actions**: Mark current unit complete or go back to previous unit
- **Real-time Feedback**: Toast notifications and confirmation dialogs
- **Single View**: All subjects displayed in one unified view without tabs
- **Visual Status Indicators**:
  - Blue: Currently studying unit
  - Green: Previously completed unit
  - Gray: No progress yet

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
- Server-side validation for all progress updates

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4-turbo
- **UI Components**: Custom components built with Radix UI primitives
- **State Management**: React hooks with optimistic updates

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Set up your environment variables in `.env`
4. Run database migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`
6. Start the development server: `npm run dev`

## Database Schema

### Core Tables
- **Students**: Core student information linked to parent Clerk user ID
- **ProgressLog**: Tracks all progress actions (`STARTED`/`COMPLETED`) with timestamps
- **CurriculumNode**: Learning units with relationships and prerequisites
- **CurriculumEdge**: Defines relationships between curriculum nodes
- **LearningPlan**: AI-generated 1-year learning plans with metadata and preferences

### Progress Tracking Model
- Uses `ProgressLog` table with `STARTED` and `COMPLETED` enum values
- Links students to curriculum nodes through foreign keys
- Maintains chronological history of all progress actions
- Enables comprehensive progress analytics and reporting

## API Endpoints

### Students
- `GET /api/students` - Get all students for authenticated user
- `POST /api/students` - Create a new student
- `GET /api/students/[id]` - Get specific student
- `PUT /api/students/[id]` - Update student information
- `DELETE /api/students/[id]` - Delete student

### Learning Plans
- `POST /api/learning-plans/generate` - Generate AI-powered learning plan
- `GET /api/learning-plans/[studentId]` - Get learning plans for student
- `DELETE /api/learning-plans/[studentId]?planId=<id>` - Delete specific learning plan

### Server Actions (Progress Updates)
- `updateStudentProgressAction` - Creates new progress entries with validation
- `removeStudentProgressAction` - Removes progress entries with authorization checks

## Project Structure

```
app/
├── api/
│   ├── students/                    # Student API routes
│   └── learning-plans/              # Learning plan API routes
├── students/
│   ├── [studentId]/
│   │   └── progress/                # Progress update pages
│   │       ├── page.tsx             # Progress update server component
│   │       └── components/
│   │           └── ProgressUpdateClient.tsx  # Main progress UI
│   ├── components/
│   │   ├── StudentsClient.tsx       # Student management with progress buttons
│   │   ├── StudentForm.tsx          # Student creation/editing
│   │   └── StudentOnboarding.tsx    # Initial progress setup
│   ├── actions.ts                   # Student and progress server actions
│   └── page.tsx                     # Students list page
├── learning-plans/                  # Learning plan generator UI
├── layout.tsx                       # Root layout with navigation and toast
components/
├── learning-plans/                  # Learning plan components
└── ui/                             # Reusable UI components (including Toaster)
hooks/
├── useStudents.ts                  # Student data management hook
└── use-toast.ts                    # Toast notification hook
lib/
├── data-access/
│   ├── students.ts                 # Student and progress data access
│   └── curriculum.ts               # Curriculum data queries
├── curriculum.ts                   # Curriculum utility functions
└── db.ts                          # Prisma client setup
prisma/
├── schema.prisma                   # Database schema
└── migrations/                     # Database migrations
```

## Progress Update Feature

### User Experience Flow
1. **Discovery**: Parents see "Update Progress" buttons on student cards
2. **Navigation**: Click redirects to dedicated progress page (`/students/[studentId]/progress`)
3. **Overview**: Single view shows all subjects with current and previous units
4. **Actions**: Simple buttons to complete current unit or go back to previous unit
5. **Feedback**: Toast notifications confirm successful actions
6. **Automatic Progression**: Completing a unit automatically starts the next unit
7. **Return**: Back button provides easy navigation to student list

### Technical Implementation

#### Security & Authorization
- **Authentication**: Clerk-based user authentication
- **Authorization**: Users can only access their own students
- **Validation**: Server-side validation of all progress updates
- **Duplicate Prevention**: Prevents duplicate progress entries within 1 minute

#### Data Layer
- **getStudentProgress**: Retrieves student with progress and learning plans
- **updateStudentProgress**: Creates progress log entries with validation
- **getStudentProgressBySubject**: Subject-specific progress queries

#### UI Components
- **ProgressUpdateClient**: Simplified progress management interface with single view
- **Responsive Design**: Works on desktop and mobile devices
- **Toast Notifications**: User feedback for all actions
- **Confirmation Dialogs**: Prevent accidental actions
- **Focus-Oriented Design**: One unit per subject reduces cognitive load

#### Performance Optimizations
- Efficient database queries with proper relations
- Next.js automatic caching with revalidation
- Optimistic UI updates with server confirmation
- Background updates without blocking UI

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

## Development

### Code Standards
- Follows Google TypeScript Guide
- 12-factor app principles
- Comprehensive error handling
- Type-safe database operations with Prisma

### Quality Assurance
- ESLint with auto-fix (`pnpm lint --fix`)
- TypeScript type checking (`npx tsc --noEmit`)
- Successful builds (`pnpm build`)
- Responsive design testing

### Security Features
- Server-side authentication and authorization
- User ownership verification for all operations
- Input validation and sanitization
- Protection against common vulnerabilities

## Future Enhancements

### Progress Update System
- **Bulk Operations**: Multi-select for batch progress updates
- **Progress Analytics**: Charts and detailed progress reports
- **Learning Recommendations**: AI-powered next unit suggestions
- **Parent Notifications**: Email alerts for progress milestones
- **Student Portal**: Allow students to self-report progress

### General Platform
- **Mobile App**: Native mobile application
- **Offline Support**: Progress tracking without internet
- **Advanced Analytics**: Learning pattern analysis
- **Gamification**: Achievement badges and rewards
- **Community Features**: Parent forums and resource sharing