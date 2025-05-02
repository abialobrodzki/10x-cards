# Mobile Navigation Specification (Responsive Web)

## Overview

This specification outlines the changes required to improve the mobile experience of the 10xRules.ai application **on responsive web** while maintaining the current desktop behavior. The changes focus on implementing a mobile-first bottom navigation pattern and reorganizing the main panels for better accessibility.

## Components Affected

- `LoginForm.tsx` (Login form component in src/components/auth)
- `SignUpForm.tsx` (Registration form component in src/components/auth)
- `ForgotPasswordForm.tsx` (Forgot password form component in src/components/auth)
- `FlashcardsPage.tsx` (Flashcards view component in src/components/flashcards/)
- `GenerateView.tsx` (Generate view component in src/components/)
- A new bottom navigation component (to be created in src/components)

## Desktop Behavior (>= md breakpoint)

- Maintain current two-panel layout
- Keep the existing sidebar toggle functionality
- Preserve current footer visibility and positioning
- No changes to current panel distribution and sizing

## Mobile Behavior (< md breakpoint)

### Layout Changes

- Transform into a single-panel view with bottom navigation
- Hide the classic footer component
- Each panel (Flashcards, Generate) becomes a full-width view
- Remove the current top-right toggle button
- Make collections panel full width and height

### Bottom Navigation

- Fixed position at the bottom of the viewport
- Two equal-width navigation items:
  1. Flashcards
  2. Generate
- Active state indication for current view
- Consistent with **Shadcn/ui** design system
- Dark theme by default

### Panel Transitions

- Smooth transitions between views (300ms duration)
- Maintain scroll position for each view independently
- No content reflow during transitions

### Accessibility Requirements

- Minimum touch target size: 44x44px
- Clear visual feedback on active states
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## Authentication Views Mobile Behavior (< md breakpoint)

For unauthenticated users, the application will display full-screen views for login, registration, and password recovery. These views will not include the bottom navigation bar. The transition between these authentication views should also be smooth.

## Success Metrics

- Improved mobile usability score
- Reduced cognitive load for mobile users
- Maintained desktop experience quality
- Seamless responsive behavior across breakpoints
