# Live Editing Canvas

A real-time collaborative presentation editor that allows multiple users to create, edit, and share slide decks together. Built with React 19, TypeScript, Liveblocks, and Supabase.

## Features

### ✅ Core Features (Completed)

**Authentication & User Management**
- Email-based authentication with username support
- Secure JWT session management
- Protected routes with authentication guards
- Session persistence across browser refreshes
- Dark-mode compatible UI throughout

**Deck Management**
- Create unlimited presentation decks
- Edit deck titles inline
- Delete decks with confirmation
- Share decks with authenticated users or keep private
- View all your decks in a responsive grid layout

**Real-Time Slide Editing**
- Multi-slide support with vertical scrolling
- Add unlimited text elements to each slide
- Drag-and-drop to reposition elements
- Rich text formatting (bold, italic, font size)
- Click to select, double-click to edit
- Delete elements with confirmation

**Real-Time Collaboration**
- See other users' cursors in real-time
- Conflict-free collaborative editing (CRDT)
- Live presence indicators with user names
- Color-coded collaborators
- Per-slide isolation for performance
- Automatic persistence to database

## Tech Stack

### Frontend
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety across the codebase
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first styling with dark mode
- **React Router v6**: Client-side routing with lazy loading

### State Management
- **Zustand**: Lightweight state for authentication
- **TanStack Query (React Query)**: Server state with caching & optimistic updates
- **Liveblocks**: Real-time collaboration with CRDT technology

### Backend Services
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - JWT-based authentication
  - Real-time subscriptions
- **Liveblocks**: Multiplayer infrastructure
  - WebSocket connections
  - Conflict-free replicated data types (CRDTs)
  - Presence & awareness APIs

### UI Components
- **Radix UI**: Accessible component primitives (dialogs, icons)
- **React Hot Toast**: Toast notifications

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

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Liveblocks Configuration
VITE_LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_public_key
```

**Get your Supabase credentials:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Navigate to Settings > API
- Copy the Project URL and anon/public key

**Get your Liveblocks key:**
- Go to [Liveblocks Dashboard](https://liveblocks.io)
- Create a project or select existing one
- Copy the Public API key from the API keys section

### 3. Set Up Supabase Database

**Step 1: Enable Authentication**
1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Disable **Email Confirmation** (optional, for development)

**Step 2: Create Database Tables**

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create decks table
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled deck',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'users')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create slides table
CREATE TABLE slides (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  y_doc text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_decks_owner_id ON decks(owner_id);
CREATE INDEX idx_decks_updated_at ON decks(updated_at DESC);
CREATE INDEX idx_slides_deck_id ON slides(deck_id);
CREATE INDEX idx_slides_position ON slides(deck_id, position);

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Decks policies
CREATE POLICY "Users can view own decks" ON decks FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can view shared decks" ON decks FOR SELECT USING (visibility = 'users' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own decks" ON decks FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own decks" ON decks FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own decks" ON decks FOR DELETE USING (auth.uid() = owner_id);

-- Slides policies
CREATE POLICY "Users can view slides of accessible decks" ON slides FOR SELECT
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = slides.deck_id AND (decks.owner_id = auth.uid() OR decks.visibility = 'users')));
CREATE POLICY "Users can insert slides into own decks" ON slides FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM decks WHERE decks.id = slides.deck_id AND decks.owner_id = auth.uid()));
CREATE POLICY "Users can update slides in accessible decks" ON slides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = slides.deck_id AND (decks.owner_id = auth.uid() OR decks.visibility = 'users')));
CREATE POLICY "Users can delete slides from own decks" ON slides FOR DELETE
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = slides.deck_id AND decks.owner_id = auth.uid()));
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed database schema documentation.

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
│   ├── components/              # React components
│   │   ├── ui/                  # Design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── LiveSlideCanvas.tsx      # Main canvas with Liveblocks
│   │   ├── CanvasText.tsx           # Editable text element
│   │   ├── ElementToolbar.tsx       # Format controls
│   │   ├── FloatingToolbar.tsx      # Add text/slide toolbar
│   │   ├── SlideCursors.tsx         # Other users' cursors
│   │   ├── PresenceMouseTracker.tsx # Cursor tracking
│   │   ├── DeckCard.tsx             # Deck preview card
│   │   ├── EmptyState.tsx           # Empty states
│   │   └── RequireAuth.tsx          # Auth guard
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx         # Dashboard with deck list
│   │   ├── LoginPage.tsx        # Authentication
│   │   ├── SignupPage.tsx       # Registration
│   │   └── SlideEditorPage.tsx  # Multi-slide editor
│   ├── lib/                     # Utilities and configurations
│   │   ├── api/
│   │   │   └── decksApi.ts      # Supabase API functions
│   │   ├── queries/
│   │   │   └── decksQueries.ts  # React Query hooks
│   │   ├── supabase.ts          # Supabase client
│   │   ├── liveblocks.ts        # Liveblocks utilities
│   │   ├── queryClient.ts       # React Query config
│   │   └── queryKeys.ts         # Query key factory
│   ├── hooks/                   # Custom React hooks
│   │   └── useSlideStoragePersistence.ts
│   ├── routes/                  # Routing configuration
│   │   ├── AppRoutes.tsx
│   │   └── routeConfig.tsx
│   ├── store/                   # State management
│   │   └── auth.ts              # Zustand auth store
│   ├── types/                   # TypeScript types
│   │   ├── deckTypes.ts         # Deck/Slide types
│   │   └── liveblocks.ts        # Liveblocks types
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── docs/                        # Documentation
│   └── ARCHITECTURE.md          # System architecture (detailed)
├── dist/                        # Production build output
└── public/                      # Static assets
```

## How It Works

### Authentication Flow
1. **Sign Up**: Create account with email, username, and password
2. **Login**: Authenticate with email and password
3. **Protected Routes**: Automatic redirect if not authenticated
4. **Session Persistence**: JWT tokens stored in localStorage
5. **Auto-refresh**: Tokens automatically refreshed before expiry

### Real-Time Collaboration
1. **Join Room**: Each slide creates a Liveblocks room (`slide-{uuid}`)
2. **WebSocket Connection**: Persistent connection for real-time updates
3. **CRDT Sync**: Conflict-free updates using LiveMap and LiveObject
4. **Presence Broadcasting**: Cursor positions and user info shared
5. **Persistence**: Changes auto-saved to Supabase every 2 seconds

### Data Architecture
- **Authentication**: Supabase Auth with JWT tokens
- **Persistent Storage**: PostgreSQL (Supabase) with Row Level Security
- **Real-Time State**: Liveblocks CRDT for collaborative editing
- **Client Cache**: TanStack Query for optimistic updates

## Architecture

This project uses a modern, layered architecture:

- **Presentation Layer**: React components (pages, UI components)
- **State Management**: Zustand (auth), React Query (server), Liveblocks (real-time)
- **API Layer**: Supabase client, Liveblocks rooms
- **Backend**: Supabase (PostgreSQL + Auth) + Liveblocks (WebSocket)

For detailed architecture documentation, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**, which includes:
- System architecture diagrams
- Component hierarchy
- Data flow diagrams
- Database schema with RLS policies
- Real-time collaboration implementation
- Performance optimizations
- Security considerations

## Key Features Explained

### Multi-User Collaboration
Multiple users can edit the same slide simultaneously without conflicts. The system uses **CRDTs (Conflict-free Replicated Data Types)** to automatically merge changes:
- Each edit is timestamped and ordered
- Concurrent updates are merged deterministically
- No locking or coordination needed
- Works seamlessly even with network delays

### Presence System
See who else is viewing and editing:
- Live cursor tracking (throttled with requestAnimationFrame)
- User name labels with unique colors
- Per-slide isolation (cursors only show on active slide)
- Automatic cleanup when users leave

### Optimistic Updates
Actions feel instant because the UI updates before the server responds:
- Create/delete decks
- Update titles
- Add/remove slides
- Automatic rollback on errors

## Development

### Code Quality
```bash
npm run lint      # Check code with Biome
npm run format    # Auto-format code
```

### Building for Production
```bash
npm run build     # Creates optimized bundle in dist/
npm run preview   # Test production build locally
```

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase public anonymous key
- `VITE_LIVEBLOCKS_PUBLIC_KEY`: Liveblocks public API key

## Future Enhancements

Potential features for future development:

### Rich Media
- Image uploads and embedding
- Shapes (rectangles, circles, arrows)
- Drawing tools (freehand, lines)

### Advanced Formatting
- Text color picker
- Font family selection
- Text alignment options
- Background colors for elements
- Z-index/layer management

### Collaboration Features
- Comments and annotations
- Version history with rollback
- Activity feed showing edits
- @mention notifications
- Threaded discussions

### Presentation Mode
- Fullscreen slideshow
- Arrow key navigation
- Presenter notes panel
- Timer and slide counter
- Audience view vs presenter view

### Export & Import
- Export to PDF
- Export to PowerPoint (PPTX)
- Import from Markdown
- Template library
- Custom themes

### Performance
- Virtual scrolling for 100+ slides
- Image optimization and lazy loading
- Progressive Web App (PWA) support
- Offline mode with sync

### Mobile
- Touch gesture support
- Mobile-optimized UI
- Responsive canvas
- Mobile app (React Native)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for more details on planned features.

## Contributing

Contributions are welcome! When building new features:

1. **Use TypeScript**: Full type safety is enforced
2. **Follow Component Patterns**: Check existing components for patterns
3. **Test Dark Mode**: All UI should work in light and dark themes
4. **Accessibility**: Add ARIA labels and keyboard navigation
5. **Optimize**: Use React.memo, useMemo, useCallback where appropriate
6. **Document**: Update architecture docs for significant changes

## License

MIT

