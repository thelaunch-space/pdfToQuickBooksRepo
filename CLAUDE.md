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

- **profiles** - User subscription status and monthly usage tracking
- **accounts** - Client organizations (for bookkeepers to organize work)
- **batches** - Processing sessions (up to 10 files each)
- **extractions** - Individual PDF results with JSONB extracted_data

Key business functions:
- `check_usage_limit(user_uuid, additional_pages)` - Enforces 1500 page limit
- `update_monthly_usage(user_uuid, pages_used)` - Tracks monthly consumption
- `handle_new_user()` - Auto-creates profiles on signup

### Directory Structure
```
app/
├── api/                    # API routes
│   ├── batch-processing/   # Batch processing endpoints
│   └── process-pdf/       # Single PDF processing
├── dashboard/             # Authenticated user dashboard
├── login/                # Login page
├── payment/              # Payment flow
├── signup/               # Registration page
├── globals.css           # TailwindCSS styles
├── layout.tsx           # Root layout with AuthProvider
└── page.tsx             # Landing page with trial widget

components/
├── ui/                   # shadcn/ui components
├── batch-processing-widget.tsx
├── trial-widget.tsx
└── theme-provider.tsx

contexts/
└── auth-context.tsx     # Supabase authentication context

lib/
├── supabase.ts         # Supabase client
├── supabase-server.ts  # Server-side Supabase client
├── supabase-middleware.ts
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

**Current Implementation:**
- **Trial API** (`/api/process-pdf`): Uses `mistral-ocr` engine for all files
- **Batch API** (`/api/batch-processing/process-file`): Has `selectEngine()` function that currently returns `mistral-ocr` for all files
- **TODO**: Implement smart engine selection logic to detect scanned vs digital PDFs
- **Rate limiting**: 2-second delay between batch file processing

**API Integration:**
- OpenRouter endpoint: `https://openrouter.ai/api/v1/chat/completions`
- File processing via base64 encoding with `data:application/pdf;base64,` prefix
- Plugin configuration: `file-parser` with PDF engine specification
- Engine selection function exists but not yet implemented (always returns `mistral-ocr`)

Results stored as JSONB with fields: `{date, vendor, amount, description}`

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