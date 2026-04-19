/**
 * config.ts — n8n API credentials
 *
 * Reads N8N_BASE_URL and N8N_API_KEY from .env.local.
 * Never hardcode secrets here.
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const baseUrl = process.env.N8N_BASE_URL;
const apiKey = process.env.N8N_API_KEY;

if (!baseUrl) throw new Error("N8N_BASE_URL is not set in .env.local");
if (!apiKey) throw new Error("N8N_API_KEY is not set in .env.local");

// n8n REST API v1 base path
export const N8N_API = `${baseUrl.replace(/\/$/, "")}/api/v1`;

export const AUTH_HEADERS = {
  "X-N8N-API-KEY": apiKey,
  "Content-Type": "application/json",
};
