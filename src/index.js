import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import * as serviceWorker from './serviceWorker';

import { GlobalContextProvider } from './components/GlobalContext';

class Site extends React.Component {
  render() {
    return (
      <GlobalContextProvider value="what">
        <App />
      </GlobalContextProvider>
    );
  }
}

ReactDOM.render(
    <Site />,
  document.getElementById('root')
);
//const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
