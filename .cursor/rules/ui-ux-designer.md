## 10x MealFlip – UI/UX Review Rules (Web App, PWA, Astro + React)

Purpose: Provide high-signal review guidance for expert product/UI designers. Optimize for clarity, speed to decision, and delightful simplicity. Align decisions with PRD KPIs (time_to_decision, activation, retention) and performance budgets (LCP ≤ 2.5s, P95 TTI ≤ 3s).

### Core Principles
- **Clarity first**: Single primary action per view. Remove non-essential elements.
- **Speed to decision**: Everything supports getting to a good meal choice fast.
- **Consistency**: Layout, spacing, typography, and component patterns are consistent across flows.
- **Accessibility**: WCAG AA, keyboard-first flows, ARIA where needed.
- **Mobile-first**: Design for small screens; enhance progressively on desktop.

### Primary Flows to Review
1) Landing → Losuj (gate on login)
2) Onboarding filters (czas, dieta)
3) Draw result (recipe view) with reroll, save, share
4) Daily pick
5) Favorites and history
6) Share page (SSR) with attribution
7) Admin minimal flows (moderation)

### Usability Checklist
- Navigation is obvious; user always knows where they are and what to do next.
- Single clear CTA per screen (e.g., Losuj). Secondary actions are visually subordinate.
- Onboarding filters: defaults set (30 min, brak diety); multi-select for diets; immediate feedback.
- Reroll affordance shows remaining count; communicates soft limit of 5 with friendly guidance.
- Empty states and error states are explicit and helpful (offer actions to recover).
- Save and Share provide visible confirmation and undo where sensible.
- Loading skeletons/spinners where latency > 200ms; avoid layout shift.
- Forms: clear labels, helpful inline validation, minimal fields, sensible defaults.
- Modals/sheets: focus trap, Esc closes, restore focus to invoker.
- PWA install prompt timing: not on first visit; after engagement signal.

### Information Architecture & Content
- Titles concise; one H1 per page. Use consistent naming (Polish UI text).
- Recipe view hierarchy: image → title → key actions → ingredients → instructions → attribution.
- Filters are discoverable and quickly adjustable from main flow.
- Copy is plain, friendly Polish; no jargon; avoids long paragraphs.
- Attribution to TheMealDB is clear on recipe and share pages; include link.

### Visual Design
- Typography scale consistent; 4/8px spacing system with Tailwind tokens.
- Contrast AA+ for text and UI controls; check dark/light if applicable.
- Iconography is meaningful with text labels where ambiguity exists.
- Components adhere to shadcn/ui patterns; avoid bespoke inconsistencies.
- Avoid visual noise: limit simultaneous colors; use semantic color tokens.

### Interaction & Feedback
- Reroll animates subtly; indicate state change without being distracting.
- Soft-limit exceeded: show friendly message and suggest adjusting filters.
- Offline: educate user that last recipe is available; show revalidation status.
- Share: confirm copied link; for SSR page, show light meta preview.
- Long content (ingredients/instructions): use section anchors or sticky actions.

### Performance & Perceived Speed
- Lazy load non-critical media; prioritize image of current recipe.
- Avoid blocking banners or modals on first paint.
- Prefetch likely next actions (e.g., next recipe metadata) only when cheap.
- Maintain CLS ≈ 0 by reserving image space; use aspect ratios.

### Accessibility
- Keyboard paths for all core flows (Losuj, Reroll, Save, Share, Filters).
- Visible focus states; target sizes ≥ 44px.
- Labels for inputs/switches; aria-live for async updates and reroll count.
- Alt text for images (recipe title + descriptor). Descriptive share links.

### Analytics & Ethics
- Events emitted per taxonomy with properties: filters + time_to_decision.
- Avoid dark patterns; provide clear opt-outs and transparent states.
- Minimal PII; avoid asking for unnecessary data.

### Red Flags (Blockers)
- Competing primary CTAs or unclear next step.
- Hidden or hard-to-reach filters; defaults missing.
- Reroll count unclear or not communicated; no feedback after limit.
- Significant layout shift; unreadable text contrast; small tap targets.
- Missing attribution on recipe/share pages.
- English copy leaks into Polish UI.

### Review Workflow
1. Confirm screen’s primary job and CTA.
2. Walk through the flow on mobile width first, then desktop.
3. Inspect empty/error/loading states.
4. Check copy, accessibility, and attribution.
5. Validate analytics events and performance hints.
6. Approve when the design is clear, fast, accessible, and on-brand.

---
Owner: UI/UX Review Guidelines for 10x MealFlip. Keep focused and practical; update alongside product changes.


