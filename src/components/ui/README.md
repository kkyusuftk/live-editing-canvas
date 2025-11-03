# UI Components Library

This directory contains all reusable UI components that follow our design system guidelines.

## Components Overview

### Button
A flexible button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean (shows loading spinner)
- `fullWidth`: boolean (takes full width of container)
- All standard button HTML attributes

**Usage:**
```tsx
import { Button } from '@/components/ui'

// Primary button
<Button onClick={handleClick}>Click me</Button>

// Loading state
<Button isLoading>Submitting...</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Small size
<Button size="sm">Small Button</Button>
```

---

### Input
A text input component with label, error, and helper text support.

**Props:**
- `label`: string (displays above input)
- `error`: string (displays error message, changes styling)
- `helperText`: string (displays helper text below input)
- All standard input HTML attributes

**Usage:**
```tsx
import { Input } from '@/components/ui'

// Basic input
<Input 
  label="Email" 
  type="email" 
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With error
<Input 
  label="Username" 
  error="Username must be at least 3 characters"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// With helper text
<Input 
  label="Password" 
  type="password"
  helperText="At least 8 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Disabled
<Input label="Disabled" disabled value="Cannot edit" />
```

---

### Alert
A component for displaying messages with different severity levels.

**Props:**
- `variant`: 'error' | 'success' | 'warning' | 'info' (default: 'info')
- `children`: ReactNode (content of the alert)

**Usage:**
```tsx
import { Alert } from '@/components/ui'

// Error alert
<Alert variant="error">
  Invalid credentials. Please try again.
</Alert>

// Success alert
<Alert variant="success">
  Your account has been created successfully!
</Alert>

// Warning alert
<Alert variant="warning">
  Your session will expire in 5 minutes.
</Alert>

// Info alert
<Alert variant="info">
  Check your email for verification instructions.
</Alert>
```

---

### Card
A container component with consistent styling and shadows.

**Props:**
- `noPadding`: boolean (removes default padding)
- `children`: ReactNode (content of the card)
- All standard div HTML attributes

**Usage:**
```tsx
import { Card } from '@/components/ui'

// Basic card
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>

// Card without padding (for custom layouts)
<Card noPadding>
  <div className="p-4 border-b">Header</div>
  <div className="p-4">Content</div>
</Card>
```

---

### LoadingSpinner
A loading indicator with optional message and full-screen mode.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `message`: string (optional message below spinner)
- `fullScreen`: boolean (centers in full viewport)

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/ui'

// Basic spinner
<LoadingSpinner />

// With message
<LoadingSpinner message="Loading your data..." />

// Full screen loading
<LoadingSpinner fullScreen message="Initializing application..." />

// Small size
<LoadingSpinner size="sm" />
```

---

## Complete Example: Login Form

Here's a complete example using multiple UI components:

```tsx
import { useState, FormEvent } from 'react'
import { Button, Input, Alert, Card, LoadingSpinner } from '@/components/ui'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Your login logic here
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-gray-900 dark:text-white">
          Sign in to your account
        </h1>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}
            
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              isLoading={loading}
            >
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
```

---

## Adding New Components

When creating new UI components, follow these guidelines:

1. **Place in `src/components/ui/`** directory
2. **Export from `index.ts`** for easy imports
3. **Follow naming conventions**: PascalCase for components
4. **Include TypeScript types**: Export Props interface
5. **Support dark mode**: Use `dark:` variants for all colors
6. **Add accessibility**: Include proper ARIA attributes
7. **Document in this README**: Add usage examples
8. **Keep it flexible**: Accept common HTML attributes via spread
9. **Use forwardRef**: For components that might need refs
10. **Test both modes**: Verify light and dark mode appearance

---

## Design Tokens

These components use consistent design tokens from our design system:

- **Colors**: Blue (primary), Gray (neutral), Red (danger), Green (success), Yellow (warning)
- **Spacing**: Consistent padding and margins using Tailwind's scale
- **Typography**: Font sizes from xs to 3xl, weights from normal to extrabold
- **Border radius**: `rounded` (4px) and `rounded-md` (6px)
- **Shadows**: `shadow` for cards and elevated elements
- **Transitions**: 200ms duration for hover states

For more details, see `/docs/design_system.md`

