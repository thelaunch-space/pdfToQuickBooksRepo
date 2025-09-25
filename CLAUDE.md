# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Building
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

### Testing
No specific test commands found - check package.json if tests are added.

## Application Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router (TypeScript)
- **UI Components**: Radix UI primitives with shadcn/ui system
- **Styling**: TailwindCSS with CSS variables for theming
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with custom context provider
- **State Management**: React Context for authentication
- **Form Handling**: React Hook Form with Zod validation

### Core Business Logic
This is a **PDF to QuickBooks CSV conversion service** for freelance bookkeepers with a $9/month subscription model and 1500 page monthly limit.

**Key Features:**
- Landing page with trial widget (single PDF, read-only results)
- Batch processing (up to 10 PDFs per batch)
- Client account organization system
- 3-column vs 4-column QuickBooks CSV export formats
- Monthly usage tracking and limits
- Historical batch access and re-download

### Database Schema (Supabase)
The application uses these core tables with Row Level Security:

**Core Tables:**
- **profiles** - User subscription status and monthly usage tracking
- **accounts** - Client organizations (for bookkeepers to organize work)
- **batches** - Processing sessions (up to 10 files each)
- **extractions** - Individual PDF results with JSONB extracted_data

**Table Details:**

**profiles** (4 rows):
- `id` (uuid, primary key, references auth.users.id)
- `email` (text, updatable)
- `subscription_status` (text, default: 'active', check: 'active'|'cancelled')
- `monthly_usage` (integer, default: 0, updatable)
- `usage_reset_date` (date, default: CURRENT_DATE, updatable)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**accounts** (7 rows):
- `id` (uuid, primary key, default: gen_random_uuid())
- `user_id` (uuid, references profiles.id)
- `name` (text, check: length 1-100 characters)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**batches** (14 rows):
- `id` (uuid, primary key, default: gen_random_uuid())
- `account_id` (uuid, references accounts.id)
- `file_count` (integer, check: 1-10 files)
- `total_pages` (integer, check: > 0)
- `csv_format` (text, check: '3-column'|'4-column')
- `status` (text, default: 'processing', check: 'processing'|'completed'|'failed')
- `processed_at` (timestamptz, default: now())
- `last_edited_at` (timestamptz, nullable)
- `last_downloaded_at` (timestamptz, nullable)
- `edit_count` (integer, default: 0)
- `download_count` (integer, default: 0)

**extractions** (28 rows):
- `id` (uuid, primary key, default: gen_random_uuid())
- `batch_id` (uuid, references batches.id)
- `filename` (text)
- `extracted_data` (jsonb) - Contains: {date, vendor, amount, description}
- `engine_used` (text, check: 'mistral-ocr'|'pdf-text')
- `confidence_score` (numeric, 0.00-1.00)
- `created_at` (timestamptz, default: now())

**Business Functions:**
- `check_usage_limit(user_uuid, additional_pages)` - Enforces 1500 page limit
- `update_monthly_usage(user_uuid, pages_used)` - Tracks monthly consumption  
- `handle_new_user()` - Auto-creates profiles on signup

**Row Level Security Policies:**
- All tables have RLS enabled
- Users can only access their own data (profiles, accounts, batches, extractions)
- Paid users can update extractions (subscription_status = 'active' required)
- Account-based access control for batches and extractions

### Directory Structure
```
app/
├── api/                    # API routes
│   ├── batch-processing/   # Batch processing endpoints
│   │   ├── route.ts        # Create batch, process files
│   │   ├── complete/       # Mark batch as complete
│   │   └── process-file/   # Process individual files
│   ├── batches/           # Batch management
│   │   └── [batchId]/
│   │       ├── export-csv/ # CSV export endpoint
│   │       └── extractions/ # Get batch extractions
│   ├── extractions/       # Extraction management
│   │   └── [extractionId]/ # Update individual extractions
│   └── process-pdf/       # Single PDF processing (trial)
├── dashboard/             # Authenticated user dashboard
├── history/               # Processing history page
├── login/                # Login page
├── payment/              # Payment flow
├── review/                # Review and edit interface
│   └── [batchId]/         # Review specific batch
├── signup/               # Registration page
├── globals.css           # TailwindCSS styles
├── layout.tsx           # Root layout with AuthProvider
└── page.tsx             # Landing page with trial widget

components/
├── ui/                   # shadcn/ui components (40+ components)
├── batch-processing-widget.tsx  # Main batch processing interface
├── trial-widget.tsx      # Landing page trial widget
├── review-edit-widget.tsx # Review and edit interface
├── logo.tsx             # Application logo component
└── theme-provider.tsx   # Theme management

contexts/
└── auth-context.tsx     # Supabase authentication context

lib/
├── supabase.ts         # Supabase client
├── supabase-server.ts  # Server-side Supabase client
├── supabase-middleware.ts # Middleware for auth
├── supabase-api.ts     # API utilities
├── transaction-classifier.ts # AI transaction classification
└── utils.ts            # Utility functions (cn helper)
```

### Authentication Flow
1. **Trial Users** - Can process 1 PDF on landing page (read-only results)
2. **Registration** - Creates profile with `subscription_status = 'active'`
3. **Payment Gate** - Users must complete payment before dashboard access
4. **Row Level Security** - All database operations are user-scoped

### PDF Processing Architecture
The app integrates with OpenRouter API using:

**AI Models & Engines:**
- **LLM Model**: `anthropic/claude-3.5-sonnet` - Primary language model for data extraction
- **OCR Engine**: `mistral-ocr` - For scanned receipts and image-based PDFs
- **Text Engine**: `pdf-text` - For digital receipts with selectable text (cost optimization)

**Current Implementation Status:**
- **Trial API** (`/api/process-pdf`): ✅ Fully implemented - Uses `mistral-ocr` engine for all files
- **Batch API** (`/api/batch-processing/process-file`): ✅ Fully implemented - Has `selectEngine()` function that currently returns `mistral-ocr` for all files
- **Smart Engine Selection**: ⚠️ TODO - Implement logic to detect scanned vs digital PDFs
- **Rate limiting**: ✅ Implemented - 2-second delay between batch file processing
- **Transaction Classification**: ✅ Implemented - AI-powered income/expense classification

**API Integration Details:**
- OpenRouter endpoint: `https://openrouter.ai/api/v1/chat/completions`
- File processing via base64 encoding with `data:application/pdf;base64,` prefix
- Plugin configuration: `file-parser` with PDF engine specification
- Engine selection function exists but not yet implemented (always returns `mistral-ocr`)

**Data Extraction Results:**
- Stored as JSONB with fields: `{date, vendor, amount, description}`
- Confidence scores (0.00-1.00) for quality assessment
- Transaction type classification (income/expense) with reasoning
- Engine tracking for processing optimization

### Implementation Status

**✅ Fully Implemented Features:**
- Landing page with trial widget (single PDF processing)
- User authentication and registration flow
- Dashboard with account management
- Batch processing (up to 10 PDFs)
- PDF processing with OpenRouter API integration
- Data extraction with confidence scoring
- Transaction classification (income/expense)
- Review and edit interface
- CSV export (3-column and 4-column formats)
- Usage tracking and limits
- Historical batch access
- Row Level Security (RLS) policies
- Responsive design with premium UI

**⚠️ Partially Implemented:**
- Smart engine selection (function exists but always returns `mistral-ocr`)
- Payment integration (UI exists but not connected to payment processor)

**❌ Not Yet Implemented:**
- Payment processing integration
- Email notifications
- Advanced analytics/reporting
- Multi-user account management
- API rate limiting beyond basic delays

### Key Configuration Files
- **components.json** - shadcn/ui configuration (new-york style, CSS variables)
- **tsconfig.json** - TypeScript config with `@/*` path mapping
- **next.config.mjs** - Ignores build errors and ESLint during builds
- **.cursor/rules/** - Contains PRD and database schema documentation

## Important Patterns

### Component Structure
- Uses shadcn/ui component system with Radix UI primitives
- Follows "new-york" style variant
- CSS variables for consistent theming
- Lucide React for icons

### Authentication Context
The `useAuth()` hook provides:
- `user`, `session`, `loading` state
- `signUp`, `signIn`, `signOut` methods
- LocalStorage caching with 1-hour expiry

### Data Fetching
- Server components for initial data loading
- Supabase RLS policies handle data isolation
- Client-side auth context for real-time auth state

### Styling Conventions
- TailwindCSS with custom CSS variables
- `cn()` utility for conditional classes (clsx + tailwind-merge)
- Component variants using `class-variance-authority`

## Current User Flows

### 1. Anonymous Trial Flow
1. User visits landing page
2. Uploads single PDF via trial widget
3. Selects QuickBooks format (3-column or 4-column)
4. AI processes PDF and extracts data
5. User can edit extracted data (read-only in trial)
6. Conversion gates show "Sign up to download CSV"
7. User can sign up for full access

### 2. Authenticated User Flow
1. User signs up and creates account
2. Dashboard shows usage tracking and account management
3. User creates client accounts for organization
4. User uploads up to 10 PDFs per batch
5. System processes files with rate limiting
6. User reviews and edits extracted data
7. User downloads QuickBooks-ready CSV
8. Historical batches accessible for re-download

### 3. Data Processing Flow
1. PDF uploaded → Base64 encoded
2. OpenRouter API called with `mistral-ocr` engine
3. AI extracts: date, vendor, amount, description
4. Transaction classification (income/expense)
5. Confidence scoring (0.00-1.00)
6. Data stored in `extractions` table as JSONB
7. Usage tracking updated via `update_monthly_usage()`

## Development Notes

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - Openrouter API Key

### Cursor Rules Integration
This project has comprehensive PRD and database schema documentation in `.cursor/rules/` that should be referenced for:
- Business requirements and user flows
- Database schema and RLS policies
- Subscription and usage limit enforcement
- CSV format specifications (3-column vs 4-column QuickBooks)

### Key Business Constraints
- Monthly limit: 1500 pages per user
- Batch limit: 10 PDFs per batch
- File size: 10MB max per PDF
- Subscription model: $9/month active subscriptions only
- CSV formats must match QuickBooks import requirements exactly

### Current Development Status
- **Production Ready**: Core PDF processing, authentication, dashboard
- **Beta Testing**: Free feedback phase with full feature access
- **Next Phase**: Payment integration and production launch