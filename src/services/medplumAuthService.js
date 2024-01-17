import { MedplumClient } from '@medplum/core';

// Initialize the MedplumClient
console.log('creating medplum client');
const medplum = new MedplumClient();
console.log('setting Basic Auth for medplum client');

// Function to get the active login
export function getActiveLogin() {
  return medplum.getActiveLogin();
}

// Function to get the access token
export async function getAccessToken() {
  try {
    // Ensure the client is logged in before retrieving the access token
    if (!medplum.getActiveLogin()) {
      await medplum.startClientLogin("1940c3ef-8b6f-4ac0-a66c-d6aca3bff786", "0151de6a95f61082b358ca61618dcc422b47d46701a499811927d86710c560b7"); 
    }

    const activeLogin = await medplum.getActiveLogin();
    console.log('our current active login is ', activeLogin);

    return activeLogin.accessToken;
  } catch (e) {
    console.log('Error inside getAccessToken', e);
    return undefined;
  }
}

// Function to refresh the access token
export function refreshAccessToken() {
  // Implement logic to refresh access token if needed
  const accessToken = medplum.refreshAccessToken();
  return accessToken;
}
