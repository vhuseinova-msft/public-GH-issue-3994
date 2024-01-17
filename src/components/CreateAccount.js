import React, { useState, useEffect, useContext } from 'react';
import {
  Drawer,
  Descriptions,
  message,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Flex,
  Spin,
} from 'antd';
import { GlobalContext } from './GlobalContext';
import { MedplumClient } from '@medplum/core';

const { Title } = Typography;

const CreateAccount = (props) => {
  const context = useContext(GlobalContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [form] = Form.useForm();

  const patient = props.patient && props.patient.resource;

  const medplum = new MedplumClient({
    clientId: "1940c3ef-8b6f-4ac0-a66c-d6aca3bff786",
    clientSecret: "0151de6a95f61082b358ca61618dcc422b47d46701a499811927d86710c560b7",
  });
  
  useEffect(() => {
    const getPatientPortalDetails = async () => {
      if (props.patient) {
        try {
          const patientPortalDetails = await medplum.searchResources('ProjectMembership', {
            'profile-type': 'Patient',
            profile: `Patient/${patient.id}`,
          });
          if (patientPortalDetails.length > 0) {
            setShowLogin(false);
            setProfile(patientPortalDetails[0]);
          } else {
            // Handle the case when patient portal details are not found
            setShowLogin(true); 
          }
        } catch (e) {
          message.error('Error fetching patient portal details');
        } finally {
          setLoading(false);
        }
      }
    };
  
    getPatientPortalDetails();
  }, [props.patient]);
  
  const onClose = () => {
    setLoading(true);
    setProfile(null);
    setShowLogin(false);
    props.onClose();
  };

  const initialValues = {
    email: `${patient?.name[0]?.family}.${patient?.name[0]?.given?.[0]}@reliccare.com`.toLowerCase(),
    password: `${patient?.name[0]?.family}.${patient?.name[0]?.given?.[0]}@reliccare.com`.toLowerCase(),
  };
  
  const onFinish = async (values) => {
    const { email, Password } = values;
    try {
      // Check all conditions before sending to update and create
      if (email.trim() === "" && Password === "") {
        message.error('Email or Password cannot be empty');
      } else {
        if (patient?.telecom) {
          const emailIndex = patient.telecom?.findIndex(item => item.system === 'email');
          if (emailIndex !== -1) {
            // Update the email of patient using patch
            await medplum.patchResource('Patient', patient.id, [
              { op: 'replace', path: `/telecom/${emailIndex}/value`, value: values.email },
            ]);
          } else {
            // Add email field 
            await medplum.updateResource({
              ...patient,
              telecom: [
                ...patient.telecom,
                {
                  "system": "email",
                  "use": "home",
                  "value": values.email
                }
              ]
            });
          }
        } else {
          // Add telecom field 
          await medplum.updateResource({
            ...patient,
            telecom: [
              {
                "system": "email",
                "use": "home",
                "value": values.email
              }
            ]
          });
        }
  
        // Create patient as user on patient portal
        const createUser = await medplum.invite("1940c3ef-8b6f-4ac0-a66c-d6aca3bff786", {
          ...values,
          resourceType: 'Patient',
          firstName: patient?.name[0]?.family,
          lastName: patient?.name[0]?.given?.[0],
          sendEmail: false,
        });
  
        if (createUser) {
          setShowLogin(false);
          message.success('Patient created successfully!');
          setProfile(createUser);
        } else {
          message.error('Failed to create patient.');
        }
      }
    } catch (error) {
      message.error('Error processing patient creation: ' + error.message);
    }
  };
  

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
  };

  return (
    <Drawer
      title="Patient Portal Account Creation"
      placement="right"
      closable={true}
      onClose={onClose}
      open={props.visible}
      width={context.isMobile ? '100%' : '60%'}
      styles={{ body: { padding: '0 10px' } }}
    >
      {loading ? (
        <Flex
          align="center"
          justify="center"
          vertical
          style={{ height: '20vh' }}
        >
          <Spin size="large" />
        </Flex>
      ) : showLogin ? (
        <Row justify="center">
          <Col span={12} style={{ textAlign: 'center' }}>
            <Form {...layout} form={form} name="loginForm" onFinish={onFinish} initialValues={initialValues}>
              <Title level={4} style={{ margin: '2rem' }}>
                Create Account for {patient?.name[0]?.family} {patient?.name[0]?.given?.[0]}
              </Title>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                ]}
              >
                <Input.Password placeholder="Enter your password" />
              </Form.Item>
              <Form.Item {...tailLayout}>
                <Row justify="center">
                  <Col>
                    <Button type="primary" htmlType="submit">
                      Register
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      ) : (
        <Row justify="center">
          <Col span={12} style={{ textAlign: 'center' }}>
            <Descriptions
              title="Patient Portal Account Information"
              layout="vertical"
              column={1}
            >
              <Descriptions.Item label="Email">
                {profile?.user?.display}
              </Descriptions.Item>
              <Descriptions.Item label="Password">
              **********
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      )}
    </Drawer>
  );
};

export default CreateAccount;
