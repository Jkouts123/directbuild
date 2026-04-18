# DirectBuild Current Architecture

## Current stack
- Next.js frontend
- n8n webhooks
- Google Sheets as source of truth
- One Google spreadsheet with multiple tabs
- Each vertical has its own tab
- /joinus writes to a Tradies tab
- Ads are live, so existing lead capture must not break

## Current goal
Add programmatic Google Sheets control from this repo and improve tracking without migrating to Supabase.

## Must add
- lead_id for all leads
- tradie_id for all tradies
- email required on homeowner form
- budget_confirmed field
- ownership_status field
- vertical field in payload
- source_page field in payload
- Assignments tab for lead-to-tradie tracking

## Do not do
- do not migrate to Supabase
- do not rebuild backend
- do not break n8n webhook flows
- do not remove existing Google Sheets usage