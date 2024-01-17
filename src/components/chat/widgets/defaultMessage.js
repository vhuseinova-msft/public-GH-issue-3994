import React from 'react';

const DefaultMessage = ({ defaultOnRender, messageProps }) => {
  if (messageProps.message.metadata?.messageIntl) {
    const messageIntl = JSON.parse(messageProps.message.metadata.messageIntl)
    const newMessageProps = {
      ...messageProps,
      message: {
        ...messageProps.message,
        content: messageIntl.content
      }
    }; 
    return (
      <div>
        {defaultOnRender(newMessageProps)}
      </div>
    )
  } else {
    return (
      <div>
        {defaultOnRender(messageProps)}
      </div>
    )
  }  

}

export default DefaultMessage;