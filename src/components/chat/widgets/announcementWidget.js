import { Divider } from 'antd';

/**
 * AnnouncementWidget Function
 * React component for rendering announcements within a chat thread.
 * @param {object} props - Component properties.
 * @param {object} props.messageProps - Properties of the message being rendered.
 */
const AnnouncementWidget = ({ messageProps }) => {
  return (
    // Render an Ant Design Divider with the message content as its text
    <Divider plain className='relic-facility-divider'>
      {messageProps.message.content}
    </Divider>
  );
}
export default AnnouncementWidget;
