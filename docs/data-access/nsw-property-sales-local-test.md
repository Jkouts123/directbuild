# NSW Property Sales Local Parser Test

This is a local proof step for the DirectBuild Area Opportunity Report property-turnover signal. It uses official NSW Valuer General bulk Property Sales Information (PSI) files, but it does not yet build scheduled ingestion or a cached production dataset.

## Official Source

Official bulk PSI files are published by the NSW Valuer General:

https://www.valuergeneral.nsw.gov.au/design/bulk_psi_content/bulk_psi

The source provides free bulk NSW PSI from 1990 onwards. Current PSI files are generated weekly for each Local Government Area and delivered as `.DAT` files inside weekly ZIP downloads. The Valuer General notes that completeness and accuracy are not guaranteed, so DirectBuild should treat this as an area signal, not a guarantee of demand.

## Download Weekly ZIPs

Create a local data folder:

```bash
mkdir -p data/nsw-psi
```

Download one or more weekly ZIPs from the official page. Example:

```bash
curl -L "https://www.valuergeneral.nsw.gov.au/__psi/weekly/20260504.zip" \
  -o data/nsw-psi/20260504.zip
```

Repeat with other weekly ZIP URLs when you want a wider sample window.

## Extract Weekly Folders

Extract each ZIP into its own dated folder:

```bash
mkdir -p data/nsw-psi/20260504
unzip -o data/nsw-psi/20260504.zip -d data/nsw-psi/20260504
```

For multiple weeks, keep the same pattern:

```text
data/nsw-psi/
  20260420/
  20260427/
  20260504/
```

## Run The Parser Test

The script accepts a single `.DAT` file, a folder of `.DAT` files, or a parent folder containing multiple extracted weekly folders. It recursively finds `.DAT` files under the input path.

```bash
npx ts-node --project scripts/tsconfig.json \
  scripts/test-nsw-property-sales.ts data/nsw-psi PENRITH
```

The output includes processed file count, total parsed rows, matched suburb rows, recent sales count, median sale price, turnover signal, earliest/latest sale dates, and the first five matched examples.

## Git Safety

Downloaded ZIP and `.DAT` files are local test data and must not be committed. The repo ignores `data/*` while keeping `data/.gitkeep` so the folder exists.

## Next Step

After the parser is validated across several weeks, the production path should add scheduled download, extraction, validation, and cache storage before any property-sales signal is integrated into the user-facing report.
