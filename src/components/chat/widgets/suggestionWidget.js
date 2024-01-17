import { Space, Button } from 'antd';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const widgetSchema = {
  formAction: 'switchAgent',
  type: 'object',
  properties: {
    messageId: {
      type: 'string',
    },
    agentName: {
      type: 'string',
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    selectedSuggestion: {
      type: 'string',
    },   
  },  
};

const widgetUiSchema = {
  'ui:rootFieldId': 'switchAgent',
  messageId: {
    'ui:widget': 'hidden',
  },
  agentName: {
    'ui:widget': 'hidden',
  },
  suggestions: {
    'ui:widget': 'suggestions',
  },
  selectedSuggestion: {
    'ui:widget': 'hidden',
  },
};

/**
 * Suggestion control to show buttons with suggestions.
 * @param {any} value - Current value of the widget.
 * @param {object} messageProps - ACS message props.
 * @param {function} onWidgetClick - Function to call when anything on the widget is clicked.
 * @returns {JSX.Element} - JSX for suggestion control. List of Buttons with the suggestion.
 */
const SuggestionsControl = ({ value: suggestions, messageProps, onWidgetClick }) => {
  let widgetData = JSON.parse(messageProps.message.metadata.widgetData);
  if (widgetData) {
    widgetData.messageId = messageProps.message.messageId;
  };
  return (
    <>
      {widgetData && suggestions.map((suggestion, index) => {
        return (
          <Space key={index}>
            <Button
              key={index}
              type="primary"
              size="small"
              onClick={() => {
                widgetData.selectedSuggestion = suggestion.value;
                widgetData.selectedResponse = suggestion.label;
                onWidgetClick(widgetData);
              }}
            >
              {suggestion.label}
            </Button>
          </Space>
        );  
      })}
    </>
  );
}

/**
 * Widget for displaying multiple suggesitons that chat user can click and select.
 * @param {object} defaultOnRender - Default rendering function for message props.
 * @param {object} messageProps - Message properties.
 * @param {function} onWidgetClick - Function to call when anything on the widget is clicked.
 * @returns {JSX.Element} - JSX for Suggestion Widget.
 */
const SuggestionWidget = ({ defaultOnRender, messageProps, onWidgetClick}) => {
  let widgetData = {};
  let renderWidget = false;

  if (messageProps.message?.metadata?.widgetData) {
    widgetData = JSON.parse(messageProps.message.metadata.widgetData);  
    //Do not render widget if a suggestion is already selected
    renderWidget = (widgetData.selectedSuggestion == null) ? true : false;
  }
  return (
    <div>
      {defaultOnRender(messageProps)}
      { renderWidget && (
        <Form
          schema={widgetSchema}
          uiSchema={widgetUiSchema}
          formData={widgetData}
          onChange={onWidgetClick} //Not needed but left for reference
          onSubmit={onWidgetClick} //Not needed but left for reference
          validator={validator} //Not needed but left for reference
          widgets={{
            suggestions: (props) => (
              <SuggestionsControl {...props} messageProps={messageProps} onWidgetClick={onWidgetClick}/>
            ),
          }}
        >
          <div style={{ display: 'none' }}></div>
        </Form>
      )}
    </div>
  );
};

export default SuggestionWidget;