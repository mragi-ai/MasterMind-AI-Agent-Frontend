import { PublicClientApplication, AccountInfo, AuthenticationResult } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./msalConfig";

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
export async function initializeMsal() {
  await msalInstance.initialize();
}

// Get active account
export function getActiveAccount(): AccountInfo | null {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

// Login with popup
export async function loginWithMicrosoft(): Promise<AuthenticationResult | null> {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return response;
  } catch (error) {
    console.error("Microsoft login error:", error);
    throw error;
  }
}

// Login with redirect
export async function loginWithMicrosoftRedirect(): Promise<void> {
  try {
    await msalInstance.loginRedirect(loginRequest);
  } catch (error) {
    console.error("Microsoft login redirect error:", error);
    throw error;
  }
}

// Logout
export async function logoutMicrosoft(): Promise<void> {
  const account = getActiveAccount();
  if (account) {
    await msalInstance.logoutPopup({ account });
  }
}

// Get access token silently
export async function getAccessTokenSilently(): Promise<string | null> {
  const account = getActiveAccount();
  if (!account) {
    return null;
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });
    return response.accessToken;
  } catch (error) {
    console.error("Error acquiring token silently:", error);
    return null;
  }
}

