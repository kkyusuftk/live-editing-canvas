# Quick Reference Card

> **One-page guide to building features with our design system**

## Import Components

```tsx
import { Button, Input, Alert, Card, LoadingSpinner } from '@/components/ui'
```

---

## Button

```tsx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button isLoading>Submitting...</Button>
<Button fullWidth>Full Width</Button>
<Button size="sm">Small</Button>
```

---

## Input

```tsx
<Input 
  label="Email" 
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
/>
```

---

## Alert

```tsx
<Alert variant="error">Error message</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="warning">Warning message</Alert>
<Alert variant="info">Info message</Alert>
```

---

## Card

```tsx
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

---

## LoadingSpinner

```tsx
<LoadingSpinner />
<LoadingSpinner size="lg" message="Loading..." />
<LoadingSpinner fullScreen message="Initializing..." />
```

---

## Colors Cheat Sheet

### Backgrounds
- Page: `bg-gray-50 dark:bg-gray-900`
- Card: `bg-white dark:bg-gray-800`
- Secondary: `bg-gray-50 dark:bg-gray-700`

### Text
- Primary: `text-gray-900 dark:text-white`
- Secondary: `text-gray-600 dark:text-gray-400`
- Label: `text-gray-700 dark:text-gray-300`

### Borders
- Default: `border-gray-300 dark:border-gray-600`

---

## Typography

```tsx
// Page title
<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">

// Section title  
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">

// Body
<p className="text-gray-600 dark:text-gray-400">

// Small
<p className="text-sm text-gray-500 dark:text-gray-400">
```

---

## Common Layouts

### Centered Page (Auth)
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <div className="max-w-md w-full space-y-8">
    {/* Content */}
  </div>
</div>
```

### Page with Nav
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <nav className="bg-white dark:bg-gray-800 shadow">
    {/* Nav */}
  </nav>
  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    {/* Content */}
  </main>
</div>
```

---

## Spacing Scale

- `space-y-4` - Small spacing (1rem / 16px)
- `space-y-6` - Medium spacing (1.5rem / 24px)
- `space-y-8` - Large spacing (2rem / 32px)

---

## Complete Form Example

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {error && <Alert variant="error">{error}</Alert>}
  
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
  />
  
  <Input
    label="Password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    error={errors.password}
  />
  
  <Button type="submit" fullWidth isLoading={loading}>
    Submit
  </Button>
</form>
```

---

## Checklist for New Features

- [ ] Use UI components instead of raw Tailwind
- [ ] Test in both light and dark mode
- [ ] Add loading states
- [ ] Include error handling
- [ ] Verify keyboard navigation
- [ ] Add proper ARIA attributes
- [ ] Follow existing layout patterns
- [ ] Keep components small and focused

---

## Need More Details?

- **Full Design System**: `docs/design_system.md`
- **Component Guide**: `docs/component_usage_guide.md`
- **UI Components**: `src/components/ui/README.md`
- **Example Code**: `src/pages/LoginPage.refactored.example.tsx`

