import React, { useContext } from 'react';
import { Avatar, Popconfirm, Modal } from 'antd';
import profile from '../assets/profile.png';
import { CaretDownOutlined } from '@ant-design/icons';
import { GlobalContext } from './GlobalContext';
  

// Helper function to check if a key is sensitive
const isSensitive = (key) => {
  return (
    key.includes('KEY') ||
    key.includes('SECRET') ||
    key.includes('PASSWORD')
  );
};

const Environment = (props) => {
  const env = "DEV";
  const context = useContext(GlobalContext);

  const modalContent = (
    <>
      {Object.entries(process.env).map(([key, value]) => (
        <p key={key}>
          <strong>{key}:</strong> {isSensitive(key) ? '**********' : value}
        </p>
      ))}
    </>
  );

  const confirmLogout = () => {
    Modal.success({
      title: `${env} - Environment Details`,
      content: modalContent,
    });
  };
  return (
    <>
      <h4 style={{ display: 'inline', paddingLeft: 20 + 'px' }}>{env}</h4>
      <Popconfirm
        placement="bottomRight"
        title='Would you like view details for `env` environment?'
        onConfirm={confirmLogout}
        okText="Yes"
        cancelText="No"
      >
        <Avatar
          src={profile}
          style={{
            marginLeft: '20px',
            marginRight: !context.isMobile && '5px',
          }}
        />
        {!context.isMobile && <CaretDownOutlined />}
      </Popconfirm>
    </>
  );
};

export default Environment;
