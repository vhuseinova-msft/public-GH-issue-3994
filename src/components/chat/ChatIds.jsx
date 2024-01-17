import React from 'react';
import ReactJson from 'react-json-view';

const ChatIds = ({ file }) => {
  file.userTokenResponse = '**********';
  file.AICTokenResponse = '**********';
  file.userIdentity = file.userIdentityResponse.communicationUserId;
  file.AICIdentity = file.AICIdentityResponse.communicationUserId;
  return (
    <>
      {file ? (
        <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <ReactJson 
            src={file}
            collapsed='1'
          />
        </div>
      ) : (
        <p>No Chat Ids with current thread!</p>
      )}
    </>
  );
};

export default ChatIds;
