# Live Editing Canvas

A collaborative canvas application with real-time editing capabilities, built with React 19, TypeScript, and Supabase.

## Features

✅ **Phase 1 - Authentication** (Completed)
- User registration with email and username
- Login with email/username and password
- Protected routes with authentication guards
- Session persistence
- Beautiful dark-mode compatible UI

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd live-editing-canvas
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your [Supabase Dashboard](https://app.supabase.com) under Settings > API.

### 3. Configure Supabase

In your Supabase project dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Disable **Email Confirmation** (optional, for development)

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
live-editing-canvas/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components (Button, Input, etc.)
│   │   └── RequireAuth.tsx
│   ├── lib/              # Utilities and configurations
│   │   └── supabase.ts
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── store/            # Zustand stores
│   │   └── auth.ts
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Type declarations
├── docs/                 # Documentation
│   ├── design_system.md           # Design system guidelines
│   ├── component_usage_guide.md   # How to use components
│   ├── QUICK_REFERENCE.md         # Quick reference card
│   └── ...
└── public/               # Static assets
```

## Authentication Flow

1. **Sign Up**: Users create an account with email, username, and password
2. **Login**: Users sign in with email (or username in future) and password
3. **Protected Routes**: Authenticated users access the home page
4. **Session Persistence**: Sessions are maintained across page refreshes
5. **Sign Out**: Users can log out, clearing their session

## Development Notes

### Phase 1 Completion Checklist

- ✅ Vite + React 19 + TypeScript setup
- ✅ Tailwind CSS configuration
- ✅ Supabase client setup
- ✅ Zustand auth store
- ✅ React Router with protected routes
- ✅ Login page with validation
- ✅ Signup page with validation
- ✅ Protected home page
- ✅ Dark mode support
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ Error handling and loading states

## Future Phases

- **Phase 2**: Canvas implementation with real-time collaboration
- **Phase 3**: Drawing tools and user interactions
- **Phase 4**: Advanced features (layers, history, export)

## Design System

We have a comprehensive design system to ensure consistency across the app:

- **📘 [Design System Guidelines](docs/design_system.md)** - Color palette, typography, patterns
- **🎨 [UI Components](src/components/ui/README.md)** - Reusable components library  
- **📖 [Component Usage Guide](docs/component_usage_guide.md)** - How to build features
- **⚡ [Quick Reference](docs/QUICK_REFERENCE.md)** - One-page cheat sheet

### Using UI Components

```tsx
import { Button, Input, Alert, Card } from '@/components/ui'

// Clean, consistent, and accessible components
<Button isLoading={loading}>Submit</Button>
<Input label="Email" error={errors.email} />
<Alert variant="success">Saved!</Alert>
```

## Contributing

Contributions are welcome! Please read the documentation in the `docs/` folder for technical specifications and implementation plans.

When building new features:
1. Use the UI components from `src/components/ui/`
2. Follow patterns in the design system docs
3. Test in both light and dark modes
4. Ensure accessibility (keyboard nav, ARIA attributes)

## License

MIT

