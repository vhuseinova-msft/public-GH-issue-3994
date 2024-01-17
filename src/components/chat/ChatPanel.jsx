import React, { useEffect, useContext, useReducer } from 'react';
import axios from 'axios';
import { Skeleton, Space } from 'antd';
import { useErrorBoundary } from 'react-error-boundary';
import {
  FluentThemeProvider,
  ChatClientProvider,
  ChatThreadClientProvider,
  DEFAULT_COMPONENT_ICONS,
} from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  getAgentResponse,
  formatChatMessage,
  constructAzureOpenAiRequest,
} from '../../services/agentApi';
import {
  prepareChatUser,
  prepareChatAgent,
  getMessageHistory,
  sendAgentMessageToThread,
  widgetProcessor,
} from '../../utils/chatUtils';
import useAgent from '../../hooks/useAgent';
import { handleWidgetSubmit } from './widgets';
import ChatToolbar from './ChatToolbar';
import ChatComponent from './ChatComponent';
import LastRequest from './LastRequest';
import AgentProfileView from './AgentProfileView';
import ChatTranscript from './ChatTranscript';
import ChatIds from './ChatIds';
import kbMaster from '../../config/kb-master.json';
import { GlobalContext } from '../GlobalContext';
import { initialState, chatReducer } from '../../reducers/chatReducer';

//Registration of icons for Fluent UI
initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

/**
 * A component responsible for handling the chat panel and interactions with the azure communication service for chat.
 * @param {Object} relicPatientData - Various details about the patient including patient summary and id.
 * @param {Object} currentChatUser - ACS tokens & identities for the patient engaging in the chat and AI Agents.
 * @param {Function} loadAgentOrFacility - A callback function to handle facility change.
 * @returns {JSX.Element} The ChatPanel component.
 */
const ChatPanel = ({
  relicPatientData,
  currentChatUser,
  loadAgentOrFacility,
  patient,
}) => {
  // State for handling chat messages, chat clients, and UI elements.
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { showBoundary } = useErrorBoundary();
  const { agentProfile } = useContext(GlobalContext);
  const { getNewAgent } = useAgent();
  /**
   * Side Effect - Mount & Unmount methods for ChatPanel.
   * During mount, we initialize the chat client + chat panel and then turn on event handler for new chat messages.
   * During unmount, we use the chat client to turn off event handlers.
   * Chat Client is the Azure Communication Service Chat Client created on behalf of the RC user / patient.
   * @param none;
   * @returns void;
   */
  useEffect(() => {
    let cancelTokenSource = axios.CancelToken.source();
    let chatClient;
    const initializeChatClient = async () => {
      try {
        chatClient = await initializeChatPanel(cancelTokenSource);
        return chatClient;
      } catch (error) {
        showBoundary(error);
      }
    };
    initializeChatClient()
      .then((chatClient) => {
        console.log(
          'initializeChatClient got completed during component mount.'
        );
        chatClient.startRealtimeNotifications();
        chatClient.on('chatMessageReceived', onChatMessageReceived);
        chatClient.on('chatMessageEdited', onChatMessageEdited);
      })
      .catch((error) => {
        showBoundary(error);
      });
    // Component Unmount - Turn off event handlers
    return () => {
      try {
        chatClient = state.chatState.rcUserStatefulChatClient;
        if (chatClient) {
          chatClient.stopRealtimeNotifications();
          chatClient.off('chatMessageReceived', onChatMessageReceived);
        }
        cancelTokenSource.cancel();
      } catch (error) {
        showBoundary(error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Side Effect - Every time the user sends a message on the thread, this side effect is triggered.
   * We get the agent response and add agent's response to the thread simulating chat conversation.
   * @param {string} userMessage.message - User Message through state.
   * @returns void;
   */
  useEffect(() => {
    let cancelTokenSource = axios.CancelToken.source();
    if (state.chatState.userMessage.message && agentProfile) {
      console.log('userMessage useEffect got called', state.chatState);
      getAgentResponseInThread(cancelTokenSource);
    }
    return () => {
      cancelTokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.chatState.userMessage.message]);

  /**
   * Side Effect - Every time the user sends a message with metadata on the thread, this side effect is triggered.
   * User message with metadata = User interacted with a widget. Widget got submitted.
   * @param {string} userMessage.metaData - User Message through state.
   * @returns void;
   */
  useEffect(() => {
    let cancelTokenSource = axios.CancelToken.source();
    if (state.chatState.userMessage.metaData) {
      const userMessageMetaData = JSON.parse(
        state.chatState.userMessage.metaData
      );
      //If there is metadata, then we need to check if it was SuggestionWidget and selectedSuggestion is yes.
      if (
        userMessageMetaData?.widget === 'SuggestionWidget' &&
        userMessageMetaData.selectedSuggestion
      ) {
        console.log('userMessage.metaData useEffect to switch agent');
        //Todo: joiningAgentId can be extracted from userMessageMetaData.
        const joiningAgentId = userMessageMetaData.acsId;
        getNewAgent(joiningAgentId, patient).then((newAgentDetail) => {
          console.log(
            'newAgentDetail were found from the hook',
            newAgentDetail
          );
          const initializeChatClient = async () => {
            let chatClient;
            try {
              chatClient = await initializeChatPanel(
                cancelTokenSource,
                newAgentDetail
              );
              return chatClient;
            } catch (error) {
              showBoundary(error);
            }
          };
          initializeChatClient()
            .then((chatClient) => {
              console.log(
                'initializeChatClient got completed in metadata useEffect'
              );
              chatClient.startRealtimeNotifications();
              chatClient.on('chatMessageReceived', onChatMessageReceived);
            })
            .catch((error) => {
              showBoundary(error);
            });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.chatState.userMessage.metaData]);

  /**
   * Initializes the chat panel by creating the chat client and getting the message history.
   * If there is no message history, then greet the user with a message from the agent.
   * If there is some message history, then simulate the last request from the user.
   *
   * Also add various ACS clients to the state.
   *
   * @param {Object} cancelTokenSource - Cancel token source for axios.
   * @param {Object} preferredAgent - Preferred Agent (if any). Can be null.
   * @returns {Object} RC User ACS chat client for the patient.
   */
  const initializeChatPanel = async (cancelTokenSource, preferredAgent) => {
    try {
      const {
        rcUserChatClient,
        rcUserThreadClient,
        agentInConversation,
        isAgentChanged,
      } = await prepareChatUser(
        state.chatState,
        currentChatUser,
        preferredAgent,
        agentProfile,
        relicPatientData,
        patient
      );

      const startTime = Date.now();
      const {
        messageHistory,
        lastUserMessage,
        lastWidgetData,
        lastFacilityId,
      } = await getMessageHistory(
        currentChatUser,
        rcUserThreadClient,
        preferredAgent ? 5 : 10
      );

      const endTime = Date.now();
      console.log(
        'time taken to get message history: ',
        Math.floor((endTime - startTime) / 1000)
      );
      console.log(
        'about to change agent ' +
          agentInConversation.displayName +
          ' with associated facility id ' +
          lastFacilityId
      );

      const loadedAgent = await loadAgentOrFacility(
        lastFacilityId,
        agentInConversation.id.communicationUserId
      );
      const { agentThreadClient } = await prepareChatAgent(
        state.chatState,
        loadedAgent,
        currentChatUser
      );

      if (messageHistory.length === 0) {
        await greetingFromAgent(
          messageHistory,
          lastUserMessage,
          agentThreadClient,
          cancelTokenSource
        );
      } else {
        await simulateLastRequest(
          messageHistory,
          lastUserMessage,
          cancelTokenSource
        );
      }

      if (isAgentChanged) {
        console.log('different agent profile found');
        await sendAgentMessageToThread(
          loadedAgent,
          agentThreadClient,
          'Hi, I am ' + loadedAgent.agentName + '. How can I assist you today?'
        );
        console.log('Agent has greeted the user.');
      } else {
        console.log('same agent profile found');
      }

      dispatch({
        type: "SET_CHAT_STATE",
        payload: {
          lastWidgetData,
          agentThreadClient,
        },
      });
      

      if (!state.chatState.rcUserStatefulChatClient) {
        dispatch({
          type: "SET_CHAT_STATE",
          payload: { 
            rcUserStatefulChatClient: rcUserChatClient,
            rcUserThreadClient,
          },
        });
      }
      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
      return rcUserChatClient;
    } catch (error) {
      showBoundary(error);
    }
  };

  /**
   * This method generates Greetings from Agent using Patient Summary.
   * The method also adds the greeting message to current chat thread.
   * @param {any} messageHistory. Full message history of current thread. Empty in this case.
   * @param {string} lastUserMessage. Last message sent by user. Empty in this case.
   * @param {any} agentThreadClient. ACS Chat Thread Client for Agent.
   * @returns void
   */
  const greetingFromAgent = async (
    messageHistory,
    lastUserMessage,
    agentThreadClient,
    cancelTokenSource
  ) => {
    try {
      const updatedMessageHistory = [...messageHistory];
      updatedMessageHistory.push(formatChatMessage('user', lastUserMessage));

      const { agentMessage, azureOpenAiRequest } = await getAgentResponse(
        {
          userId: relicPatientData.patient?.id,
          summary: relicPatientData?.patientSummary,
          name: relicPatientData.patient?.name
        },
        updatedMessageHistory,
        lastUserMessage,
        agentProfile,
        cancelTokenSource,
        relicPatientData
      );

      await sendAgentMessageToThread(
        agentProfile,
        agentThreadClient,
        agentMessage
      );
        dispatch({
          type: "SET_CHAT_STATE",
          payload: {
            messages: [
              { role: 'assistant', content: agentMessage },
            ],
            lastChatApiRequest: azureOpenAiRequest,
          },
        });
    } catch (error) {
      showBoundary(error);
    }
  };

  /**
   * This method simulates the last Azure Open AI request sent by the user.
   * @param {any} messageHistory. Full message history of current thread.
   * @param {string} lastUserMessage. Last message sent by user.
   * @param {any} cancelTokenSource. Cancel Token Source for Axios.
   * @returns void
   */
  const simulateLastRequest = async (
    messageHistory,
    lastUserMessage,
    cancelTokenSource
  ) => {
    let simulatedUserMessage = '';
    let simulatedMessageHistory = [];

    if (lastUserMessage?.content) {
      simulatedUserMessage = lastUserMessage.content;
      let index = messageHistory
        .reverse()
        .findLastIndex(
          (x) =>
            x.role === lastUserMessage.role &&
            x.content === lastUserMessage.content
        );
      simulatedMessageHistory = messageHistory.slice(0, index + 1);
    } else {
      const userSummary = relicPatientData
        ? relicPatientData.patientSummary
        : '';
      simulatedUserMessage = `Here is my quick introduction - ${userSummary}.\n\nYou need to greet me with warmth and positivity, you can also make a comment on today's weather or something similar to make me feel good about today. It should be a general greeting without any specific question.`;
      simulatedMessageHistory.push(
        formatChatMessage('user', simulatedUserMessage)
      );
    }

    try {
      const [azureOpenAiRequest, azureOpenAiRequestOptions] =
        await constructAzureOpenAiRequest(
          {
            userId: relicPatientData.patient.id,
            summary: relicPatientData?.patientSummary,
            name: relicPatientData.patient?.name,
          },
          simulatedMessageHistory,
          simulatedUserMessage,
          agentProfile,
          cancelTokenSource,
          relicPatientData
        );

        dispatch({
          type: 'SET_CHAT_STATE',
          payload: {
            replaceMessages: true,
            messages: messageHistory,
            lastChatApiRequest: azureOpenAiRequest,
            lastChatApiRequestOptions: azureOpenAiRequestOptions,
          },
        });

     
    } catch (error) {
      showBoundary(error);
    }
  };

  /**
   * Handles the event when a chat message is received on the currently rendered thread.
   * It simply adds the chat message to the state which triggers a side effect.
   *
   * @param {object} event - The event object containing the message and sender details.
   * @param {object} event.sender - The sender object representing the user who sent the message.
   * @param {string} event.sender.communicationUserId - The unique ID of the user who sent the message.
   * @param {object} acsUser.userIdentityResponse - The user identity response object containing the communicationUserId.
   */
  const onChatMessageReceived = (event) => {
    // Check if the sender's communicationUserId matches the current user's communicationUserId.
    // And the sender has sent a different message than the current user's message. This is to avoid multiple submissions causing two requests.
    
    // There is a problem here where if the user repeats a message.
    // Then the second message would not be responded to.
    // Since the message is the same as the previous one.
    // We need a smarter way to trigger the side effect.
    if (
      event.sender.communicationUserId ===
        currentChatUser.userIdentityResponse.communicationUserId &&
      event.message !== state.chatState.userMessage.message
    ) {
      // Update the chat state with the received message so side effect gets triggered.
      dispatch({
        type: 'SET_CHAT_STATE',
        payload: {
          userMessage: {
            ...state.chatState.userMessage,
            message: event.message,
            messageId: event.id,
            metaData:
              event.metadata && Object.keys(event.metadata).length === 0
                ? ''
                : event.metadata.widgetData,
          },
        },
      });
    }
  };

  /**
   * Handles the event when a chat message is edited on the currently rendered thread.
   * It simply adds the summary to the state.
   *
   * @param {object} event - The event object containing the message and sender details.
  */
  const onChatMessageEdited = (event) => {
    if(event.metadata?.last_sequence_id) {
      dispatch({
        type: "SET_CHAT_STATE",
        payload: {
          replaceMessages: true,
          messages: [
            { role: 'user', content: event.message },
          ],
        },
      });
    }
  }
  /**
   * Sends the user message to the agent, gets a response from the Agent API, and adds the response to the chat history.
   * Also, adds the response as an agent message to the current chat thread.
   * @param {any} CancelTokenSource. Token Source for Axios.
   * @returns void
   */
  const getAgentResponseInThread = async (cancelTokenSource) => {
    try {
      console.log(
        'Begin Agent Response - last widget data',
        state.chatState.lastWidgetData
      );

      let userMessageMetaData = null;

      if (state.chatState.lastWidgetData) {
        userMessageMetaData = await handleWidgetSubmit(null, state, dispatch);
      }
      if (state.chatState.userMessage.message) {
        userMessageMetaData = userMessageMetaData ? userMessageMetaData :
          state.chatState.userMessage.metaData &&
          JSON.parse(state.chatState.userMessage.metaData);

        if (
          userMessageMetaData?.widget &&
          userMessageMetaData?.widget === 'SuggestionWidget' &&
          userMessageMetaData?.selectedSuggestion
        ) {
          // User clicked on one of the suggestions.
          // Do nothing in this case since userMessage.metaData side effect would handle agent's response to the widget interaction.
        } else {
          console.log(
            'chatState userMessage message',
            state.chatState.userMessage
          );

          //Reverted to updatedMessages since it's needed for conversation continuity.
          const updatedMessages = [
            ...state.chatState.messages,
            { role: 'user', content: state.chatState.userMessage.message },
          ];

          const { agentMessage, azureOpenAiRequest } =
            await getAgentResponse(
              {
                userId: relicPatientData.patient?.id,
                summary: relicPatientData?.patientSummary,
                name: relicPatientData.patient?.name
              },
              updatedMessages,
              state.chatState.userMessage.message,
              agentProfile,
              cancelTokenSource,
              relicPatientData
            );

          agentProfile.mode = '';
          let filteredAgentMessage = agentMessage;

          if (agentMessage?.includes('content management policy')) {
            filteredAgentMessage =
              'Your question was found to be inappropriate by our system and therefore blocked. You are requested to ask a different but appropriate question';
          }

          const { isWidget, widgetMessage, widgetMessageMetadata } =
            await widgetProcessor(
              state.chatState.userMessage,
              agentMessage,
              agentProfile,
              patient,
            );
    
          const sendMessageResult = await sendAgentMessageToThread(
            agentProfile,
            state.chatState.agentThreadClient,
            isWidget ? widgetMessage : filteredAgentMessage,
            isWidget ? widgetMessageMetadata : {}
          );

          let widgetData = null;

          if (
            widgetMessageMetadata &&
            widgetMessageMetadata.widgetData &&
            sendMessageResult &&
            sendMessageResult.id
          ) {
            widgetData = JSON.parse(widgetMessageMetadata.widgetData);
            widgetData.messageId = sendMessageResult.id;
            widgetData = JSON.stringify(widgetData);
          }

          console.log('widgetData', widgetData);

          //Building real time chat history in chat state.
          dispatch({
            type: "SET_CHAT_STATE",
            payload: {
              messages: [
                { role: 'user', content: state.chatState.userMessage.message },
                { role: 'assistant', content: agentMessage },
              ],
              lastChatApiRequest: azureOpenAiRequest,
              lastWidgetData: widgetData,
            },
          });
        }
      }

      console.log(
        'End Agent Response - last widget data',
        state.chatState.lastWidgetData
      );
    } catch (error) {
      showBoundary(error);
    }
  };

  /**
   * Handles the click event on the Chat menu items.
   * @param {Object} event - The click event object.
   */
  const onMenuClick = (event) => {
    // Check if the clicked menu item corresponds to 'selectedFacility'.
    if (event.keyPath[1] === 'selectedFacility') {
      // Check if a different facility than current is selected.
      if (event.key !== agentProfile.facilityId) {
        // Send an announcement to the thread about change in facility/searched knowledge base.
        let selectedKb = kbMaster.find(
          (facility) => facility.kbObject.kbCode === event.key
        );
        let agentMessage =
          'Now searching knowledge base for ' +
          selectedKb.kbObject.kbTopic +
          ' facility.';
        let widgetData = {
          widget: 'AnnouncementWidget',
          facilityId: event.key,
        };
        let agentMessageMetadata = {
          messageType: 'announcement', //for backward compatibility
          widgetData: JSON.stringify(widgetData),
        };
        // Send the change in facility message announcement to thread
        sendAgentMessageToThread(
          agentProfile,
          state.chatState.agentThreadClient,
          agentMessage,
          agentMessageMetadata
        )
          .then(() => {
            loadAgentOrFacility(event.key);
          })
          .catch((error) => {
            showBoundary(error);
          });
      }
    } else {
      // If the clicked menu item is not 'selectedFacility', select appropriate menu.
      dispatch({ type: "SET_SELECTED_MENU_ITEM", payload: event.key });
    }
  };

  /**
   * Handles Widget Button Click.
   * Depending on the Widget, the click may do different things
   * @param {object} widgetData - Submitted Data from the message Widget
   */
  const onWidgetClick = (widgetData) => {
    console.log('on widget click', widgetData);
    handleWidgetSubmit(widgetData, state, dispatch);
  };

  return (
    <>
      {state.isChatPanelLoading && (
        <>
          <Space style={{ margin: '15px' }}>
            <Skeleton.Input active />
            <Skeleton.Input active />
            <Skeleton.Input active />
            <Skeleton.Input active />
            <Skeleton.Input active />
          </Space>
          <Skeleton avatar active paragraph={{ rows: 3 }} />
          <Skeleton avatar active paragraph={{ rows: 2 }} />
          <Skeleton avatar active paragraph={{ rows: 3 }} />
        </>
      )}
      {!state.isChatPanelLoading &&
        state.chatState.rcUserThreadClient &&
        state.chatState.rcUserStatefulChatClient && (
          <>
            <ChatToolbar
              onMenuClick={onMenuClick}
              currentMenuItem={state.selectedMenuItem}
            />
            {state.selectedMenuItem === 'selectedChatPanel' && (
              <>
                <FluentThemeProvider>
                  <ChatClientProvider
                    chatClient={state.chatState.rcUserStatefulChatClient}
                  >
                    <ChatThreadClientProvider
                      chatThreadClient={state.chatState.rcUserThreadClient}
                    >
                      <ChatComponent onWidgetClick={onWidgetClick} />
                    </ChatThreadClientProvider>
                  </ChatClientProvider>
                </FluentThemeProvider>
              </>
            )}
            {state.selectedMenuItem === 'selectedLastRequest' && (
              <LastRequest
                lastMessageRequest={state.chatState.lastChatApiRequest}
              />
            )}
            {state.selectedMenuItem === 'agentProfileView' && (
              <AgentProfileView />
            )}
            {state.selectedMenuItem === 'chatTranscript' && (
              <ChatTranscript lastMessageRequest={state.chatState.lastChatApiRequest}/>
            )}
            {state.selectedMenuItem === 'selectedChatIds' && (
              <ChatIds file={currentChatUser} />
            )}
          </>
        )}
    </>
  );
};

export default ChatPanel;