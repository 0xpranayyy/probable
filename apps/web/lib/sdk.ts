import { ProbableClient } from "@probable/sdk";
import { API_BASE_URL } from "./config";

export const sdk = new ProbableClient({ baseUrl: API_BASE_URL });

export function getAuthedSdk(passedToken?: string) {
  if (passedToken) {
    return new ProbableClient({ token: passedToken, baseUrl: API_BASE_URL });
  }
  if (typeof window === "undefined") {
    return sdk;
  }
  const cached = localStorage.getItem("probable_session");
  const token = cached ? JSON.parse(cached).token : "";
  return new ProbableClient({ token, baseUrl: API_BASE_URL });
}
