import { GoogleAuth } from "google-auth-library";

/**
 * ADC-based auth for Google Sheets API.
 * Locally: run `gcloud auth application-default login` once.
 * No service account JSON key required.
 */
export const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
