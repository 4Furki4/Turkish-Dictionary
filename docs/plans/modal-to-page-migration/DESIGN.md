---
name: Turkish Dictionary task pages
description: Existing Turkish Dictionary visual system applied to routed contribution and dashboard tasks.
status: draft
updated: 2026-10-16
source-baseline: 22d5661
sources:
  - PLAN.md
  - .memlog.md
colors: {} # No overrides; inherit the existing light/dark theme tokens.
typography:
  title:
    note: Existing application page-heading typography; no font or scale change.
  body:
    note: Existing application body and form-label typography.
rounded: {} # Inherit existing HeroUI wrappers and Tailwind utilities.
spacing: {} # Inherit existing page gutters and form spacing.
components:
  task-header:
    title: '{typography.title}'
  task-body:
    surface: bg-background/40
    text: '{typography.body}'
  supporting-editor:
    surface: bg-background/40
  action-area:
    primary: Existing HeroUI primary action variant
  status-region:
    text: '{typography.body}'
  draft-decision:
    surface: bg-background/40
---

## Brand & Style

Inherit the current Turkish Dictionary identity, HeroUI wrappers, Tailwind system, theme behavior, and lucide-react icon style. This migration changes task presentation and navigation. It introduces no brand direction. [PLAN.md](./PLAN.md) owns the route inventory, page anatomy, and delivery order; [EXPERIENCE.md](./EXPERIENCE.md) owns behavior.

## Colors

Keep the established red `primary`, neutral `background`, and existing foreground, border, focus, validation, and status tokens in both themes. Main task and section surfaces use `bg-background/40`, preserving the shared red background gradient. Add no page-local gradient or new palette. Verify text and controls against their actual translucent backgrounds at WCAG AA contrast targets.

## Typography

Use {typography.title} for one descriptive task heading and {typography.body} for fields, instructions, and outcomes. Keep the current font family and type hierarchy. Long Turkish/English labels and entity names may wrap; preserve the full task meaning at 200% text.

## Layout & Spacing

Follow the anatomy in [PLAN.md, Page anatomy](./PLAN.md#page-anatomy): labelled return arrow, semantic breadcrumbs, heading, optional context, task body, actions. Reuse surrounding page widths and spacing; stack fields and actions on narrow screens. Use document scrolling and a content-driven height. These drafts use that anatomy as their layout specification; future implementation requires rendered desktop/mobile QA.

## Elevation & Depth

Inherit existing page/form depth. Routed tasks do not add a backdrop layer or elevated modal frame.

## Shapes

Inherit wrapper radii and field shapes. Match visible Input `inputWrapper`, Select `trigger`, and adjacent Button heights, labels, padding, and baselines.

## Components

| Component | Visual contract |
| --- | --- |
| Task header | Labelled left arrow and breadcrumbs above {components.task-header.title}; use existing links and lucide-react icon sizing. |
| Task body | {components.task-body.surface}, existing field wrappers, visible labels, inherited typography and spacing. |
| Supporting editor | Inline section within the task body; visually subordinate, with the same field vocabulary. |
| Action area | One clear existing primary action plus a secondary Cancel; stack without clipped labels on mobile. |
| Status region | Existing loading/error/success styling; text communicates state independently of color. |
| Draft decision | Inline explanation with Keep editing / Discard changes actions using existing button variants. |

## Do's and Don'ts

Preserve SSR visibility, existing route transitions, theme, and reduced-motion behavior. Keep keyboard focus visible. Do not transfer modal max-heights, nested scrolling, body locks, focus traps, or animation choreography into task pages. No visual mockups are attached to this draft; when later created, these spines govern conflicts.
