# Component Usage Guide

This guide helps you build new features using our design system and UI components.

## Quick Start Checklist

When creating a new page or feature:

- [ ] Import UI components from `@/components/ui` or `'../components/ui'`
- [ ] Use existing components instead of writing raw Tailwind classes
- [ ] Follow the page layout patterns from `design_system.md`
- [ ] Test in both light and dark mode
- [ ] Verify keyboard navigation works
- [ ] Check accessibility with screen reader (if possible)

---

## Step-by-Step: Creating a New Page

### 1. Start with the Page Layout

Choose the appropriate layout pattern:

**Full-screen centered content** (for auth pages, modals):
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <div className="max-w-md w-full space-y-8">
    {/* Your content */}
  </div>
</div>
```

**Page with navigation** (for app pages):
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <nav className="bg-white dark:bg-gray-800 shadow">
    {/* Navigation */}
  </nav>
  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    {/* Page content */}
  </main>
</div>
```

### 2. Use UI Components for Common Elements

**Forms:**
```tsx
import { Button, Input, Alert } from '@/components/ui'

<form onSubmit={handleSubmit} className="space-y-6">
  {error && <Alert variant="error">{error}</Alert>}
  
  <Input
    label="Field Name"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    required
  />
  
  <Button type="submit" fullWidth isLoading={loading}>
    Submit
  </Button>
</form>
```

**Cards:**
```tsx
import { Card } from '@/components/ui'

<Card>
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
    Card Title
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    Card content...
  </p>
</Card>
```

**Loading States:**
```tsx
import { LoadingSpinner } from '@/components/ui'

// Inline loading
{isLoading && <LoadingSpinner message="Loading data..." />}

// Full screen loading
if (!initialized) {
  return <LoadingSpinner fullScreen message="Initializing..." />
}
```

### 3. Apply Consistent Typography

```tsx
// Page title
<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
  Page Title
</h1>

// Section title
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
  Section Title
</h2>

// Subsection title
<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
  Subsection
</h3>

// Body text
<p className="text-gray-600 dark:text-gray-400">
  Body text goes here
</p>

// Small text
<p className="text-sm text-gray-500 dark:text-gray-400">
  Small helper text
</p>
```

---

## Common Patterns

### Authentication Check Pattern

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LoadingSpinner } from '@/components/ui'

export function MyPage() {
  const { session, initialized } = useAuthStore()
  
  // Show loading while checking auth
  if (!initialized) {
    return <LoadingSpinner fullScreen />
  }
  
  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/login" replace />
  }
  
  return <div>{/* Page content */}</div>
}
```

### Form Validation Pattern

```tsx
const [formData, setFormData] = useState({ email: '', password: '' })
const [errors, setErrors] = useState<Record<string, string>>({})

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  if (!formData.email) {
    newErrors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email is invalid'
  }
  
  if (!formData.password) {
    newErrors.password = 'Password is required'
  } else if (formData.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  if (!validateForm()) return
  
  // Submit form...
}

return (
  <form onSubmit={handleSubmit}>
    <Input
      label="Email"
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      error={errors.email}
    />
    {/* More fields... */}
  </form>
)
```

### List with Empty State Pattern

```tsx
import { Card } from '@/components/ui'

{items.length === 0 ? (
  <Card>
    <div className="text-center py-12">
      <p className="text-gray-500 dark:text-gray-400">
        No items found. Create your first one!
      </p>
      <Button className="mt-4" onClick={handleCreate}>
        Create Item
      </Button>
    </div>
  </Card>
) : (
  <div className="space-y-4">
    {items.map(item => (
      <Card key={item.id}>
        {/* Item content */}
      </Card>
    ))}
  </div>
)}
```

---

## Do's and Don'ts

### ✅ DO

- **Use UI components** for buttons, inputs, alerts, cards
- **Follow existing patterns** from `design_system.md`
- **Test dark mode** on every page you create
- **Use semantic HTML** (`<nav>`, `<main>`, `<section>`, etc.)
- **Add ARIA attributes** for custom interactive elements
- **Keep components small** and focused on one responsibility
- **Extract repeated JSX** into new components

### ❌ DON'T

- **Don't duplicate Tailwind classes** - create a component instead
- **Don't hardcode colors** - use the design system colors
- **Don't forget dark mode** - every color needs a `dark:` variant
- **Don't skip accessibility** - always add labels, ARIA attributes
- **Don't create large components** - break them into smaller pieces
- **Don't ignore loading states** - always show feedback to users
- **Don't use inconsistent spacing** - stick to Tailwind's scale

---

## Refactoring Existing Code

If you find yourself writing code like this:

```tsx
// ❌ Before - Repeated classes, no reusability
<button
  disabled={loading}
  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Loading...' : 'Submit'}
</button>
```

Refactor to:

```tsx
// ✅ After - Clean, reusable, consistent
<Button fullWidth isLoading={loading}>
  Submit
</Button>
```

---

## Getting Help

1. **Check existing pages** - Look at `LoginPage.tsx`, `SignupPage.tsx`, `HomePage.tsx` for patterns
2. **Review the design system** - See `docs/design_system.md` for styling guidelines
3. **Look at UI component code** - See `src/components/ui/` for implementation details
4. **Check the example** - See `LoginPage.refactored.example.tsx` for before/after comparison

---

## Next Steps

Ready to build? Here's what to do:

1. **Create your component file** in the appropriate directory
2. **Import UI components** you'll need
3. **Follow a layout pattern** from the design system
4. **Build your feature** using the component patterns
5. **Test thoroughly** in both light and dark mode
6. **Get feedback** from the team

Happy coding! 🚀

