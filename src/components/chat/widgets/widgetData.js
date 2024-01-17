import Fuse from 'fuse.js';
import { sendUserMessageToThread } from '../../../utils/chatUtils';

/**
 * Todo: Need to implement WidgetData Constructor so we can use it across all Widgets.
 * @param {any} messageId
 * @param {any} agentName
 * @param {any} suggestions
 * @returns {any}
 */
export const widgetData = (messageId, agentName, suggestions) => {
  return {
    messageId,
    agentName,
    suggestions,
    selectedSuggestion: null,
    selectedResponse: null,
  };
};

/**
 * Widget Submit Handler - This is a generic Widget Submission Handler.
 * Should work with all kind of widgets. Currently limited to Suggestions Widget.
 * @param {any} widgetData
 * @param {any} state
 *  @param {any} dispatch
 * @returns {any}
 */
export const handleWidgetSubmit = async (
  widgetData = null,
  state,
  dispatch
) => {
  const lastWidgetData = JSON.parse(state.chatState.lastWidgetData);

  //Send a new userMessage to the thread with the selectedResponse.
  //Else update the typed userMessage with the guessed selectedResponse.
  if (widgetData?.selectedResponse != null) {
    //User clicked on a suggestion. Send the selectedResponse as a userMessage to the thread.
    const userMessageMetadata = {
      widgetData: JSON.stringify(widgetData),
    };
    const sendMessageResult = await sendUserMessageToThread(
      state.chatState.rcUserThreadClient,
      widgetData.selectedResponse,
      userMessageMetadata
    );
    // Update userMessage state with message metadata
    dispatch({
      type: 'SET_CHAT_STATE',
      payload: {
        userMessage: {
          messageId: sendMessageResult.id,
          message: widgetData.selectedResponse,
          metaData: JSON.stringify(widgetData),
        },
        lastWidgetData: null,
      },
    });
  } else if (
    lastWidgetData.selectedResponse == null &&
    state.chatState.userMessage.message
  ) {
    //last Widget was not submitted & may be user Typed something.
    widgetData = lastWidgetData;

    try {
      const fuse = new Fuse(widgetData.suggestions, {
        keys: ['label', 'value', 'altText'],
      });
      const options = {
        threshold: 0.3,
        includeScore: true,
      };
      //evaluate selectedResponse from userMessage.
      const selectedSuggestion = fuse.search(state.chatState.userMessage.message, options);
      console.log('selectedSuggestion', selectedSuggestion);
      if (selectedSuggestion.length > 0 && selectedSuggestion[0].item) {
        widgetData.selectedSuggestion = selectedSuggestion[0].item.value;
        widgetData.selectedResponse = selectedSuggestion[0].item.label;
      } else {
        //May be user Typed something that is not in the suggestions list. Worst Case scenario.
        //Setting selectedSuggestions to false so we can show the userMessage as is.
        widgetData.selectedSuggestion = false;
        widgetData.selectedResponse = state.chatState.userMessage.message;
      }
      await state.chatState.rcUserThreadClient.updateMessage(
        state.chatState.userMessage.messageId,
        { metadata: { widgetData: JSON.stringify(widgetData) } }
      );

      // Update userMessage state with message metadata
      dispatch({
        type: 'SET_CHAT_STATE',
        payload: {
          userMessage: {
            ...state.chatState.userMessage,
            metaData: JSON.stringify(widgetData),
          },
          lastWidgetData: null,
        },
      });
    } catch (error) {
      // widgetData.selectedSuggestion = 'none';
      // widgetData.selectedResponse =chatState.userMessage;
      console.log('error', error);
    }
  }
  //Update the message containing the widget with the selectedResponse.
  if (widgetData && widgetData.messageId) {
    const agentMessageMetadata = {
      widgetData: JSON.stringify(widgetData),
    };
    await state.chatState.agentThreadClient.updateMessage(widgetData.messageId, {
      metadata: agentMessageMetadata,
    });
  }
  return widgetData;
};
