# UI/UX Guidelines

## Design Tokens
- Tailwind CSS, mobile-first
- Brand: defined in `client/tailwind.config.js`
- Component primitives: shadcn/ui under `client/src/components/ui/`

## Required UI States (every list/detail/form)
1. **Loading** — skeleton, no layout shift
2. **Empty** — friendly message + primary CTA when applicable
3. **Error** — inline message + retry where retry is meaningful
4. **Success** — primary content, properly paginated

## Mobile-First Breakpoints
- `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Test layouts at < 768px before declaring done

## Accessibility Baseline
- All interactive elements keyboard-reachable, with visible focus ring
- All images have `alt`; decorative images use `alt=""`
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components
- Form fields associated with `<label>` (or `aria-label` if visually hidden)
- Error messages announced via `aria-live="polite"`
- Modals trap focus and restore focus on close

## Safety
- All destructive actions (delete user, delete report) require a confirmation dialog
- Submit buttons disabled while a request is in flight to prevent double-submit
