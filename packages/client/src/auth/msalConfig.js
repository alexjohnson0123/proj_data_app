import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: 'e6f3728f-b2bc-485b-8868-c2c474f90f1a',
        authority: 'https://login.microsoftonline.com/66f7a9d9-3c1f-4904-abf1-14bfbce436e4',
        redirectUri: 'http://localhost:5173'
    }
}

export const msalInstance = new PublicClientApplication(msalConfig);
export const apiScopes = ['api://01bb431e-2dd3-416e-9a45-3abbc1e4ec51/user_access'];