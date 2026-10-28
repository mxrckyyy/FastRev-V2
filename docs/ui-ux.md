# FastRev — UI/UX Specification

## Product experience and target users

FastRev serves students who want to convert study material into flashcards. The experience should feel focused, calm, and academic — not flashy. Primary flows: authenticate, paste material, generate, review/edit, save deck, study.

## Information architecture

- Public: Landing, Login, Register.
- Authenticated: Dashboard (decks), Generate, Deck detail (study).
- Shared layout: top navigation with account menu and logout; responsive sidebar or top bar on mobile.

## Navigation behavior

- Unauthenticated visitors see login/register entry points and marketing content.
- Authenticated users see Dashboard, Generate, account menu, logout.
- On desktop, public Home navigation is grouped with the login and signup actions; the FastRev brand mark remains the persistent home link.
- Protected routes redirect unauthenticated users to login.
- Expired/invalid tokens trigger logout and redirect with a clear message.

## Design principles

- Clarity over decoration.
- Consistent spacing and typography.
- One primary action per screen region.
- Calm academic palette; avoid neon/glow overload.
- Honest messaging about free-provider availability.
- Landing and authentication surfaces use a responsive, mobile-first layout with a single green action accent.
- Landing communicates the review-before-save workflow with an illustrative card preview; the example is not presented as generated or saved user content.

## Visual hierarchy

- Headings: bold, clear.
- Body: readable 16px base.
- Cards: subtle borders/shadows; not every surface animated.
- Primary buttons: high contrast; secondary: outline/ghost.

## Typography

- System/Inter-like sans-serif. Base 16px, line-height 1.5.
- Scale: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24, 3xl 30.

## Spacing

- 4px base unit; common gaps 8/12/16/24/32/48.
- Container max-width ~1120px; consistent horizontal padding.

## Color tokens

- Neutral grays for surfaces/text.
- Single accent (indigo/blue) for primary actions.
- Semantic: success green, warning amber, danger red, info blue.
- Dark mode optional later; document if added.

## Responsive breakpoints

- sm 640, md 768, lg 1024, xl 1280.
- Mobile-first layouts; stack cards; full-width inputs on small screens.
- Public navigation uses a 44px mobile menu control and full-width, touch-sized route actions.
- The mobile navigation closes after route changes and supports Escape; a skip-to-content link is available to keyboard users.
- The landing hero and sign-in/sign-up forms become single-column layouts below 768px; account forms keep labels, errors, and actions in a clear vertical sequence.
- Landing actions remain side-by-side when they fit and stack on narrow phones. The study preview also collapses to one column on very narrow screens.

## Component standards

- shadcn/ui for buttons, inputs, textarea, labels, dialogs, dropdowns, tooltips, toasts, cards, tabs, badges, skeletons.
- lucide-react icons.
- Consistent focus rings (2px accent).

## Form design

- Visible labels; inline validation messages; disabled submit during request.
- Character counter for study material (max 20,000).
- Clear error text; no raw provider errors.

## Accessibility

- WCAG AA contrast.
- Keyboard navigation for all controls; focus management in dialogs.
- Answer reveal via click or Enter/Space.
- Reduced-motion support (`prefers-reduced-motion`).
- Screen-reader-friendly labels and live regions for async status.
- Account fields expose inline validation through `aria-invalid` and `aria-describedby`; pending submit actions are disabled and announced with `aria-busy`.
- Invalid account fields receive focus after submission so users can correct the first error without searching the form.
- Interactive mobile navigation controls have accessible names, expanded state, and current-page semantics.

## Keyboard navigation

- Tab order logical; Escape closes dialogs; Enter submits forms.

## Focus management

- Move focus to first invalid field on validation error.
- Return focus after dialog close.

## Loading and error states

- Skeletons/spinners for async; skeleton cards for deck lists.
- Friendly error banners with retry where appropriate.
- Empty states with helpful guidance and primary CTA.

## Empty states

- Dashboard: "No decks yet — generate your first flashcards."
- Deck: handled at study view.

## Flashcard review interactions

- Editable question/answer textareas per card.
- Remove card button with confirmation only if needed (instant remove + undo toast acceptable).
- Deck title input; explicit Save Deck button.
- Discard/restart action with confirmation if unsaved changes.

## Confirmation dialogs

- Destructive actions (delete deck, discard draft) require confirmation dialog (shadcn AlertDialog).

## Motion and reduced-motion behavior

- CSS transitions for hover/focus.
- Motion for React for route/card entrance/removal (restrained).
- AutoAnimate for simple list add/remove.
- GSAP only for coordinated landing intro (optional, timeline-based).
- Aceternity UI selective background/hero effects.
- Honor `prefers-reduced-motion`: disable decorative animations; keep functional transitions minimal.
- No animation on same property/element by multiple systems.

## Distinct roles of libraries

- shadcn/ui: accessible control foundation.
- Aceternity UI: selective visual polish (landing hero/background/featured spotlight).
- Motion for React: ordinary interface animation.
- GSAP: advanced timeline sequences (landing intro only, if used).
- AutoAnimate: simple list layout transitions.
- CSS: basic hover/focus.