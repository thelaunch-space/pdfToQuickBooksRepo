# PDF to QuickBooks - Design Guidelines

## Overview
This document outlines the design system, UI patterns, and visual guidelines for the PDF to QuickBooks application. These guidelines ensure a consistent, premium, and professional user experience across all screens.

## Design Philosophy

### Core Principles
- **Premium & Professional**: High-quality design that conveys trust and expertise
- **Minimalistic & Clean**: Remove unnecessary elements, focus on essential functionality
- **Action-Focused**: Prioritize user workflows and primary actions
- **Consistent**: Unified design language across all screens
- **Breathable**: Generous spacing and visual hierarchy

## Color Palette

### Primary Colors
- **Purple Gradient**: `from-purple-600 via-purple-700 to-purple-800`
- **Purple Accent**: `purple-600`, `purple-700`, `purple-800`
- **Purple Light**: `purple-50`, `purple-100`, `purple-200`

### Neutral Colors
- **Slate Primary**: `slate-900` (headings), `slate-700` (body text), `slate-600` (secondary text)
- **Slate Backgrounds**: `slate-50`, `slate-100`, `slate-200`
- **White**: `white` with transparency variants (`white/80`, `white/90`, `white/95`)

### Status Colors
- **Success**: `emerald-600`, `emerald-100`, `emerald-50`
- **Warning**: `amber-600`, `amber-100`, `amber-50`
- **Error**: `red-600`, `red-100`, `red-50`
- **Info**: `blue-600`, `blue-100`, `blue-50`

## Typography

### Font Hierarchy
- **Page Titles**: `text-4xl font-bold text-slate-900 tracking-tight`
- **Card Titles**: `text-lg font-bold text-slate-900 tracking-tight`
- **Section Headers**: `text-xl font-bold text-slate-900 tracking-tight`
- **Body Text**: `text-slate-600 font-medium`
- **Secondary Text**: `text-slate-500 font-medium`
- **Small Text**: `text-xs text-slate-500 font-medium`

### Font Weights
- **Bold**: `font-bold` (headings, important numbers)
- **Semibold**: `font-semibold` (labels, buttons)
- **Medium**: `font-medium` (body text, descriptions)
- **Regular**: Default weight for secondary content

## Layout & Spacing

### Container Structure
- **Max Width**: `max-w-7xl mx-auto`
- **Padding**: `px-6` (horizontal), `py-6` (vertical)
- **Grid Gaps**: `gap-6` (small), `gap-8` (medium), `gap-10` (large)

### Spacing System
- **Micro**: `space-y-1`, `space-y-2` (tight spacing)
- **Small**: `space-y-3`, `space-y-4` (card content)
- **Medium**: `space-y-6`, `space-y-8` (section spacing)
- **Large**: `space-y-12` (major sections)

### Grid Layouts
- **Dashboard**: `grid-cols-1 lg:grid-cols-3` (1/3 left, 2/3 right)
- **Stats Cards**: `grid-cols-1 md:grid-cols-3` (3-column responsive)
- **Summary Metrics**: `grid-cols-1 md:grid-cols-3` (3-column layout)

## Card Design System

### Base Card Structure
```css
Card className="group relative overflow-hidden border-0 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300"
```

### Card Variants

#### Standard Card
- **Background**: `bg-white/90 backdrop-blur-xl`
- **Shadow**: `shadow-xl shadow-slate-200/50`
- **Hover**: `hover:shadow-2xl hover:shadow-slate-200/60`
- **Border**: `border-0` (no visible border)
- **Animation**: `transition-all duration-300`

#### Premium Card (with gradient overlay)
- **Overlay**: `absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100`
- **Animation**: `transition-opacity duration-300`

#### Compact Card
- **Padding**: `p-6` (reduced from `p-8`)
- **Height**: `h-fit` for content-based sizing

### Card Content Structure
- **Header**: `CardHeader className="relative pb-4"`
- **Content**: `CardContent className="relative"`
- **Title**: Icon + text with consistent spacing
- **Description**: `text-slate-600 font-medium`

## Icon System

### Icon Containers
- **Size**: `w-8 h-8` (standard), `w-7 h-7` (compact), `w-10 h-10` (large)
- **Background**: `bg-gradient-to-br from-[color]-500 to-[color]-600`
- **Shape**: `rounded-lg` (standard), `rounded-xl` (premium)
- **Shadow**: `shadow-md shadow-[color]-500/25`
- **Icon**: `h-4 w-4 text-white` (standard), `h-3 w-3` (compact)

### Icon Color Mapping
- **Purple**: Primary actions, main features
- **Blue**: Account/client related
- **Emerald**: Success, high confidence
- **Slate**: Secondary actions, history
- **Amber**: Warnings, needs attention

## Button Design System

### Primary Button
```css
className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
```

### Secondary Button
```css
className="border-slate-200 hover:border-slate-300 bg-white/50 hover:bg-white transition-all duration-200"
```

### Button Sizes
- **Small**: `h-8 px-2` (icon buttons)
- **Medium**: `h-9 px-3` (compact actions)
- **Large**: `h-10 px-4` (primary actions)
- **Extra Large**: `h-12 px-6` (hero actions)

## Header Design

### Header Structure
```css
header className="bg-white/95 backdrop-blur-2xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm"
```

### Header Elements
- **Height**: `h-16` (compact)
- **Logo**: `w-9 h-9` with gradient background
- **Navigation**: Breadcrumb-style with active page indicator
- **User Actions**: Right-aligned with consistent spacing

### Navigation Pattern
- **Active Page**: `px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm`
- **Inactive Page**: `text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 px-3 py-2 rounded-lg transition-all duration-200`

## Background & Effects

### Page Background
```css
className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30"
```

### Glass Morphism
- **Backdrop Blur**: `backdrop-blur-xl`, `backdrop-blur-2xl`
- **Transparency**: `bg-white/80`, `bg-white/90`, `bg-white/95`
- **Layered Shadows**: Multiple shadow layers with color tints

### Hover Effects
- **Scale**: `hover:scale-[1.01]` (subtle)
- **Shadow**: Enhanced shadows on hover
- **Opacity**: Gradient overlays that appear on hover
- **Duration**: `duration-300` (standard), `duration-500` (premium)

## Status Indicators

### Confidence Indicators
- **High (≥0.9)**: `text-green-600` with `CheckCircle`
- **Medium (≥0.7)**: `text-yellow-600` with `AlertTriangle`
- **Low (<0.7)**: `text-red-600` with `AlertCircle`

### Status Badges
- **Completed**: `bg-emerald-100 text-emerald-700`
- **Processing**: `bg-amber-100 text-amber-700`
- **Failed**: `bg-red-100 text-red-700`
- **View Only**: `bg-blue-100 text-blue-700`

## Loading States

### Loading Spinner
```css
<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
  <Loader2 className="h-8 w-8 animate-spin text-white" />
</div>
```

### Empty States
- **Icon Container**: `w-20 h-20 bg-slate-100 rounded-3xl`
- **Icon**: `h-10 w-10 text-slate-400`
- **Title**: `text-xl font-semibold text-slate-900`
- **Description**: `text-slate-600`

## Responsive Design

### Breakpoints
- **Mobile**: Default (no prefix)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)

### Mobile Adaptations
- **Navigation**: Hide text labels, show icons only
- **Grid**: Stack vertically on mobile
- **Cards**: Full width with reduced padding
- **Buttons**: Full width for primary actions

## Animation Guidelines

### Transition Durations
- **Fast**: `duration-200` (hover states)
- **Standard**: `duration-300` (card interactions)
- **Premium**: `duration-500` (complex animations)

### Easing
- **Default**: Tailwind's default easing
- **Custom**: Use `transition-all` for comprehensive animations

## Accessibility

### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio
- **Interactive Elements**: Clear focus states
- **Status Colors**: Not the only indicator of state

### Focus States
- **Buttons**: Visible focus rings
- **Interactive Elements**: Clear focus indicators
- **Keyboard Navigation**: Logical tab order

## Implementation Notes

### CSS Classes
- Use Tailwind utility classes for consistency
- Combine classes for complex styling
- Maintain consistent spacing and sizing

### Component Structure
- Always use semantic HTML
- Include proper ARIA labels
- Maintain consistent component hierarchy

### Performance
- Use `transform` and `opacity` for animations
- Minimize layout shifts
- Optimize for 60fps animations

## Examples

### Dashboard Card
```jsx
<Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  <CardContent className="relative p-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/25">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-semibold text-slate-700">Title</span>
    </div>
    {/* Content */}
  </CardContent>
</Card>
```

### Primary Button
```jsx
<Button className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</Button>
```

---

*This design system ensures consistency, premium feel, and professional appearance across all screens of the PDF to QuickBooks application.*
