import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Custom hook to retrieve ACS (Access Control Service) user for a patient.
 *
 * @returns {Object} An object containing acsUser, acsUserError, and getAcsUser function.
 */
function useGetAcsUser() {
  const [acsUser, setAcsUser] = useState(null);
  const [acsUserError, setAcsUserError] = useState(null);
  const [isAcsUserLoading, setIsAcsUserLoading] = useState(false);
  let cancelTokenSource = axios.CancelToken.source();
  /**
   * Function to fetch the ACS user for a patient from the API.
   * @param {Object} patient - The patient object containing patient details, including the 'id'.
   */
  const getAcsUser = async (patient) => {
    setIsAcsUserLoading(true);
    if (patient && patient.id) {
      // Cancel previous request, if any
      if (cancelTokenSource) {
        cancelTokenSource.cancel("Request cancelled due to a new request.");
      }
      // Create a new cancel token source
      cancelTokenSource = axios.CancelToken.source();

      // Prepare the request body for the API call.
      const requestBody = {
        rcUserId: patient.id,
        rcUserDisplayName: `${patient.name[0]?.family} ${patient.name[0]?.given?.[0]}`,
      };

      // Make the API call using Axios
      axios
        .post(
          `https://patient-service-summary-3.calmbay-07fbcdc7.eastus.azurecontainerapps.io/acs-user`,
          requestBody,
          {
            headers: { "Content-Type": "application/json" },
            cancelToken: cancelTokenSource.token,
          }
        )
        .then((response) => {
          const {
            userTokenResponse,
            userIdentityResponse,
            AICTokenResponse,
            AICIdentityResponse,
            threadId,
          } = response.data;
          // Validate response fields before setting state
          if (
            userTokenResponse &&
            userTokenResponse.token &&
            userIdentityResponse &&
            userIdentityResponse.communicationUserId &&
            AICTokenResponse &&
            AICTokenResponse.token &&
            AICIdentityResponse &&
            AICIdentityResponse.communicationUserId &&
            threadId
          ) {
            setAcsUser({
              userTokenResponse,
              userIdentityResponse,
              AICTokenResponse,
              AICIdentityResponse,
              threadId,
            });
          } else {
            setAcsUserError({
              type: "GetAcsUser Error",
              message: "Invalid response while fetching user ACS details. Missing required fields."
            });
          }
        })
        .catch((error) => {
          setAcsUserError({
            type: "GetAcsUser Error",
            message: "An error occurred while fetching ACS user." + JSON.stringify(error),
          });
        })
        .finally(() => {
          setIsAcsUserLoading(false);
        });
    } else {
      setAcsUserError({
        type: "GetAcsUser Error",
        message: "patient.id is mandatory while making GetAcsUser API call.",
      });
    }
  };

  useEffect(() => {
    return () => {
      // Clean up the cancel token when the component unmounts
      cancelTokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return the acsUser, acsUserError, and getAcsUser function to be used by the consuming component.
  return { acsUser, acsUserError, isAcsUserLoading, getAcsUser };
}

export default useGetAcsUser;
