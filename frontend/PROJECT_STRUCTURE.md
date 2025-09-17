# Project Structure

This document outlines the organized folder structure of the CrossFit Pro application for better maintainability and developer experience.

## 📁 Folder Organization

```
src/
├── api/                    # API layer and data management
│   └── index.ts           # All API endpoints and CRUD operations
├── components/            # Reusable UI and feature components
│   ├── index.ts          # Component exports (clean imports)
│   ├── layout/           # Layout-specific components
│   │   ├── Sidebar.tsx
│   │   └── MobileHeader.tsx
│   ├── ui/               # Pure UI components (reusable)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── TextArea.tsx
│   ├── routines/         # Routine-specific components
│   │   └── CreateEditRoutineModal.tsx
│   └── calendar/         # Calendar-specific components
│       ├── ScheduleWorkoutModal.tsx
│       └── WorkoutDetailsPanel.tsx
├── views/                # Page-level components (routes)
│   ├── index.ts         # View exports (clean imports)
│   ├── Dashboard.tsx    # Main dashboard page
│   ├── RoutinesLibrary.tsx
│   ├── CalendarView.tsx
│   └── ProfileView.tsx
├── hooks/               # Custom React hooks
│   └── useApi.ts       # API-based hooks (replaces localStorage)
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component with routing
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🎯 Structure Benefits

### **Separation of Concerns**
- **`/views`**: Page-level components that represent entire routes
- **`/components`**: Reusable components that can be used across multiple views
- **`/api`**: All data fetching and API logic in one place
- **`/hooks`**: Custom logic that can be shared across components

### **Clean Imports**
```typescript
// Before (messy)
import { Dashboard } from './components/dashboard/Dashboard';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

// After (clean)
import { Dashboard } from './views';
import { Button, Card } from './components';
```

### **Developer Experience**
- **Easy to find**: Know exactly where to look for specific functionality
- **Scalable**: Easy to add new views, components, or features
- **Maintainable**: Clear boundaries between different types of code
- **Intuitive**: Folder names clearly indicate their purpose

## 🔄 Component Types

### **Views** (`/src/views/`)
- **Purpose**: Represent complete pages/routes
- **Examples**: Dashboard, Calendar, Routines, Profile
- **Characteristics**:
  - Full-page components
  - Handle routing and page-level state
  - Compose multiple components together
  - Use hooks for data fetching

### **Layout Components** (`/src/components/layout/`)
- **Purpose**: Handle overall page structure
- **Examples**: Sidebar, Header, Navigation
- **Characteristics**:
  - Used across multiple views
  - Handle responsive layout
  - Navigation and routing logic

### **UI Components** (`/src/components/ui/`)
- **Purpose**: Pure, reusable interface elements
- **Examples**: Button, Input, Modal, Card
- **Characteristics**:
  - Highly reusable
  - No business logic
  - Accept props for customization
  - Can be used anywhere in the app

### **Feature Components** (`/src/components/routines/`, `/src/components/calendar/`)
- **Purpose**: Complex components specific to certain features
- **Examples**: CreateEditRoutineModal, ScheduleWorkoutModal
- **Characteristics**:
  - Feature-specific functionality
  - May contain business logic
  - Used within specific views
  - Can be composed of multiple UI components

## 🚀 Adding New Features

### **Adding a New View**
1. Create component in `/src/views/NewView.tsx`
2. Export from `/src/views/index.ts`
3. Add route in `App.tsx`
4. Add navigation link in `Sidebar.tsx`

### **Adding a New UI Component**
1. Create component in `/src/components/ui/NewComponent.tsx`
2. Export from `/src/components/index.ts`
3. Use anywhere in views or other components

### **Adding a New Feature Component**
1. Create feature folder: `/src/components/feature/`
2. Add components to the feature folder
3. Export from `/src/components/index.ts`

## 📋 Import Patterns

### **Recommended Import Style**
```typescript
// Views
import { Dashboard, CalendarView } from '../views';

// Components (grouped by type)
import { Button, Card, Input } from '../components';
import { Sidebar, MobileHeader } from '../components';

// Hooks and utilities
import { useRoutines, useScheduledWorkouts } from '../hooks/useApi';
import { Routine } from '../types';
```

### **Avoid Deep Imports**
```typescript
// ❌ Don't do this
import { Button } from '../components/ui/Button';
import { Dashboard } from '../views/Dashboard';

// ✅ Do this instead
import { Button } from '../components';
import { Dashboard } from '../views';
```

## 🎨 Benefits for Development

1. **Faster Development**: Know exactly where to find and add code
2. **Better Collaboration**: Clear structure helps team members understand the codebase
3. **Easier Testing**: Components are well-separated and can be tested independently
4. **Scalability**: Easy to add new features without cluttering existing folders
5. **Maintainability**: Changes are localized to specific areas
6. **Code Reuse**: UI components can be easily shared across the application

This structure follows React and modern frontend best practices, making the codebase professional, maintainable, and developer-friendly.
