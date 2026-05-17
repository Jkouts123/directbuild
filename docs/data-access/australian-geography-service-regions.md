# Australian Geography And DirectBuild Service Regions

DirectBuild service regions are commercial service-market groupings. They are designed for partner intake, campaign planning, response coverage, and booked-job tracking. They are not legal boundaries and they are not official statistical geographies.

## Official Geography Source

The official long-term geography source should be the Australian Bureau of Statistics Australian Statistical Geography Standard (ABS ASGS).

Future imports should map DirectBuild service-region ids to official ASGS geography such as:

- SAL suburb/locality areas
- LGA local government areas
- SA3 and SA4 planning areas
- GCCSA capital city areas where relevant

## Why DirectBuild Uses Commercial Regions

Major metro markets are intentionally split into smaller service regions because trades usually compete and respond locally. A broad input like “Sydney” is too vague for partner review, competitor scanning, response planning, and ad-wallet testing.

Regional areas are broader because service markets often cover larger driving radiuses and fewer dense suburb clusters. For those regions, campaign radius, travel time, response capacity, and quote follow-up should be reviewed before activation.

## Source-Data Honesty

The current registry should not be treated as official ABS, property-sales, planning, or demand data. It is an intake and campaign-planning layer. A region being listed as open does not confirm homeowner demand, lead volume, revenue, or profit.

## Future Improvements

- Import ABS ASGS SAL/LGA/SA3/SA4 data and map each DirectBuild service region to official codes.
- Map cached NSW Valuer General property-sales rows to selected NSW service regions.
- Map ABS Census residential-fit data to selected service regions when the official geography bridge is available.
- Map NSW Planning activity to region ids once a reliable official data path is available.
- Keep unavailable or incomplete source layers out of the user-facing report until they return real usable data.
