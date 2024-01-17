import { useState } from 'react';
import axios from 'axios';
import { getAccessToken } from '../services/medplumAuthService';

function useAgent() {
  const [newAgentDetail, setNewAgentDetail] = useState(null);
  const [newAgentLoading, setNewAgentLoading] = useState(false);
  const [newAgentError, setNewAgentError] = useState(null);

  async function getNewAgent(agentCommunicationId, patient) {
    try {
      setNewAgentLoading(true);
      setNewAgentError(null);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        //setNewAgentError('Access token not available for getting agent details');
        console.error('Access token not available');
        //return;
      }

      const apiUrl = `https://node-services.calmbay-07fbcdc7.eastus.azurecontainerapps.io/api/chat/agents/chat-communication.communication.azure.com/${agentCommunicationId}/assistant`;

      // Define the headers, including the Authorization header
      const headers = {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGZiMDg2OGRiY2RmMTA2YjFhZDA1NTAiLCJ1c2VybmFtZSI6IiIsImlhdCI6MTY5NDE3NzY2MH0.4m-83vKFSyJT0A4FGL3zmEwvabJf3DbpiVY8AMG4L3o',
          'x-organization-id': patient?.managingOrganization?.reference.replace("Organization/", ""),
          'x-access-token': accessToken,
        };

      // Make the GET request to retrieve agent details using Axios
      const response = await axios.get(apiUrl, { headers });

      // Parse the response to obtain new agent details
      const agentDetail = response.data;
      setNewAgentDetail(agentDetail);

      return agentDetail;
    } catch (error) {
      setNewAgentError(error);
    } finally {
      setNewAgentLoading(false);
    }
  }

  return { newAgentDetail, newAgentLoading, newAgentError, getNewAgent };
}

export default useAgent;
