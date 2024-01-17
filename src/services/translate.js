// https://www.deepl.com/docs-api/translate-text

  
  export const translate = async (text, targetLang, sourceLang = '') => {
    const translateEndpoint = 'https://agent-messenger-translate.calmbay-07fbcdc7.eastus.azurecontainerapps.io/translate'  // TODO: update this endpoint
    const requestBody = {
      text: [text],
      target_lang: targetLang,
      source_lang: sourceLang,
    };
  
    try {
      const response = await fetch(translateEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const responseData = await response.json();
      if (responseData.deepl) {
        return { languageCode: responseData.languageCode, translation: responseData.deepl.translations[0].text }
      } else {
        return { languageCode: responseData.languageCode }
      }
    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error(error);
    }
  };