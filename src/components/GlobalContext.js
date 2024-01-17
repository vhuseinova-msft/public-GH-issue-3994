import { createContext, useState, useEffect } from 'react';
import kbMaster from '../config/kb-master.json';

export const GlobalContext = createContext({
  isMobile: false,
  agentProfile: {},
  agents: [],
  setViewInCard: () => {},
  setChatAgentProfile: () => {},
});

export const GlobalContextProvider = ({ children }) => {
  const [state, setState] = useState({
    isMobile: false,
    viewInCard: false,
    agentProfile: {},
    agents: [],
  });

  const setViewInCard = (viewInCard) => {
    setState((prevState) => ({ ...prevState, viewInCard }));
  };

/**
 * Method to set Agent's profile
 * @param {object} profile object as configured in Relic Care Agent REST API
 * @param {string} facilityId
 * @returns {void}
 */
  const setChatAgentProfile = (profile, facilityId) => {
    let agentProfile = {};
    if (!facilityId) {
      throw new Error(
        'setChatAgentProfile Error: Facility Id cannot be blank.'
      );
    }
    if (facilityId === 'san_diego_post_acute_center' ) {//Backward compatibility
      facilityId = 'R-92101A-SAN-INFORM';
    }
    if (facilityId === 'sunrise_senior_living' ) {//Backward compatibility
      facilityId = 'S-90403A-SAN-INFORM';
    }
    const selectedKb = kbMaster.find(
      (facility) => facility.kbObject.kbCode === facilityId
    );
    if (!selectedKb || !selectedKb.kbObject || !selectedKb.kbObject.kbTopic) {
      throw new Error(
        `setChatAgentProfile Error: Facility Id "${facilityId}" not found in kb-master.json.`
      );
    }
    if (
      profile &&
      profile.azureAssistantSetup &&
      profile.acsId &&
      profile.acsToken &&
      profile.agentName
    ) {
      agentProfile = agentProfileForContext(profile);
      agentProfile.facilityId = facilityId;
      agentProfile.facilityName = selectedKb.kbObject.kbTopic;
    
      setState((prevState) => ({
        ...prevState,
        agentProfile,
      }));
    } else {
      setState((prevState) => ({
        ...prevState,
        agentProfile: {
          ...profile,
          facilityId,
         facilityName: selectedKb.kbObject.kbTopic,
        },  
      }));
    }
  };
  
  /**
   * Translate configured agentProfile to agentProfileForContext
   * The structure is more flattened for ease of use in the context
   * @param {object} profile object as configured in Relic Care Agent REST API
   * @param {string} facilityId
   * @returns {void}
   */
  const agentProfileForContext = (agentProfile) => {
    const threadGreeting = agentProfile?.relicAssistantSetup?.greetingTemplates?.find(item => item.event === "threadGreeting");
    let profileForContext = agentProfile.azureAssistantSetup;
    profileForContext.acsId = agentProfile.acsId;
    profileForContext.acsToken = {
      token: agentProfile.acsToken.token,
    };
    profileForContext.agentName = agentProfile.agentName;
    profileForContext.displayRole = agentProfile?.role['display-role'];
    profileForContext.kbTemplate = agentProfile?.relicAssistantSetup?.kbPromptTemplate;
    profileForContext.greetingTemplate = threadGreeting?.greetingTemplate;
    profileForContext.kbLinked = agentProfile?.relicAssistantSetup?.kbLinked;
    return profileForContext;
  };

  const updateWindowDimensions = () => {
    const isMobile = window.innerWidth < 620;
    setState((prevState) => ({ ...prevState, isMobile }));
  };

  useEffect(() => {
    updateWindowDimensions();
    window.addEventListener('resize', updateWindowDimensions);

    return () => {
      window.removeEventListener('resize', updateWindowDimensions);
    };
  }, []);

  return (
    <GlobalContext.Provider
      value={{ ...state, setViewInCard, setChatAgentProfile }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const GlobalContextConsumer = GlobalContext.Consumer;
