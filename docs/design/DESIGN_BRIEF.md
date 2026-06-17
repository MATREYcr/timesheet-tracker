# Design Brief — Mini Timesheets

Handoff for **Claude Design**. Goal: redesign the visual layer of a small,
already-functional web app. Keep it **clean, professional, data-dense but
breathable** — this is a payroll/admin tool, not a marketing site.

---

## 1. Product in one paragraph

Mini Timesheets is an internal tool for managing **hourly employees**. It does
three things: keep a roster of employees (name + hourly rate), log time worked
per employee (date + hours), and show a **weekly summary** (regular vs overtime
hours and pay) where a reviewer **approves or rejects** each employee's week.
Approved weeks become locked (read-only).

Audience: an HR/payroll reviewer at a desk. Prioritize **legibility, scannable
tables, and clear status** over decoration.

---

## 2. Hard constraints (please design within these)

- **Maps to component primitives** (the build uses shadcn/ui + Tailwind). Favor:
  tables, cards, dialogs/modals, selects, badges, switches, buttons, inline
  alerts, empty states, skeletons. Avoid bespoke widgets that can't be built
  from those.
- **Bilingual (English + Spanish).** Labels vary in length — don't rely on text
  fitting a fixed width. A language switch (EN / ES) lives in the header.
- **Light + dark mode** (semantic tokens, not hardcoded colors).
- **Currency**: USD, formatted per locale (en `$1,085.63`, es `$1.085,63`).
- **No auth, no settings, no nav beyond the 3 screens.** Keep scope tight.

Deliver a **design system / tokens** (color, typography, radius, spacing scale)
plus the **3 screens** below. If you already have the *Monedín Design System*,
either apply it or fork a variant tuned for a dense admin tool.

---

## 3. Global shell (shared by every screen)

- **Top header** (sticky): app title/logo on the left, primary nav in the middle
  (**Employees · Time entries · Weekly summary**) with an active state, and a
  **EN / ES** language toggle on the right.
- **Content**: centered container, comfortable max width (~1024px), generous
  vertical rhythm.
- Each screen has a **page heading + one-line subtitle**, then a toolbar, then
  the main content (usually a table).

---

## 4. Screens

### Screen 1 — Employees

**Toolbar:** heading "Employees" + subtitle; on the right a **"Show inactive"**
switch and a primary **"Add employee"** button.

**Table** — columns:
| Name | Hourly rate | Status | Actions |
|------|-------------|--------|---------|
| Jane Doe | $22.50 | `Active` (badge) | Edit · Deactivate |
| John Smith | $18.00 | `Active` | Edit · Deactivate |
| Ana Ruiz | $20.00 | `Inactive` (muted badge) | Edit · Reactivate |

- Rate is right-aligned, monospaced/tabular figures.
- **Status badge**: Active = solid/primary, Inactive = muted/secondary.
- Inactive rows only show when the switch is on.

**Add/Edit dialog** (modal): fields **First name**, **Last name**, **Hourly
rate** (number). Validation errors render inline under each field (red). Footer:
Cancel + Create/Save.

**States:** loading = skeleton rows; empty = friendly "No employees yet" with an
Add button; error = inline alert with a Retry button.

---

### Screen 2 — Time entries

**Toolbar:** an **employee selector** (dropdown, can include inactive ones), a
**week picker** ( ◀  *Jun 16 – 22, 2026*  ▶ , Monday–Sunday), and a primary
**"Log time"** button.

**Table** — the selected employee's entries for that week:
| Date | Hours | Actions |
|------|-------|---------|
| Mon, Jun 16 | 8.00 | Edit · Delete |
| Tue, Jun 17 | 7.50 | Edit · Delete |

**Contextual banners** (inline alert, above the table):
- **Week approved → locked**: a lock banner; rows become read-only (actions
  disabled), "Log time" hidden/disabled.
- **Inactive employee**: a notice that past entries are viewable but you can't log
  new time.

**Log/Edit dialog:** **Date** (constrained to the selected week) + **Hours**
(0.25 step). Inline validation. **Delete** asks for confirmation (destructive
modal — "This can't be undone").

**States:** no employee selected = prompt to pick one; loading/empty/error as
above.

---

### Screen 3 — Weekly summary (the core, most important screen)

**Toolbar:** heading + the same **week picker**.

**Table** — one row per employee with hours that week. This screen shows the
**pay breakdown** (computed client-side):

| Employee | Regular h | Overtime h | Total h | Pay | Status | Actions |
|----------|-----------|------------|---------|-----|--------|---------|
| Jane Doe | 40 | **5.5** | 45.5 | **$1,085.63**  ·  $900.00 + $185.63 | `Pending` | Approve · Reject |
| John Smith | 32 | 0 | 32 | **$576.00**  ·  $576.00 + $0.00 | `Approved` | Reopen |

- **Overtime** (hours beyond 40/week, paid 1.5×) should be **visually
  highlighted** when > 0 (e.g. an accent/amber tone) — it's the key insight.
- **Pay cell**: big total + a small muted breakdown `regular + overtime`.
- **Approval status badge**: Pending = neutral, Approved = success/primary,
  Rejected = destructive.
- **Actions** depend on status: Pending/Rejected → Approve + Reject; Approved →
  shows locked look + a "Reopen" action.
- Numbers right-aligned, tabular figures, easy to scan down a column.

**States:** loading skeleton; empty = "No hours this week"; error = alert + retry.
Approve/Reject feel instant (optimistic).

---

## 5. Domain-driven visual rules (please honor these)

- **Two kinds of status badges**, keep them distinct:
  - Employee: `Active` / `Inactive`.
  - Approval (weekly): `Pending` / `Approved` / `Rejected`.
- **Overtime** is the headline number — make it pop when present.
- **Locked (approved) weeks** must *look* read-only (dimmed actions, lock icon).
- **Money + hours** use tabular figures and right alignment for column scanning.
- Success/error feedback appears as **toasts** (top or bottom corner).

---

## 6. Component inventory to style

Header/nav, page heading, primary/secondary/ghost buttons, **data table** (header
+ rows + row actions), **badges** (5 variants above), **dropdown select**,
**switch**, **modal dialog** + **confirm dialog**, **form field** (label + input +
inline error), **inline alert** (info + destructive, with action), **empty
state**, **skeleton loader**, **toast**, and a small **week picker**
( ◀ label ▶ ).

---

## 7. What to send back to the developer

So the design can be implemented faithfully:
1. **Screenshots** of each screen (light + dark if possible), incl. one state
   variant (e.g. a locked week, an error/empty).
2. **Tokens**: color palette (hex, incl. semantic roles — primary, muted,
   destructive, success/accent, borders, background/foreground), **type scale**
   (font family + sizes/weights), **radius**, **spacing scale**.
3. If exportable: **code or Figma** of the components.

---

## 8. Out of scope (don't design these)

Login/auth, user settings, notifications center, employee detail pages, time-entry
descriptions/projects, reports/charts, multi-week views. Just the 3 screens above.

---

## 9. Reference data (use these realistic values in mockups)

- Employees: **Jane Doe** $22.50/h (active), **John Smith** $18.00/h (active),
  **Ana Ruiz** $20.00/h (inactive).
- Week of **Jun 16–22, 2026**.
- Jane's week: 45.5h → **40 regular + 5.5 overtime**, pay **$1,085.63**.
- John's week: 32h, **Approved** (locked).
