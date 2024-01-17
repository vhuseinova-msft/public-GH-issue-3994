import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import axios from 'axios';

// Environment variables for connecting with Azure Open AI
const azureOpenAiEndpoint = "https://relic-openai.openai.azure.com/";
const azureOpenAiApiKey = "d0ae1e70eac847d1836f9f73fd97e166";

// Environment variables for connecting with Relic Care Specialized KB
const relicSpecializedKbEndPoint ="https://kb-search.calmbay-07fbcdc7.eastus.azurecontainerapps.io/search_text";

// Default templates for AI Agent
const fallbackSystemPrompt =
  'In this scenario, you are an AI counsellor. Your role is to provide emotional support and a safe space for the person interacting with you. Remember, as an AI, you cannot provide professional therapeutic intervention, but you are programmed to simulate a compassionate and understanding counselling style. Your purpose is to ask thoughtful and proactive questions, encouraging the user to share their feelings and thoughts. Ensure to respond in a non-judgemental, empathetic, and patient manner. Prioritize active listening, validation, and exploration over providing advice or solutions. ';
const fallbackKbTemplate =
  'My question is in {{ }} markers. In response to that question, the healthcare facility has some information in [[ ]] markers. If the information provided by healthcare facility is relevant to my question, use this information to formulate your response.';
const fallbackGreetingTemplate = `My introduction is in {{ }} markers.\n\nYou need to greet me with warmth and positivity, you can also make a commment on today's weather or something similar to make me feel good about today. It should be a general greeting without any specific question.`;

/**
 * Get response from AI enabled agent. The parameters
 * @param {any} userProfile
 * @param {any} agentProfile
 * @param {any} messageHistory. This contains the message history where the first message should be from AIC and the last message should be from the user. If the first and last message are not provided accordingly an exception would be thrown.
 * @param {any} lastUserMessage
 * @returns {any}
 */
async function getAgentResponse(
  userProfile,
  messageHistory,
  lastUserMessage,
  agentProfile,
  cancelTokenSource,
  relicPatientData
) {
  let agentMessage;
  let agentMessageMetadata = {};
  let azureOpenAiDeploymentId = '';
  let azureOpenAiRequest, azureOpenAiRequestOptions;
  let response;
  let reIdentifiedMessage;

  // We have to implement the re-identification here
  [azureOpenAiRequest, azureOpenAiRequestOptions] =
    await constructAzureOpenAiRequest(
      userProfile,
      messageHistory,
      lastUserMessage,
      agentProfile,
      cancelTokenSource,
      relicPatientData
    );

  // Construct Azure Open AI Chat Completion API call
  const azureOpenAiclient = new OpenAIClient(
    azureOpenAiEndpoint,
    new AzureKeyCredential(azureOpenAiApiKey)
  );
  if (
    agentProfile &&
    agentProfile.chatParameters &&
    agentProfile.chatParameters.deploymentName
  ) {
    azureOpenAiDeploymentId = agentProfile.chatParameters.deploymentName;
  } else {
    throw new Error(
      'agentProfile.chatParameters.deploymentName cannot be empty. Re-export Azure Open AI playground setup.'
    );
  }

  // if (agentProfile && agentProfile.mode && agentProfile.mode === "demo") {
  //   //Todo: Schema can be centralized once we get the solution working. Copied here for now.
  //   //Demo: This is a demo message
  //   agentMessage =
  //     'This question would be best answered by Daniel, our dietician. Would you like to speak with him?';
  //   const widgetData = {
  //     widget: 'SuggestionWidget',
  //     agentName: 'Daniel',
  //     suggestions: [
  //       { label: 'Yes, please.', value: true },
  //       { label: 'No, thanks.', value: false },
  //     ],
  //   };
  //   agentMessageMetadata = {
  //     widgetData: JSON.stringify(widgetData),
  //   };
  //   return { agentMessage, agentMessageMetadata, azureOpenAiRequest };
  // }

  try {
    response = await azureOpenAiclient.getChatCompletions(
      azureOpenAiDeploymentId,
      azureOpenAiRequest,
      azureOpenAiRequestOptions
    );
    // We did not think about the situation where we don't receive a response.
    // This is happening with the API. and the code simply keeps waiting.
    // We need to handle this situation via a timeout and may be a retry.
    // else the behavior becomes unpredictable is there is no response and no error.

    // agentMessage = 'Dummy Response. For testing comment out the actual API call.';
    agentMessage = response.choices[0].message.content;
    
    // Re-identification of obfuscation details
    if(relicPatientData.obfuscationMap) {
      reIdentifiedMessage = reIdentify(agentMessage, relicPatientData);
    } else {
      reIdentifiedMessage = agentMessage;
    }

    // As we want to display lastRequest as well and we are calling the constructAzureOpenAiRequest here.
    // we can return constructAzureOpenAiRequest with this function. So that we don't need to call function multiple time.
    return { agentMessage: reIdentifiedMessage, agentMessageMetadata, azureOpenAiRequest, response };
  } catch (error) {
    agentMessage = `Error in Agent API call to Azure Open API. ${JSON.stringify(
      error
    )}`;
    return { agentMessage, agentMessageMetadata, azureOpenAiRequest };
  }
}

/**
 * Construct Azure Open AI Request. 
 * This method validates the input parameters & throws errors in case of issues.
 * This method searches KB & merges KB results with the last user message. 
 * This method also processes last user message & updates it as needed (greeting, kb search etc.).
 * This method sequences agent profile, message history & last user message for Open AI API call.
 * @param {any} userProfile. User profile containing userId and summary.
 * @param {any} messageHistory. Message history containing 'system', 'assistant' and 'user' message.
 * @param {any} lastUserMessage. The last message sent by the user.
 * @param {any} agentProfile. The agent profile containing the chat parameters and bot personality.
 * @returns {any}
 */
async function constructAzureOpenAiRequest(
  userProfile,
  messageHistory,
  lastUserMessage,
  agentProfile,
  cancelTokenSource,
  relicPatientData
) {
  // Initialization and parameter validation.
  let userId;
  let facilityId,
    userSummary = '';
  let deIdentifiedMessage;
  // Validate userProfile userId and summary
  if (userProfile && userProfile.userId) {
    userId = userProfile.userId;
  } else {
    throw new Error('userProfile.userId cannot be empty');
  }

  if (userProfile && userProfile.summary) {
    userSummary = userProfile.summary;
  } else {
    throw new Error('userProfile.summary cannot be empty');
  }

  // Validate agentProfile
  if (agentProfile && agentProfile.facilityId) {
    facilityId = agentProfile.facilityId;
  } else {
    throw new Error('agentProfile.facilityId cannot be empty');
  }
  const systemPrompt =
    agentProfile && agentProfile.systemPrompt
      ? agentProfile.systemPrompt
      : fallbackSystemPrompt;
  const kbTemplate =
    agentProfile && agentProfile.kbTemplate
      ? agentProfile.kbTemplate
      : fallbackKbTemplate;
    
  const greetingTemplate =
    agentProfile && agentProfile.greetingTemplate
      ? agentProfile.greetingTemplate.replace("<patient name>", userProfile?.name)
      .replace("<Aidiologist name>", agentProfile.agentName)
      : fallbackGreetingTemplate + `\n{{${userSummary}}}`;
  // Validate messageHistory & lastUserMessage
  const lastMessageFromHistory = messageHistory.slice(-1);
  if (lastMessageFromHistory[0] && lastMessageFromHistory[0].role !== 'user') {
    throw new Error(
      `Last messageHistory item has to be with role user. History : ${JSON.stringify(
        lastMessageFromHistory[0]
      )} and Last User Message : ${lastUserMessage}`
    );
  }
  if (
    lastMessageFromHistory[0] &&
    lastMessageFromHistory[0].content !== lastUserMessage
  ) {
    throw new Error(
      `Last messageHistory item has to match lastUserMessage. History : ${JSON.stringify(
        lastMessageFromHistory[0]
      )} and Last User Message : ${lastUserMessage}`
    );
  }

  //If there is message history, then it's not a greeting situation.
  if (messageHistory.length > 1 && lastUserMessage.trim().length > 15) {
    // Call kb-search API to find if there is any relevant kb in Relic kb.
    let pathList = []
    let kbMaster = require('../config/kb-master.json')
    //Check if there are any facility KBs that are enabled for search
    const kbFacilities = kbMaster.reduce((matchedFacilities, currentFacility) => {
      matchedFacilities = currentFacility?.searchEnabled ? matchedFacilities.push(currentFacility) : matchedFacilities
      return matchedFacilities;
    }, []);
    for(let i = 0; i < kbFacilities.length; i++) {
      pathList.push(`facility/${kbFacilities[i].kbObject.kbCode}/`)
    }
    //Check if agent has any linked kbcodes
    if(agentProfile?.kbLinked?.length > 0) {
      for(let i = 0; i < agentProfile.kbLinked.length; i++) {
        if (!pathList.includes(`${agentProfile.kbLinked[i]}`)) {
          pathList.push(`${agentProfile.kbLinked[i]}`)
        }
      }
    }
    const kbSearchQuery = {
      path_list: pathList,
      text: `${lastUserMessage}`,
      max_return: "1",
      threshold: "0.8",
    };

    try {
      if (kbSearchQuery.path_list.length > 0) {
        const kbResponse = await axios.post(
          `${relicSpecializedKbEndPoint}`,
          kbSearchQuery, {cancelToken: cancelTokenSource.token})
          .catch((error) => {
            throw new Error(`Error in Relic Knowledge API call. ${JSON.stringify(error)}`);
          });

        // Reconstruct the lastUserMessage if we find anything in kbResponse
        if (kbResponse.data && kbResponse.data.search_results) {
          let kbResults = Object.values(kbResponse.data.search_results);
          let maxScore = 0;
          let chunkWithMaxScore = '';
          //Find the highest score chunk among all KB results
          kbResults.forEach((kbResult) => {
            const currentKbScore = kbResult[0]?.score; 
            if (currentKbScore && currentKbScore > maxScore) {
              maxScore = currentKbScore;
              chunkWithMaxScore = kbResult[0]?.chunk;
            };
          });
          lastUserMessage = `${kbTemplate}\n{{${lastUserMessage}}}\n[${JSON.stringify(chunkWithMaxScore)}]`        
        }
        // Add user summary to the lastUserMessage
        lastUserMessage = userSummary + ' ' + lastUserMessage;
      }
    } catch (error) {
      throw error;
    }
  } else if (lastUserMessage.trim().length === 0) {
    // If lastUserMessage is empty, then it's a greeting situation.
    lastUserMessage = greetingTemplate;
    messageHistory = [formatChatMessage('user', lastUserMessage)];
  }

  // Constructing Open AI Request Options
  const azureOpenAiRequestOptions = {};
  azureOpenAiRequestOptions.maxTokens =
    agentProfile.chatParameters && agentProfile.chatParameters.maxResponseLength
      ? agentProfile.chatParameters.maxResponseLength
      : '700';
  azureOpenAiRequestOptions.temperature =
    agentProfile.chatParameters && agentProfile.chatParameters.temperature
      ? agentProfile.chatParameters.temperature
      : '0.7';
  if (!azureOpenAiRequestOptions.temperature) {
    azureOpenAiRequestOptions.topP =
      azureOpenAiRequestOptions.temperature &&
      agentProfile.chatParameters &&
      agentProfile.chatParameters.topProbablities
        ? agentProfile.chatParameters.topProbablities
        : '0.95';
  }
  /**
   * A map between GPT token IDs and bias scores that influences the probability of specific tokens
   * appearing in a completions response. Token IDs are computed via external tokenizer tools, while
   * bias scores reside in the range of -100 to 100 with minimum and maximum values corresponding to
   * a full ban or exclusive selection of a token, respectively. The exact behavior of a given bias
   * score varies by model.
   *
   *   logitBias?: Record<string, number>;
   *
   * Not used right now but looks useful for introduction bias towards or against certain words.
   */
  azureOpenAiRequestOptions.user = userId;
  azureOpenAiRequestOptions.stopSequences =
    agentProfile.chatParameters && agentProfile.chatParameters.stopSequences
      ? agentProfile.chatParameters.stopSequences
      : undefined;
  azureOpenAiRequestOptions.presencePenalty =
    agentProfile.chatParameters && agentProfile.chatParameters.presencePenalty
      ? agentProfile.chatParameters.presencePenalty
      : 0;
  azureOpenAiRequestOptions.frequencyPenalty =
    agentProfile.chatParameters && agentProfile.chatParameters.frequencyPenalty
      ? agentProfile.chatParameters.frequencyPenalty
      : 0;
  azureOpenAiRequestOptions.stream = false;
  // Constructing Open AI Request by cloning messageHistory.
  const azureOpenAiRequest = messageHistory.map((x) => x);
  // If the request already contains a system message then we don't need to append User Summary or Agent Profile.
  if (azureOpenAiRequest.slice(0, 1)[0].role !== 'system') {
    // add User Introduction to messageHistory on top. Assumption is that messageHistory starts from AIC.
    if (userSummary) {
      azureOpenAiRequest.unshift(formatChatMessage('user', userSummary)); // add user Summary as the first User Message in the history
    }

    // add fewShotExamples above User Introduction
    if (agentProfile.fewShotExamples) {
      for (const example of processFewShotExamples(
        agentProfile.fewShotExamples
      )) {
        azureOpenAiRequest.unshift(example);
      }
    }
    // add systemPrompt at the very first position.
    azureOpenAiRequest.unshift(formatChatMessage('system', systemPrompt)); // add system Prompt
  }

  // Here we have to implement deIdentify
  if(relicPatientData.obfuscationMap) {
    deIdentifiedMessage = deIdentify(lastUserMessage, relicPatientData);
  } else {
    deIdentifiedMessage = lastUserMessage;
  }
  

  // remove last userMessage and insert updated userMessage
  azureOpenAiRequest.pop();
  azureOpenAiRequest.push(formatChatMessage('user', deIdentifiedMessage));
  return [azureOpenAiRequest, azureOpenAiRequestOptions];
}

/**
 * Generate the message as per Azure Open AI Request Message requirement
 * @param {any} chatRole. Specify the roles 'system', 'assistant', 'user'
 * @param {any} message. Message spoken by that role.
 * @returns {any} JSON. Returns message formulated as JSON object with role and content nodes.
 */
function formatChatMessage(chatRole, message) {
  const chatMessage = {
    role: chatRole,
    content: message,
  };
  return chatMessage;
}

/** Loop through fewShotExamples object array
 * code each userInput node as {role: user, content: fewShotExamples.userInput}
 * code each chatbotResponse node as {role: assistant, content: fewShotExamples.chatbotResponse}
 * Return another object array created as below.
 * [
    {
    role: "assistant",
    content: "Nice to meet you Weber Pauline. How are you feeling today?",
    },
    {
    role: "user",
    content: "I am feeling all right but having a little pain in my knee."
    },
    ]
 * @param {array} fewShotExamples. fewShotExamples node from Azure Playground. Standard node expected.
 * @returns {array} Array of objects templated in Azure Open AI Request messages format.
 */
function processFewShotExamples(fewShotExamples) {
  let userMessage;
  let assistantMessage = '';
  const examples = [];
  for (const example of fewShotExamples) {
    userMessage =
      example && example.userInput
        ? formatChatMessage('user', example.userInput)
        : '';
    assistantMessage =
      example && example.chatbotResponse
        ? formatChatMessage('assistant', example.chatbotResponse)
        : '';
    if (userMessage) examples.unshift(userMessage);
    if (assistantMessage) examples.unshift(assistantMessage);
  }
  return examples;
}

/**
 * Generate the message with obfuscated message
 * @param {any} message. Message sending to open AI.
 * @returns {any} String. Returns obfuscated message.
 */

function deIdentify(message, relicPatientData) {
  for (const key in relicPatientData.obfuscationMap) {
    const { value, obfuscatedValue } = relicPatientData.obfuscationMap[key];
    if (value !== null && message.includes(value)) {
      message = message.replace(value, obfuscatedValue);
    }
  }
  return message;
}

/**
 * Generate the message clearing obfuscated message detail
 * @param {any} message. Message received from open AI.
 * @returns {any} String. Returns changed obfuscated message.
 */
function reIdentify(message, relicPatientData) {
  // Reverse order
  const keysInReverseOrder = Object.keys(relicPatientData.obfuscationMap).reverse();

  for (const key of keysInReverseOrder) {
    const { value, obfuscatedValue } = relicPatientData.obfuscationMap[key];
    if (value !== null && message.includes(obfuscatedValue)) {
      message = message.replace(obfuscatedValue, value);
    }
  }
  return message;
}

export { getAgentResponse, formatChatMessage, constructAzureOpenAiRequest };