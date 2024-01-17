const initialState = {
  chatState: {
    userMessage: {
      messageId: '',
      message: '',
      metaData: '',
    },
    messages: [],
    rcUserStatefulChatClient: null,
    rcUserThreadClient: null,
    agentThreadClient: null,
    lastChatApiRequest: [],
    lastChatApiRequestOptions: {},
    lastWidgetData: null,
  },
  isChatPanelLoading: true,
  selectedMenuItem: 'selectedChatPanel',
};

const chatReducer = (state, action) => {
  console.log("state, action", state, action);
  switch (action.type) {
    case 'SET_SELECTED_MENU_ITEM':
      return { ...state, selectedMenuItem: action.payload };
      case 'SET_CHAT_STATE':
      return {
        ...state,
        chatState: {
          ...state.chatState,
          ...action.payload,
          messages: action.payload.replaceMessages
            ? [...(action.payload.messages || [])] 
            : [
                ...state.chatState.messages,
                ...(action.payload.messages || []), 
              ],
        },
      };
    case 'SET_LOADING':
      return { ...state, isChatPanelLoading: action.payload };
    default:
      return state;
  }
}

export { initialState, chatReducer };