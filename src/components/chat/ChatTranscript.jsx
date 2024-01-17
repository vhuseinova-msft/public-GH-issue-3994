import React from 'react';
import ReactJson from 'react-json-view';

const ChatTranscript = ({ lastMessageRequest }) => {
  const visibleItems = lastMessageRequest.slice(22); 

  return (
    <>
      {lastMessageRequest.length > 22 ? (
        <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <ReactJson 
            src={visibleItems}
            collapsed={1} 
          />
        </div>
      ) : (
        <p>No Chat Transcript available</p>
      )}
    </>
  );
}

export default ChatTranscript;
