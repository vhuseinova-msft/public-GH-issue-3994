import { translate } from '../../../services/translate';
import {
  usePropsFor as _usePropsFor,
  SendBox,
} from '@azure/communication-react';

const customUsePropsFor = (component) => {
  /*
   * Case 1. SendBox
   */
  if (component === SendBox) {
    const sendBoxProps = _usePropsFor(component);

    // Options for SendBox
    const onSendMessage = async (content) => {
      // translate to English
      const translateResult = await translate(content, 'EN-US');
      console.log('translatedResult', translateResult);

      if (translateResult.translation !== undefined) {
        // if content is not English
        const options = {
          senderDisplayName: '', // no display name for user
          metadata: {
            type: 'chat',
            messageIntl: JSON.stringify({
              content: content,
              locale: translateResult.languageCode,
            }),
          },
        };
        sendBoxProps.onSendMessage(translateResult.translation, options);
      } else {
        // if content is English
        const options = {
          senderDisplayName: '', // no display name for user
          metadata: {
            type: 'chat',
          },
        };
        sendBoxProps.onSendMessage(content, options);
      }
    };

    if (sendBoxProps) {
      const newSendBoxProps = { ...sendBoxProps, onSendMessage };
      return newSendBoxProps;
    } else {
      return sendBoxProps;
    }
  }
  return _usePropsFor(component);
};

export default customUsePropsFor;
