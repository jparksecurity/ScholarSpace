# ScholarSpace

A comprehensive academic workspace for homeschooling families, built with Next.js, Prisma, and Clerk authentication.

## Features

### Student Management
- **Student Profiles**: Create and manage profiles for multiple students with basic information (name, grade level, date of birth, bio, avatar)
- **Subject Enrollment**: Track which subjects each student is enrolled in
- **Progress Tracking**: Monitor student progress across curriculum nodes with status tracking (Not Started, In Progress, Completed, Mastered, Needs Review)
- **Onboarding Assessment**: Guided assessment process to evaluate student's current knowledge level when adding a new student

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

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
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

## Project Structure

```
app/
├── api/students/           # Student API routes
├── dashboard/students/     # Student management UI
│   └── components/         # Student-specific components
├── layout.tsx             # Root layout with navigation
hooks/
├── useStudents.ts         # Student data management hook
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
components/ui/             # Reusable UI components
```

## Development

This project follows the Google TypeScript Guide and 12-factor app principles. The database uses PostgreSQL with Prisma for type-safe database operations.