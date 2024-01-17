import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { createStatefulChatClient } from '@azure/communication-react';
import { formatChatMessage } from '../services/agentApi';
import axios from 'axios';
import _ from 'lodash';
import { getAccessToken } from '../services/medplumAuthService';

/**
 * Get Last 50 Messages for the current thread.
 * @param {any} acsUser. ACS User Object to identify which messages are from the current user.
 * @param {any} agentThreadClient. This client would be used for reading the thread messages.
 * @returns {any} array of messageHistory in Azure Open AI Message Format.
 * @returns {any} lastUserMessage within the message history.
 */
export const getMessageHistory = async (
  currentChatUser,
  rcUserThreadClient,
  maxPageSize
) => {
  if (
    !currentChatUser?.userIdentityResponse?.communicationUserId
  ) {
    throw new Error(
      'currentChatUser.userIdentityResponse.communicationUserId is mandatory while getting message history.'
    );
  }
  const messageHistory = [];
  let lastUserMessage = '';
  let lastWidgetData = null;
  let lastFacilityId = '';
  let lastSummary = false;

  for await (const message of rcUserThreadClient.listMessages({
    options: { maxPageSize: maxPageSize },
  })) {
    let role;
    const { sender, metadata, content, id } = message;

    if (sender?.communicationUserId && !lastSummary) {
      role =
        sender.communicationUserId ===
        currentChatUser.userIdentityResponse.communicationUserId
          ? 'user'
          : 'assistant';

      if (role === 'user' && !lastUserMessage && !metadata) {
        lastUserMessage = formatChatMessage(role, content.message);
      }
      if (!metadata) messageHistory.push(formatChatMessage(role, content.message));
    }

    if (
      metadata?.messageType === 'announcement' &&
      !lastFacilityId
    ) {
      const facilityData = metadata.widgetData
        ? JSON.parse(metadata.widgetData)
        : null;
      if (facilityData?.facilityId) {
        lastFacilityId = facilityData.facilityId;
      } else if (metadata) {
        lastFacilityId = metadata.facilityId;
      }
    }

    if (
      role === 'assistant' &&
      metadata?.widgetData &&
      !lastWidgetData
    ) {
      lastWidgetData = JSON.stringify({
        ...JSON.parse(metadata.widgetData),
        messageId: id,
      });
    }
    // Check if any message contain the 
    if(metadata?.last_sequence_id && !lastSummary) {
      messageHistory.push(formatChatMessage('user', content.message));
      lastSummary = true;
    }
    if (lastUserMessage && lastFacilityId && lastSummary) {
      break;
    }
  }
  return { messageHistory, lastUserMessage, lastWidgetData, lastFacilityId };
};

/**
 * This method to create a user chat client for the current user using the provided ACS user token.
 * This method also manages the thread participants based on preferred agent and context agent.
 * Preferred agent is the agent that the calling programs prefers as a participant.
 * Context agent is the agent in the Global Context at the time of calling.
 * @param {object} currentChatUser
 * @param {object} preferredAgent - preferred agent to chat with (if any). Can be null.
 * @param {object} contextAgent - agent in global context.
 * @returns {string} rcUserToken. Relic Care user's security token.
 * @returns {object} rcUserChatClient. Relic Care user's stateful chat client.
 * @returns {object} rcUserThreadClient. Relic Care user's current thread client.
 */
export const prepareChatUser = async (
  chatState,
  currentChatUser,
  preferredAgent,
  contextAgent,
  relicPatientData,
  patient,  
) => {
  let rcUserToken = null;
  let rcUserChatClient = null;
  let rcUserThreadClient = null;
  const agentsToBeAdded = [];
  let agentInConversation = null;
  let preferredAgentParticipant = null;
  let isAgentChanged = false;

  const allAgentsDetails = await getAllAgentsDetails(patient);
  const defaultAgent = allAgentsDetails.filter(agent => agent.agentName === "Emily");

  if (preferredAgent) {
    preferredAgentParticipant = {
      id: { communicationUserId: preferredAgent.acsId },
      displayName: preferredAgent.agentName,
    };
  }
  const defaultAgentParticipant = {
    id: {
      communicationUserId: defaultAgent[0].acsId,
    },
    displayName: defaultAgent[0].agentName,
  };
  const contextAgentParticipant = {
    id: { communicationUserId: contextAgent.acsId },
    displayName: contextAgent.agentName,
  };

  if (chatState && chatState.rcUserChatClient) {
    rcUserChatClient = chatState.rcUserChatClient;
  } else {
    rcUserToken = new AzureCommunicationTokenCredential(
      currentChatUser.userTokenResponse.token
    );
    rcUserChatClient = createStatefulChatClient({
      userId: {
        communicationUserId:
          currentChatUser.userIdentityResponse.communicationUserId,
      },
      endpoint: "https://yusuke-test-3.unitedstates.communication.azure.com/",
      credential: rcUserToken,
    });
  }

  if (chatState?.rcUserThreadClient) {
    rcUserThreadClient = chatState.rcUserThreadClient;
  } else {
    // Get the chat thread client for rc user using the provided thread ID.
    rcUserThreadClient = rcUserChatClient.getChatThreadClient(
      currentChatUser.threadId
    );
  }

  // Checking the thread properties
  const chatThread = await rcUserThreadClient.getProperties();

  await initializeChatThread(rcUserThreadClient, chatThread, relicPatientData);
  
  // Go through the thread properties to decide if the agent is already a participant or not.
  // Accordingly add or remove participants from the thread.
  try {
    if(!chatThread.topic?.includes("currentAgentAcsId")) {
      agentsToBeAdded.push(defaultAgentParticipant);
      agentInConversation = defaultAgentParticipant;
    } else {
      const chatThreadTopic = JSON.parse(chatThread.topic);
      if (
        preferredAgentParticipant?.id?.communicationUserId
      ) {
          //There is a preferred agent
          if (
            preferredAgentParticipant.id.communicationUserId ===
            chatThreadTopic.currentAgentAcsId
          ) {
            agentInConversation = contextAgentParticipant;
            isAgentChanged = false;
          } else {
            console.log(
              'User is NOT chatting with preferred agent ' +
                preferredAgentParticipant.displayName +
                '. We will switch agents.'
            );
            //Agent to be removed
            await rcUserThreadClient.removeParticipant({
              communicationUserId: chatThreadTopic.currentAgentAcsId,
            });
            agentsToBeAdded.push(preferredAgentParticipant);
            agentInConversation = preferredAgentParticipant;
            isAgentChanged = true;
          }
      } else {
        //There is no preferred agent.
        const getAgentDetailsById = allAgentsDetails.filter(agent => agent.acsId === chatThreadTopic.currentAgentAcsId);

        agentInConversation = {
          id: { communicationUserId: getAgentDetailsById[0].acsId },
          displayName: getAgentDetailsById[0].agentName,
        };
        isAgentChanged = false;
      }
    }
    console.log('agentsToBeAdded: ', agentsToBeAdded);
    console.log('agentInConversation: ', agentInConversation);

    if (agentsToBeAdded.length > 0) {
      await rcUserThreadClient.addParticipants({
        participants: agentsToBeAdded,
      });
      await updateChatThreadTopic(rcUserThreadClient, agentInConversation)
    }
  } catch (error) {
    throw new Error(
      'Could not change Chat Participants. Detailed error is: ' + error
    );
  }

  return {
    rcUserToken,
    rcUserChatClient,
    rcUserThreadClient,
    agentInConversation,
    isAgentChanged,
  };
}

async function updateChatThreadTopic(rcUserThreadClient, agentInConversation) {
  // only id of agent in conversation
  const updatedTopic = JSON.stringify({currentAgentAcsId: agentInConversation.id.communicationUserId});

  try {
      await rcUserThreadClient.updateTopic(updatedTopic);
      console.log("Chat thread properties updated successfully.");
  } catch (error) {
      console.error("Error updating chat thread properties:", error);
  }
}

/**
 * Initialize chat thread and save the FHIR resource in the thread properties.
 * @param {any} rcUserThreadClient - Thread client owned by the user / FHIR resource.
 * @param {any} chatThread - Thread Object
 * @returns {any}
 */
async function initializeChatThread(rcUserThreadClient, chatThread, relicPatientData) {
  if (!chatThread?.properties?.threadOwner) {
    const threadOwner = {
      'resourceType': 'Patient', 
      'id': relicPatientData.patient.id 
    };
    const organizationId = relicPatientData.patient.managingOrganization?.reference.replace("Organization/", "")
    await rcUserThreadClient.updateTopic(JSON.stringify({
        ...JSON.parse(chatThread.topic),
        threadOwner,
        organizationId
      }));
  }
}

/**
 * Prepares Chat Agent for current Chat User's thread.
 * Agent Profile is used to initialize the Agent's chat client.
 * @param {object} currentChatUser
 * @param {object} loadedAgent
 * @returns {object} agentThreadClient and other credentials for agent to participate in the chat thread.
 */
export async function prepareChatAgent(
  chatState,
  loadedAgent,
  currentChatUser
) {
  console.log('about to prepareChatAgent. Examining state', chatState);
  
  // Create a chat client for the agent using the provided agent token.
  const agentToken = new AzureCommunicationTokenCredential(
    loadedAgent.acsToken.token
  );
  const agentChatClient = createStatefulChatClient({
    userId: {
      communicationUserId: loadedAgent.acsId,
    },
    displayName: loadedAgent.agentName,
    endpoint: "https://yusuke-test-3.unitedstates.communication.azure.com/",
    credential: agentToken,
  });
  // Get the chat thread client for the agent using the provided thread ID.
  const agentThreadClient = agentChatClient.getChatThreadClient(
    currentChatUser.threadId
  );
  return {
    agentToken,
    agentChatClient,
    agentThreadClient,
  };
}
/**
 * Method for sending the agent's message to the current chat thread.
 * @param {object} agentProfile. Agent persona / profile.
 * @param {object} agentThreadClient. ACS Client for the agent.
 * @param {string} agentMessage. Agent's response to the user message.
 * @param {object} agentMessageMetadata. Agent's message metadata if any.
 * @returns {object} sendMessageResult. Contains id of the sent message.
 */
export const sendAgentMessageToThread = async (
  agentProfile,
  agentThreadClient,
  agentMessage,
  agentMessageMetadata = {}
) => {
  const sendMessageRequest = {
    content: agentMessage,
  };
  const sendMessageOptions = {
    senderDisplayName: agentProfile.agentName,
    type: 'text',
  };
  if (!_.isEmpty(agentMessageMetadata)) {
    sendMessageOptions.metadata = agentMessageMetadata;
  }
  const sendMessageResult = await agentThreadClient.sendMessage(
    sendMessageRequest,
    sendMessageOptions
  );
  return sendMessageResult;
};

/**
 * Method for sending the user's message to the current chat thread.
 * @param {object} rcUserThreadClient. ACS Client for the user.
 * @param {string} userMessage. User's message.
 * @param {object} userMessageMetadata. User's message metadata if any.
 * @returns {object} sendMessageResult. Contains id of the sent message.
 */
export const sendUserMessageToThread = async (
  rcUserThreadClient,
  userMessage,
  userMessageMetadata = {}
) => {
  const sendMessageRequest = {
    content: userMessage,
  };
  const sendMessageOptions = {
    type: 'text',
  };
  if (!_.isEmpty(userMessageMetadata)) {
    sendMessageOptions.metadata = userMessageMetadata;
  }
  const sendMessageResult = await rcUserThreadClient.sendMessage(
    sendMessageRequest,
    sendMessageOptions
  );
  return sendMessageResult;
};

/**
 * Method for retrieving details of a new agent based on the provided agent communication ID.
 * @param {string} agentCommunicationId - The unique identifier for the agent's communication.
 * @returns {object} newAgentDetail - Contains details of the new agent.
 */

export const getNewAgentDetails = async (agentCommunicationId, patient) => {
  try {
    const apiUrl = `https://node-services.calmbay-07fbcdc7.eastus.azurecontainerapps.io/api/chat/agents/chat/${agentCommunicationId}/assistant`;

    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error('Access token not available');
      //return;
    }
    // Define the headers, including the Authorization header
    const headers = {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGZiMDg2OGRiY2RfMGEiLCJ1c2VybmFtZSI6IiIsImlhdCI6MTY5NDE3NzY2MH0.4m-83vKFSyJT0A4FGL3zmEwvabJf3DbpiVY8AMG4L3o',
        'x-organization-id': patient?.managingOrganization?.reference.replace("Organization/", ""),
        'x-access-token': accessToken,
    };

    // Make the GET request to retrieve agent details using Axios
    const response = await axios.get(apiUrl, { headers });

    // Parse the response data to obtain new agent details
    const newAgentDetail = response.data;
    return newAgentDetail;
  } catch (error) {
    console.error(error);
    throw error; 
  }
};

/**
 * Method for retrieving all agent details associated with a specific hospital chat communication.
 * @returns {object} agentDetails. Contains details of all agents.
 */
export const getAllAgentsDetails = async (patient) => {
  try {
    const apiUrl = `https://node-services.calmbay-07fbcdc7.eastus.azurecontainerapps.io/api/chat/agents/chat-communication/abc-hospital`;

    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error('Access token not available');
      //return;
    }

    // Define the headers, including the Authorization header
    const headers = {
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGZhZjM3MDJjYjI4MjlkZjM0MGQxMDEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNjk0MTY3OTQ4fQ.30lDdcJqUCgZJmpSTWkrxfRlVJTv0_dVpa664SOAqGs',
      'x-organization-id': patient?.managingOrganization?.reference.replace("Organization/", ""),
      'x-access-token': accessToken,
    };

    // Make the GET request to retrieve agent details using Axios
    const response = await axios.get(apiUrl, { headers });

    // The response data is already parsed, so you can directly return it
    return response.data;
  } catch (error) {
    console.error(error);
    throw error; 
  }
};


export const widgetProcessor = async (
  userMessage,
  agentMessage,
  agentProfile,
  patient,
) => {
  let isWidget = false;
  const widgetMessage = agentMessage;
  let widgetMessageMetadata = {};
  let agentName = '';
  let agentAcsId = '';
  const allAgentDetails = await getAllAgentsDetails(patient);
  const widgetKeywords = allAgentDetails.filter(agent => agent.type === "Patient Agent");

  // Check if current agent exist in agentMessage, than no need to show widget
  if(agentMessage?.includes(agentProfile.agentName)) {
    return { isWidget, widgetMessage, widgetMessageMetadata };
  }
  //This function needs to provide a widget with appropriate response.
  //The two variables below are to be used to generate the widget. The agentName can be found by finding
  //the agentKeyword[n].agentName in the message. Matching keyword will give the matching element
  //Construct below three variables and return values.

  for (let i = 0; i < widgetKeywords.length; i++) {
    if (agentMessage?.includes(widgetKeywords[i].agentName)) {
      console.log('Keyword:', widgetKeywords[i].agentName);
      agentName = widgetKeywords[i].agentName;
      agentAcsId = widgetKeywords[i].acsId;
      isWidget = true;
      let widgetData = {
        widget: 'SuggestionWidget',
        agentName: agentName,
        acsId: agentAcsId,
        suggestions: [
          { 
            label: 'Yes, please.', 
            value: true, 
            altText: ['Yes', 'Okay', 'Sure', 'Yup']
          },
          { 
            label: 'No, thanks.', 
            value: false,
            altText: ['Nope', 'I am good']
          },
        ],
      };
    
      widgetMessageMetadata = {
        widgetData: JSON.stringify(widgetData),
      };
      break;
    }
  }

  return { isWidget, widgetMessage, widgetMessageMetadata };
};
