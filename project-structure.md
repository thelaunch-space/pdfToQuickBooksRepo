# PDF to QuickBooks - Project Structure Documentation

## Overview
A Next.js application that converts PDF receipts to QuickBooks-ready CSV files using AI-powered data extraction. Built for freelance bookkeepers to save 4.5+ hours weekly on manual data entry.

## Tech Stack

### Core Framework
- **Next.js 14.2.16** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5** - Type safety and development experience

### Database & Authentication
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, RLS)
  - `@supabase/supabase-js ^2.57.2` - Main client
  - `@supabase/ssr ^0.7.0` - Server-side rendering support
  - `@supabase/auth-helpers-nextjs ^0.10.0` - Next.js auth helpers

### AI/ML Processing
- **OpenRouter API** - AI model access for PDF processing
  - `mistral-ocr` - OCR engine for scanned receipts
  - `pdf-text` - Text extraction for digital receipts
  - `anthropic/claude-3.5-sonnet` - LLM for data extraction

### UI Framework
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Headless UI components (20+ components)
- **Lucide React** - Icon library
- **Next Themes** - Dark/light mode support

### Form Handling & Validation
- **React Hook Form ^7.60.0** - Form state management
- **Zod 3.25.67** - Schema validation
- **@hookform/resolvers ^3.10.0** - Form validation integration

### Development Tools
- **ESLint** - Code linting (disabled during builds)
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Project Structure

```
pdfToQuickBooksRepo/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── batch-processing/     # Batch processing endpoints
│   │   │   ├── complete/         # Batch completion
│   │   │   ├── process-file/     # Individual file processing
│   │   │   └── route.ts          # Batch creation
│   │   └── process-pdf/          # Single PDF processing (trial)
│   │       └── route.ts
│   ├── dashboard/                # Main dashboard page
│   │   └── page.tsx
│   ├── login/                    # Authentication pages
│   │   └── page.tsx
│   ├── payment/                  # Payment processing
│   │   └── page.tsx
│   ├── signup/                   # User registration
│   │   └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Reusable UI components (Radix-based)
│   ├── batch-processing-widget.tsx  # Dashboard batch processor
│   ├── theme-provider.tsx        # Theme context
│   └── trial-widget.tsx          # Landing page demo widget
├── contexts/                     # React contexts
│   └── auth-context.tsx          # Authentication state management
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection
│   └── use-toast.ts              # Toast notifications
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Client-side Supabase
│   ├── supabase-api.ts           # API-specific Supabase client
│   ├── supabase-middleware.ts    # Middleware utilities
│   ├── supabase-server.ts        # Server-side Supabase
│   └── utils.ts                  # General utilities
├── public/                       # Static assets
├── styles/                       # Additional stylesheets
└── Configuration files
```

## File Dependencies & Purposes

### Core Application Files

#### `app/layout.tsx`
**Purpose**: Root layout component with global providers
**Dependencies**: 
- `@/contexts/auth-context` - Authentication provider
- `@vercel/analytics` - Analytics tracking
- `next/font/google` - Google Fonts (Inter)
**Key Features**:
- Wraps entire app with AuthProvider
- Sets up global metadata and fonts
- Includes Vercel Analytics

#### `app/page.tsx`
**Purpose**: Landing page with hero section and trial widget
**Dependencies**:
- `@/components/trial-widget` - Interactive demo
- `@/components/ui/button` - UI components
- `lucide-react` - Icons
**Key Features**:
- Hero section with value proposition
- Feature showcase
- Pricing information
- Testimonial section
- Trial widget integration

### Authentication & User Management

#### `contexts/auth-context.tsx`
**Purpose**: Global authentication state management
**Dependencies**:
- `@supabase/supabase-js` - Supabase client
- `@/lib/supabase` - Supabase configuration
**Key Features**:
- User session management
- Sign up/in/out functions
- Local storage caching
- Auth state persistence

#### `app/login/page.tsx` & `app/signup/page.tsx`
**Purpose**: Authentication pages
**Dependencies**:
- `@/contexts/auth-context` - Auth functions
- `@/components/ui/*` - Form components
- `react-hook-form` - Form handling
- `zod` - Validation

### Dashboard & Core Functionality

#### `app/dashboard/page.tsx`
**Purpose**: Main dashboard interface for authenticated users
**Dependencies**:
- `@/contexts/auth-context` - User authentication
- `@/lib/supabase` - Database operations
- `@/components/batch-processing-widget` - File processing
- `@/hooks/use-toast` - Notifications
**Key Features**:
- Usage tracking display
- Account management system
- Batch history viewing
- Subscription status monitoring

#### `components/batch-processing-widget.tsx`
**Purpose**: Multi-file PDF processing interface for dashboard
**Dependencies**:
- `@/contexts/auth-context` - User session
- `@/lib/supabase` - Database operations
- `@/hooks/use-toast` - User notifications
- `@/components/ui/*` - UI components
**Key Features**:
- Drag & drop file upload (max 10 files)
- Format selection (3-column/4-column)
- Batch processing with progress tracking
- Usage limit validation
- Error handling and user feedback

#### `components/trial-widget.tsx`
**Purpose**: Single PDF demo for landing page (anonymous users)
**Dependencies**:
- `@/components/ui/*` - UI components
- `lucide-react` - Icons
**Key Features**:
- Single file upload with validation
- Format selection
- Processing simulation with progress
- Results display with confidence indicators
- Conversion gates to encourage signup

### API Routes

#### `app/api/process-pdf/route.ts`
**Purpose**: Single PDF processing for trial users
**Dependencies**:
- `OpenRouter API` - AI processing
- Environment variables for API keys
**Key Features**:
- File validation (PDF, 10MB limit)
- Base64 conversion for API
- OpenRouter integration with Mistral OCR
- JSON response parsing
- Error handling with fallback data

#### `app/api/batch-processing/route.ts`
**Purpose**: Batch creation and validation
**Dependencies**:
- `@/lib/supabase-api` - Database operations
- `@/lib/supabase-api` - Authentication
**Key Features**:
- User authentication via Bearer token
- Account ownership verification
- Subscription status validation
- Usage limit checking via database function
- Batch record creation

#### `app/api/batch-processing/process-file/route.ts`
**Purpose**: Individual file processing within batches
**Dependencies**:
- `@/lib/supabase-api` - Database operations
- `OpenRouter API` - AI processing
**Key Features**:
- Rate limiting (2-second delay between files)
- Engine selection logic (OCR vs text extraction)
- Batch ownership verification
- Extraction record creation
- Confidence score calculation

#### `app/api/batch-processing/complete/route.ts`
**Purpose**: Batch completion and usage tracking
**Dependencies**:
- `@/lib/supabase-api` - Database operations
**Key Features**:
- Batch status update to 'completed'
- Monthly usage tracking via database function
- Extraction count validation
- Error handling for usage tracking

### Library & Utility Files

#### `lib/supabase.ts`
**Purpose**: Client-side Supabase configuration
**Dependencies**:
- `@supabase/supabase-js` - Supabase client
- Environment variables for URL and keys
**Key Features**:
- Public client for browser use
- Environment variable configuration

#### `lib/supabase-api.ts`
**Purpose**: API-specific Supabase client with token authentication
**Dependencies**:
- `@supabase/supabase-js` - Supabase client
**Key Features**:
- API client creation
- Bearer token authentication
- User verification from tokens

#### `lib/utils.ts`
**Purpose**: General utility functions
**Dependencies**:
- `clsx` - Conditional class names
- `tailwind-merge` - Tailwind class merging
**Key Features**:
- `cn()` function for conditional styling
- Tailwind class conflict resolution

### UI Components (`components/ui/`)

**Purpose**: Reusable UI components built on Radix UI primitives
**Dependencies**: 20+ Radix UI packages for headless components
**Key Components**:
- Form controls (Button, Input, Select, etc.)
- Layout components (Card, Dialog, Sheet, etc.)
- Feedback components (Alert, Toast, Progress, etc.)
- Navigation components (Tabs, Accordion, etc.)

## Database Schema (Supabase)

### Core Tables
- **`profiles`** - User data, subscription status, usage tracking
- **`accounts`** - Client organizations for bookkeepers
- **`batches`** - Processing sessions (max 10 files)
- **`extractions`** - Individual PDF results with extracted_data JSONB

### Key Functions
- **`check_usage_limit()`** - Validates monthly page limits
- **`update_monthly_usage()`** - Updates usage tracking

## Environment Variables

### Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint (currently disabled in builds)
```

### Key Features
- **Mobile-first responsive design**
- **TypeScript for type safety**
- **Component-based architecture**
- **Authentication with Supabase**
- **AI-powered PDF processing**
- **Usage tracking and limits**
- **Batch processing capabilities**

## Code Review Guidelines

### File Organization
- Each file has a clear, single responsibility
- Components are under 500 lines (as per user rules)
- File-purpose comments at the top of each file
- Modular structure with reusable patterns

### Error Handling
- User-friendly error messages (no internal IDs exposed)
- Comprehensive logging for debugging
- Graceful fallbacks for API failures
- Validation at multiple levels

### Performance Considerations
- Lazy loading for non-critical resources
- Rate limiting for API calls
- Efficient database queries with RLS
- Optimized bundle size with Next.js

### Security
- Row Level Security (RLS) policies
- Authentication required for all protected routes
- Input validation and sanitization
- Secure file upload handling

This documentation provides a comprehensive overview of the project structure, making it easier for code reviews and future development work.
