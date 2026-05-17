# NSW Property Sales Cache

DirectBuild uses official NSW Valuer General Property Sales Information (PSI)
files as a local suburb-level property-turnover signal.

This cache is not integrated into `/api/joinus/generate-report` yet. It is only
available through the debug route.

## Official Source

Official bulk Property Sales Information is published by the NSW Valuer General:

https://www.valuergeneral.nsw.gov.au/design/bulk_psi_content/bulk_psi

The bulk PSI source provides weekly ZIP downloads containing `.DAT` files. The
cache builder parses those official files locally and stores compact
suburb-level summaries only.

## Download Weekly ZIPs Manually

Create a local raw-data folder:

```bash
mkdir -p data/nsw-psi
```

Download one or more weekly ZIPs from the official Valuer General bulk PSI page
and save them under `data/nsw-psi`.

Example:

```bash
curl -L "https://www.valuergeneral.nsw.gov.au/__psi/weekly/YYYYMMDD.zip" \
  -o data/nsw-psi/YYYYMMDD.zip
```

Extract each ZIP into its own folder:

```bash
mkdir -p data/nsw-psi/YYYYMMDD
unzip -o data/nsw-psi/YYYYMMDD.zip -d data/nsw-psi/YYYYMMDD
```

## Build The Cache

Run the cache builder against the parent folder that contains extracted official
`.DAT` files:

```bash
npx ts-node --project scripts/tsconfig.json \
  scripts/build-nsw-property-sales-cache.ts data/nsw-psi
```

The builder recursively finds `.DAT` files and writes:

```text
data-cache/nsw-property-sales-summary.json
```

The cache contains suburb-level sales count, median sale price, date ranges, and
property-turnover signal. It does not contain full sale addresses.

## Test The Debug Route

Start the app locally, then request a suburb:

```bash
curl -s "http://localhost:3001/api/debug/nsw-property-sales?serviceArea=Penrith" \
  | python3 -m json.tool
```

If the cache exists and includes `PENRITH`, the route returns `status:
"success"` with the cached suburb summary.

If the cache is missing, the route returns `status: "unavailable"`. If the
suburb is not in the cache, it returns `status: "no_results"`. Neither case
should be treated as low property turnover.

## Git Safety

Do not commit raw NSW PSI ZIP or `.DAT` files.

Do not commit generated cache JSON. `data-cache/nsw-property-sales-summary.json`
is local generated data and is ignored by git. Keep only
`data-cache/.gitkeep`.

## Interpretation

Property turnover is a renovation-trigger proxy. Recent property sales can
suggest households making moving, improvement, or upgrade decisions, but this is
not guaranteed renovation demand, lead volume, revenue, or booked work.
