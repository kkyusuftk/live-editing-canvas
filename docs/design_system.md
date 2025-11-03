# Design System Guidelines

This document outlines the design patterns, components, and styling conventions for the Live Editing Canvas application.

## Design Principles

1. **Consistency**: Use standardized components and patterns across the application
2. **Accessibility**: All components must be keyboard-navigable and screen-reader friendly
3. **Dark Mode First**: All components must support both light and dark modes
4. **Minimal & Modern**: Clean, uncluttered interfaces with purposeful whitespace

---

## Color Palette

### Background Colors
- **Light mode page background**: `bg-gray-50`
- **Dark mode page background**: `dark:bg-gray-900`
- **Light mode card/container**: `bg-white`
- **Dark mode card/container**: `dark:bg-gray-800`
- **Light mode secondary background**: `bg-gray-50`
- **Dark mode secondary background**: `dark:bg-gray-700`

### Text Colors
- **Primary text (light)**: `text-gray-900`
- **Primary text (dark)**: `dark:text-white`
- **Secondary text (light)**: `text-gray-600`
- **Secondary text (dark)**: `dark:text-gray-400`
- **Label text (light)**: `text-gray-700`
- **Label text (dark)**: `dark:text-gray-300`
- **Muted text (light)**: `text-gray-500`
- **Muted text (dark)**: `dark:text-gray-400`

### Brand Colors
- **Primary**: `blue-600` (buttons, links, accents)
- **Primary hover**: `blue-700`
- **Primary light**: `blue-400` (dark mode)
- **Primary hover (dark)**: `blue-500` (dark mode)

### Status Colors
- **Error background (light)**: `bg-red-50`
- **Error background (dark)**: `dark:bg-red-900/20`
- **Error border (light)**: `border-red-200`
- **Error border (dark)**: `dark:border-red-800`
- **Error text (light)**: `text-red-800`
- **Error text (dark)**: `dark:text-red-200`

### Border Colors
- **Default (light)**: `border-gray-300`
- **Default (dark)**: `dark:border-gray-600`
- **Focus**: `focus:border-blue-500`

---

## Typography

### Headings
- **Page Title (h1)**: `text-3xl font-extrabold`
- **Section Title (h2)**: `text-2xl font-bold`
- **Subsection Title (h3)**: `text-xl font-semibold`

### Body Text
- **Default**: `text-sm` or `text-base`
- **Small text**: `text-xs`
- **Labels**: `text-sm font-medium`

### Font Weights
- **Regular**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)
- **Extrabold**: `font-extrabold` (800)

---

## Spacing & Layout

### Container Padding
- **Page container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section padding**: `py-6` or `py-8`
- **Card padding**: `p-6` or `p-8`

### Component Spacing
- **Form field spacing**: `space-y-4`
- **Form section spacing**: `space-y-6`
- **Horizontal spacing**: `space-x-4`

### Minimum Sizes
- **Full viewport height**: `min-h-screen`
- **Button height**: implicit via padding `py-2`

---

## Component Patterns

### 1. Page Layout Pattern

```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  {/* Content */}
</div>
```

### 2. Centered Form Page Pattern

```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <div className="max-w-md w-full space-y-8">
    {/* Form content */}
  </div>
</div>
```

### 3. Card/Container Pattern

```tsx
<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
  {/* Card content */}
</div>
```

### 4. Navigation Bar Pattern

```tsx
<nav className="bg-white dark:bg-gray-800 shadow">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      {/* Nav content */}
    </div>
  </div>
</nav>
```

---

## Reusable Components

### Button Component
See `src/components/ui/Button.tsx`

**Variants:**
- `primary` (default): Blue button for primary actions
- `secondary`: Gray button for secondary actions
- `danger`: Red button for destructive actions

**States:**
- Default
- Hover
- Disabled
- Loading

### Input Component
See `src/components/ui/Input.tsx`

**Features:**
- Label integration
- Error state
- Helper text
- Dark mode support
- Proper accessibility attributes

### Alert Component
See `src/components/ui/Alert.tsx`

**Variants:**
- `error`: Red alert for errors
- `success`: Green alert for success messages
- `warning`: Yellow alert for warnings
- `info`: Blue alert for information

---

## Accessibility Guidelines

### Required Attributes

1. **Form Inputs**
   - `id` linked to `htmlFor` in label
   - `required` attribute when applicable
   - `aria-label` or visible label
   - Proper `type` attribute
   - `autoComplete` for better UX

2. **Buttons**
   - Clear text labels (no icon-only without aria-label)
   - `disabled` state when loading
   - Visual feedback on hover/focus

3. **Error Messages**
   - `role="alert"` for error containers
   - `aria-live="polite"` for dynamic errors

4. **Focus Management**
   - Visible focus rings: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
   - Logical tab order
   - No focus traps

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Enter key should submit forms
- Escape key should close modals/dialogs

---

## Animation & Transitions

### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
```

### Hover Transitions
```tsx
className="transition-colors duration-200 hover:bg-blue-700"
```

---

## Form Validation Patterns

### Client-Side Validation
1. **Required fields**: Check for empty values
2. **Email format**: Use regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. **Username length**: 3-24 characters
4. **Password strength**: Minimum 8 characters

### Error Display
- Show errors inline below the field
- Show general errors at the top of the form
- Clear errors on new submission attempt
- Use `aria-live` regions for screen readers

### Success States
- Redirect on success (for auth flows)
- Show success message (for updates/saves)
- Clear form after submission (when appropriate)

---

## Dark Mode Implementation

### Strategy
- Use Tailwind's `dark:` variant for all color-related classes
- Test all components in both modes
- Ensure sufficient contrast in both modes

### Common Patterns
```tsx
// Background
className="bg-white dark:bg-gray-800"

// Text
className="text-gray-900 dark:text-white"

// Borders
className="border-gray-300 dark:border-gray-600"

// Inputs
className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
```

---

## File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Alert.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── layout/          # Layout components
│   │   ├── Nav.tsx
│   │   └── PageContainer.tsx
│   └── [feature]/       # Feature-specific components
│       └── RequireAuth.tsx
├── pages/               # Page components
└── lib/                 # Utilities
```

---

## Usage Examples

### Creating a New Page
1. Follow the page layout pattern
2. Use reusable UI components
3. Ensure dark mode support
4. Add proper accessibility attributes
5. Test keyboard navigation

### Creating a New Form
1. Use `Input` component for form fields
2. Use `Button` component with appropriate variant
3. Add validation with clear error messages
4. Handle loading states
5. Include proper ARIA attributes

---

## Future Enhancements

- [ ] Add animation library (Framer Motion)
- [ ] Create a component showcase/storybook
- [ ] Add more UI primitives (Modal, Dropdown, Tooltip)
- [ ] Implement theme customization
- [ ] Add CSS variables for easier theming

