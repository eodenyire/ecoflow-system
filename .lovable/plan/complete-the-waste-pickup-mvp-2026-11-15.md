# Complete the waste pickup MVP

## Goal
Make the existing TakaFlow core loop reliable for citizens, collectors, and administrators.

## Work
- Secure pickup claiming, admin assignment, cancellation, and collector status changes with atomic, role-checked database operations.
- Finish the dashboard workflow for request tracking, collector proof/weight at completion, reward visibility, and admin oversight.
- Fix signup navigation so accounts awaiting email confirmation are not treated as signed in.
- Verify the public pages and, when an available test session permits, the authenticated pickup workflow.

## Payment scope
Keep payment as a clearly labeled simulation; live M-Pesa requires Safaricom credentials and callback configuration that are not available here.

## Technical details
Use additive database functions and least-privilege RLS, reuse existing Lovable Cloud tables, and keep existing TanStack Start conventions. No new external integrations or marketplace/routing features in this pass.