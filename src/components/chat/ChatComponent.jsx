import {
  usePropsFor,
  MessageThread,
  SendBox,
} from '@azure/communication-react';
import { Divider } from 'antd';
import { SuggestionWidget, AnnouncementWidget, SummaryWidget, DefaultMessage } from './widgets';

/**
 * ChatComponent Function
 * React component for rendering a chat interface with dynamic widget rendering.
 */
function ChatComponent({ onWidgetClick }) {
  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);
  
  // Define a mapping of widget names to their corresponding components
  const widgetComponents = {
    AnnouncementWidget,
    SuggestionWidget,
  };

  /**
   * onRenderMessage Function
   * Callback function to dynamically render messages with widgets.
   * @param {object} messageProps - Properties for the message being rendered.
   * @param {function} defaultOnRender - Default message rendering function.
   * @returns {JSX.Element} - The rendered message with widgets if applicable.
   */
  const onRenderMessage = (messageProps, defaultOnRender) => {
    const rawWidgetData = messageProps.message.metadata?.widgetData;
    const widgetData = rawWidgetData && JSON.parse(rawWidgetData);
    const widget = widgetData?.widget;
    // Transition-1 to Relic UI for metadataType === 'chat'
    const metadataType = messageProps.message.metadata?.type;
    if (metadataType === 'chat') {
      return (
        <DefaultMessage defaultOnRender={defaultOnRender} messageProps={messageProps}/>
      );
    }

    // Check if a widget name is specified in the message's metadata
    if (widget && widgetComponents[widget]) {
      // Dynamically load and render the widget component based on the widget name
      const WidgetComponent = widgetComponents[widget];
      return (
        <WidgetComponent
          messageProps={messageProps}
          defaultOnRender={defaultOnRender}
          onWidgetClick={onWidgetClick}
        />
      );
    }
    //Backward compatibility for previous announcements.
    if (
      messageProps.message.metadata?.messageType === "announcement"
    ) {
      return (
        <Divider plain className="relic-facility-divider">
          {messageProps.message.content}
        </Divider>
      );
    }
    // Check for summary in the thread available
    if(messageProps.message.metadata?.last_sequence_id) {
      return (
        <SummaryWidget 
        messageProps={messageProps}
        defaultOnRender={defaultOnRender}
        />
      );
    }

    return defaultOnRender ? defaultOnRender(messageProps) : <></>;
  };

  return (
    <div>
      <div style={{ height: '77vh' }}>
        {/* Props are updated asynchronously, so only render the component once props are populated. */}
        {messageThreadProps && 
          <MessageThread 
            {...messageThreadProps}
            onRenderMessage={onRenderMessage}
          />
        }
      </div>
      <div>{sendBoxProps && <SendBox {...sendBoxProps} />}</div>
    </div>
  );
}

export default ChatComponent;
