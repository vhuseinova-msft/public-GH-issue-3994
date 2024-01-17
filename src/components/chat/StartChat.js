'use client';
import React, { useContext, useState, useEffect } from 'react';
import { Drawer, Alert, Skeleton, Space } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import { GlobalContext } from '../GlobalContext';
import { FallBack } from '../../utils/FallBack';
import useGetAcsUser from '../../hooks/useGetAcsUser';
import useGetPatientData from '../../hooks/useGetPatientData';
import ChatPanel from './ChatPanel';
import useAgent from '../../hooks/useAgent';

const StartChat = (props) => {
  const context = useContext(GlobalContext);
  const { open } = props;
  const patient = props.patient && props.patient.resource;
  const [currentFacilityId, setCurrentFacilityId] = useState('');
  const [isStartChatError, setIsStartChatError] = useState(null);
  const [isStartChatLoading, setIsStartChatLoading] = useState(true);
  // Custom hooks to get ACS user and patient summary data.
  const { acsUser, acsUserError, isAcsUserLoading, getAcsUser } =
    useGetAcsUser();
  const {
    relicPatientData,
    relicPatientError,
    isRelicPatientLoading,
    getRelicPatientData,
  } = useGetPatientData();
  const { newAgentDetail, newAgentError, getNewAgent } = useAgent();
  /**
   * ComponentDidMount effect to fetch default agent profile
   * Emily is hardcoded as the default agent.
   */
  useEffect(() => {
    const agentCommunicationId =
      '8:acs:8ca4fbc2-e63c-4283-a5b7-feb83074370e_0000001b-57e2-3b1a-28f4-343a0d000dc6';
    getNewAgent(agentCommunicationId,patient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /**
   * This effect is triggered when we receive default agent profile data.
   * We default the facility if none is set in state.
   */
  useEffect(() => {
    //Added silent error handler to unblock QA
    //Sometimes, we change KB codes for facility while thread remembers old Facility KB codes.
    try {
      if (newAgentDetail) {
        if (currentFacilityId) {
          context.setChatAgentProfile(newAgentDetail, currentFacilityId);
        } else {
          context.setChatAgentProfile(newAgentDetail, 'abc_hospital');
        }
      }
    } catch (error) {
      console.log('Error occured while setting agent profile', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAgentDetail]);

  useEffect(() => {
    //Added silent error handler to unblock QA
    //Sometimes, we change KB codes for facility while thread remembers old Facility KB codes.
    try {
      if (currentFacilityId) {
        context.setChatAgentProfile(context.agentProfile, currentFacilityId);
      } else {
        context.setChatAgentProfile(newAgentDetail, 'abc_hospital');
      }
    } catch (error) {
      console.log('Error occured while setting agent profile', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFacilityId]);

  /**
   * Function to fetch ACS user details.
   * It checks if there is a patient, and if so, it attempts to fetch ACS user data.
   */
  async function getAcsUserDetails() {
    if (patient) {
      try {
        // Fetch ACS user data
        await getAcsUser(patient);
      } catch (error) {
        setIsStartChatError({
          type: 'StartChat Error',
          message:
            'Failure while getting ACS User for patient : ' +
            patient.id +
            '.' +
            JSON.stringify(error),
        });
      }
    }
  }

  /**
   * Function to fetch Relic user details.
   * It checks if there is a patient, context, and facilityId in agentProfile,
   * and if so, it attempts to fetch patient summary data.
   */
  async function getRelicUserDetails() {
    if (patient && context?.agentProfile?.facilityId) {
      try {
        // Fetch patient summary data
        await getRelicPatientData(patient, context.agentProfile);
      } catch (error) {
        setIsStartChatError({
          type: 'StartChat Error',
          message:
            'Failure while getting Relic Patient Data for patient : ' +
            patient.id +
            '.' +
            JSON.stringify(error),
        });
      }
    }
  }

  // Effect to trigger getRelicUserDetails when patient or context.agentProfile changes.
  useEffect(() => {
    getRelicUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, context.agentProfile]);

  // Effect to trigger getAcsUserDetails when patient changes.
  useEffect(() => {
    getAcsUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  /**
   * Error effect triggered if any dependent hooks set error.
   * Ideally, we should be able to throw error but right now, we are using error states to handle custom hooks errors.
   */
  useEffect(() => {
    // Handle ACS User Error
    if (acsUserError) {
      setIsStartChatError(acsUserError);
    }

    // Handle Relic Patient Error
    if (relicPatientError) {
      setIsStartChatError(relicPatientError);
    }

    // Handle Agent Profile Error
    if (newAgentError) {
      setIsStartChatError(newAgentError);
    }
  }, [acsUserError, relicPatientError, newAgentError]);

  /**
   * This side effect sets isStartChatLoading to false leading to Chat Panel rendering itself.
   * All validations are performed so we don't end up launching Chat Panel when we are not ready.
   */
  useEffect(() => {
    if (!isAcsUserLoading && !isRelicPatientLoading) {
      //verify that we have appropriate acsUser details needed to proceed
      if (
        acsUser?.userTokenResponse?.token &&
        acsUser?.threadId &&
        context?.agentProfile
      ) {
        setIsStartChatLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acsUser, isAcsUserLoading, isRelicPatientLoading]);

  /**
   * This custom event handler changes the facility id in agent's profile.
   * Agent's profile facility change also triggers patient summary update and re-renders Start Chat + children.
   * @param {String} newFacilityId
   */
  const loadAgentOrFacility = async (
    newFacilityId,
    newAgentCommunicationId = ''
  ) => {
    let loadedAgent = null;
    if (
      newAgentCommunicationId &&
      newAgentCommunicationId !== context.agentProfile.acsId
    ) {
      loadedAgent = await getNewAgent(newAgentCommunicationId, patient);
    } else {
      loadedAgent = context.agentProfile;
    }
    if (!newFacilityId) {
      newFacilityId = 'abc_hospital';
    }
    if (context.agentProfile.facilityId !== newFacilityId) {
      //update the session facility id to trigger side effect
      setCurrentFacilityId(newFacilityId);
    }
    return loadedAgent;
  };

  /**
   * Generates the title to be displayed in a drawer for a given patient.
   * @param {Object} patient - The patient object containing name information.
   * @returns {String} The formatted title for the drawer.
   */
  const getDrawerTitle = (patient) => {
    const title = `${patient.name?.[0]?.family} ${patient.name?.[0]?.given?.[0]}`;
    return title;
  };

  // Handler for closing the chat drawer.
  const onDrawerClose = () => {
    props.onClose();
  };

  return (
    <>
      {patient && (
        <Drawer
          title={getDrawerTitle(patient)}
          placement="right"
          closable={true}
          onClose={onDrawerClose}
          open={open}
          width={context.isMobile ? '100%' : '60%'}
          styles={{body:{ overflow: 'hidden', padding: '0 4px' }}}
        >
          <ErrorBoundary 
          fallbackRender={FallBack}>
            {isStartChatLoading && (
              <>
                <Space style={{ margin: '15px' }}>
                  <Skeleton.Input active />
                  <Skeleton.Input active />
                  <Skeleton.Input active />
                  <Skeleton.Input active />
                  <Skeleton.Input active />
                </Space>
              </>
            )}
            {!isStartChatLoading && isStartChatError && (
              <Alert
                message={isStartChatError?.type}
                description={isStartChatError?.message}
                type="error"
                showIcon
              />
            )}
            {!isStartChatLoading &&
              !isStartChatError &&
              relicPatientData &&
              acsUser && (
                  <ChatPanel
                    relicPatientData={relicPatientData}
                    currentChatUser={acsUser}
                    loadAgentOrFacility={loadAgentOrFacility}
                    patient={patient}
                  />
              )}
          </ErrorBoundary>
        </Drawer>
      )}
    </>
  );
};

export default StartChat;
