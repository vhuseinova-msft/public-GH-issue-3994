import { useState, useEffect } from "react";
import axios from "axios";
import { getAccessToken } from '../services/medplumAuthService';
/**
 * Custom hook to retrieve patient summary data from the Patient Service API.
 *
 * @returns {Object} An object containing relicPatientData, isRelicPatientLoading, relicPatienterror, and getRelicPatientData function.
 */
const useGetPatientData = () => {
  const [relicPatientData, setRelicPatientData] = useState({
    patient: {},
    patientSummary: "",
  });
  const [relicPatientError, setRelicPatientError] = useState(null);
  const [isRelicPatientLoading, setIsPatientLoading] = useState(false);
  let cancelTokenSource = axios.CancelToken.source();

  /**
   * Function to fetch patient summary data from the Patient Service API.
   * @param {string} patient - The patient object containing patient details, including the 'id'.
   * @param {object} agentProfile - The agent with which patient is interacting.
   */
  const getRelicPatientData = async (patient, agentProfile) => {
    setIsPatientLoading(true);
    // Cancel previous request, if any
    cancelTokenSource.cancel();
    // Create a new cancel token source
    cancelTokenSource = axios.CancelToken.source();
    const accessToken = await getAccessToken();
    if (!accessToken) {
      //setRelicPatientError({
      //  type: 'GetPatientData Error',
      //  message: 'Access token not available',
      //})
      console.error('Access token not available');
      //return;
    }

    if (patient.id && agentProfile) {
      // Make the API call using Axios
      axios
        .get(`https://node-services.calmbay-07fbcdc7.eastus.azurecontainerapps.io/api/7760ffcd-64d2-43df-9548-055b257dfaee/patients/${patient.id}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGZiMDg2OGRiY2RmMTA2YjFhZDA1NTAiLCJ1c2VybmFtZSI6IiIsImlhdCI6MTY5NDE3NzY2MH0.4m-83vKFSyJT0A4FGL3zmEwvabJf3DbpiVY8AMG4L3o',
            'x-organization-id': patient?.managingOrganization?.reference.replace("Organization/", ""),
            'x-access-token': accessToken,
          },
          cancelToken: cancelTokenSource.token,
        })
        .then((response) => {
          if (
            response &&
            response.data &&
            response.data.summary &&
            response.data.goal &&
            response.data.id
          ) {
            const updatedPatientData = {
              patient : {...response.data },
              patientSummary: `${response.data.summary}.${response.data.goal}`,
            };
            // Set the patient summary data in the state.
            setRelicPatientData(updatedPatientData);
          } else {
            setRelicPatientError({
              type: "GetPatientData Error",
              message: "Invalid response while fetching patient details. Either patient summary or patient id is missing.",
            })
          }
        })
        .catch((error) => {
          setRelicPatientError({
            type: "GetPatientData Error",
            message: "An error occurred while fetching patient details." + JSON.stringify(error),
          })
        })
        .finally(() => {
          setIsPatientLoading(false);
        });
    } else {
      setRelicPatientError({
        type: "GetPatientData Error",
        message: "Patient.id and agentProfile.facilityName is mandatory while making GetPatientData API call.",
      })
    }
  };

  useEffect(() => {
    return () => {
      cancelTokenSource.cancel(); // Clean up the cancel token when the component unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { relicPatientData, relicPatientError, isRelicPatientLoading, getRelicPatientData };
};

export default useGetPatientData;