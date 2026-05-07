export type AustralianState =
  | "NSW"
  | "VIC"
  | "QLD"
  | "ACT"
  | "SA"
  | "WA"
  | "TAS"
  | "NT";

export type ServiceRegion = {
  id: string;
  label: string;
  state: AustralianState;
  metro?: string;
  regionType:
    | "capital_metro_cluster"
    | "regional_city"
    | "regional_area"
    | "cross_border_region"
    | "statewide_remote";
  aliases: string[];
  exampleAreas: string[];
  lgas?: string[];
  absReference?: {
    likelySa4?: string[];
    likelySa3?: string[];
    gccsa?: string;
    notes?: string;
  };
  defaultCompetitorSearchArea: string;
  regionFitNote: string;
  intakeStatus: "open" | "reviewing" | "limited" | "not_active";
};
