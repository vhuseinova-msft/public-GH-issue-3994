import React from 'react';
import ReactJson from 'react-json-view';

const LastRequest = ({ lastMessageRequest }) => {
  return (
    <>
      {lastMessageRequest ? (
        <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <ReactJson 
            src={lastMessageRequest}
            collapsed='1'
          />
        </div>
      ) : (
        <p>No last message request available</p>
      )}
    </>
  );
};

export default LastRequest;
