import React, { useContext } from 'react';
import ReactJson from 'react-json-view';
import { GlobalContext } from '../GlobalContext';

/**
 * This component allows the user to view and edit the agent profile.
 * @component
 * @returns {JSX.Element} The AgentProfile component.
 */
const AgentProfileView = () => {
  const { agentProfile } = useContext(GlobalContext);
  // Component rendering based on editing mode
  return (
    <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
      {/* Display the JSON data using ReactJson component */}
      <ReactJson src={agentProfile} collapsed="1" enableClipboard={true} />
    </div>
  );
};

export default AgentProfileView;
