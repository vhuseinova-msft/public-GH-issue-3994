import moment from 'moment';
/**
 * SummaryWidget Function
 * React component for rendering summary within a chat thread.
 * @param {object} props - Component properties.
 * @param {object} props.messageProps - Properties of the message being rendered.
 */
const SummaryWidget = ({ messageProps, defaultOnRender }) => {

  const updatedMessageProps = {
    ...messageProps,
    message: {
      ...messageProps.message,
      senderDisplayName: `Summary till ${moment(messageProps.message?.createdOn).format('MMM DD, hh:mm A')}`,
    },
  };

  return (
    <>
      {defaultOnRender(updatedMessageProps)}
    </>
  );
}
export default SummaryWidget;