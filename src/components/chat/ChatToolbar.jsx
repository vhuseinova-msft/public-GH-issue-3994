import React, { useMemo, useContext } from 'react';
import {
  CommentOutlined,
  SendOutlined,
  RobotOutlined,
  HomeOutlined,
  ApiOutlined,
  CaretRightOutlined,
  EditOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import kbMaster from '../../config/kb-master.json';
import { GlobalContext } from '../GlobalContext';

const filteredFacilities = kbMaster.filter(
  (item) => item.kbType === 'Facility'
);

const facilityChildren = (currentFacilityId) =>
  filteredFacilities.map((item) => ({
    label: item.kbObject.kbTopic,
    key: item.kbObject.kbCode,
    icon:
      item.kbObject.kbCode === currentFacilityId ? (
        <CaretRightOutlined />
      ) : (
        <HomeOutlined />
      ),
  }));

const createMenuItems = (currentFacilityId) => [
  {
    label: 'Chat Panel',
    key: 'selectedChatPanel',
    icon: <CommentOutlined />,
  },
  {
    label: 'Last Request',
    key: 'selectedLastRequest',
    icon: <SendOutlined />,
  },
  {
    label: 'Facility',
    key: 'selectedFacility',
    icon: <HomeOutlined />,
    children: facilityChildren(currentFacilityId),
  },
  {
    label: 'Tools',
    key: 'selectedAgent',
    icon: <RobotOutlined />,
    children: [
      {
        label: 'Agent Profile',
        key: 'agentProfileView',
        icon: <ProfileOutlined />,
      },
      {
        label: 'Chat Ids',
        key: 'selectedChatIds',
        icon: <ApiOutlined />,
      },
      {
        label: 'Chat Transcript',
        key: 'chatTranscript',
        icon: <EditOutlined />,
      },
    ],
  },
];

const ChatToolbar = ({ onMenuClick, currentMenuItem }) => {
  const { agentProfile } = useContext(GlobalContext);

  const items = useMemo(
    () => createMenuItems(agentProfile.facilityId),
    [agentProfile.facilityId]
  );

  return (
    <Menu
      onSelect={onMenuClick}
      selectedKeys={[currentMenuItem]}
      mode="horizontal"
      items={items}
    />
  );
};

export default ChatToolbar;
