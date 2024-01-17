"use client";
import React from 'react';
import './App.css';
import 'antd/dist/reset.css';
import PatientPage from '../routes/patients';
import EmployeePage from '../routes/employees';
import SearchPage from '../routes/search';
import StatisticsPage from '../routes/statistics';
import NotFoundPage from '../routes/NotFoundPage';
import HomePage from '../routes/home';
import SideMenu from '../components/SideMenu';
import MobileTabBar from '../components/MobileTabBar';
import Environment from '../components/Environment';

import logo from '../assets/relic-care-logo-white.png';
import icon from '../assets/icon.png';

import {
  UnorderedListOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

import { TransitionGroup, CSSTransition } from 'react-transition-group';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';

import {
  Layout,
  Popconfirm,
  Radio,
  Tooltip,
  message,
  Button,
} from 'antd';

import {
  GlobalContext,
  GlobalContextConsumer,
  GlobalContextProvider,
} from '../components/GlobalContext';

const { Header, Sider, Footer, Content } = Layout;

class DesktopMenu extends React.Component {
  state = {
    collapsed: false,
  };

  updateCollapsed = (collapsed) => {
    this.setState({
      collapsed: collapsed,
    });
  };

  componentDidMount() {
    message.config({
      top: 80,
    });
  }

  render() {
    return (
      <Sider
        collapsible
        onCollapse={this.updateCollapsed}
        breakpoint="lg"
        width={230}
        style={{
          boxShadow: '7px 0px 20px -10px rgba(0,0,0,0.35)',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 1000,
        }}
      >
        <Link to="/">
          <div
            className="logo"
            style={{
              background: `url("${
                this.state.collapsed ? icon : logo
              }") no-repeat`,
            }}
          ></div>
        </Link>
        <SideMenu />
        <div style={{ flexGrow: 1 }}></div>
      </Sider>
    );
  }
}

const routes = [
  {
    path: '/',
    exact: true,
    title: () => 'Home',
    main: () => <HomePage />,
  },
  {
    path: '/patients',
    title: () => 'Patient List',
    main: () => <PatientPage />,
  },
  {
    path: '/employees',
    title: () => 'Employee List',
    main: () => <EmployeePage />,
  },
  {
    path: '/search',
    title: () => 'Search',
    main: () => <SearchPage />,
  },
  {
    path: '/statistics',
    title: () => 'Statistics',
    main: () => <StatisticsPage />,
  },
  {
    title: () => '404 Not Found',
    main: () => <NotFoundPage />,
  },
];

class App extends React.Component {
  static contextType = GlobalContext;
  handleViewChange = (value) => {
    const { setViewInCard } = this.context;
    setViewInCard(value === 'card');
  };

  render() {
    const basename =
      window.location.hostname === 'henryz00.github.io'
        ? 'GOSH-FHIRworks2020-React-Dashboard/#/'
        : '';

    return (
      <Router basename={basename}>
        <Layout hasSider style={{ minHeight: '100vh' }}>
          <GlobalContextConsumer>
            {(value) => {
              if (!value.isMobile) {
                return <DesktopMenu></DesktopMenu>;
              } else {
                return <MobileTabBar></MobileTabBar>;
              }
            }}
          </GlobalContextConsumer>

          <Layout className="site-layout">
            <Header className="site-layout-header">
              <h2 style={{ paddingLeft: 20 + 'px' }}>
                <Switch>
                  {routes.map((route, index) => (
                    <Route
                      key={index}
                      path={route.path}
                      exact={route.exact}
                      children={<route.title />}
                    />
                  ))}
                </Switch>
              </h2>

              <div
                style={{
                  flexGrow: 1,
                  textAlign: 'right',
                  paddingRight: '20px',
                }}
              >
                <GlobalContextProvider>
                  <Radio.Group
                    defaultValue="table"
                    onChange={(e) => {
                      this.handleViewChange(e.target.value);
                    }}
                    size="small"
                  >
                    <Radio.Button value="table">
                      <Tooltip
                        placement="bottom"
                        title="View patients in a table"
                      >
                        <UnorderedListOutlined />
                      </Tooltip>
                    </Radio.Button>
                    <Radio.Button value="card">
                      <Tooltip
                        placement="bottom"
                        title="View patients in cards"
                      >
                        <AppstoreOutlined />
                      </Tooltip>
                    </Radio.Button>
                  </Radio.Group>
                </GlobalContextProvider>
                <Environment />
              </div>
            </Header>
            <Layout>
              <Content style={{ overflowY: 'auto' }}>
                <GlobalContextProvider>
                  <RouterContent />
                </GlobalContextProvider>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    );
  }
}

const RouterContent = () => {
  let location = useLocation();
  return (
    <TransitionGroup>
      <CSSTransition key={location.key} classNames="page" timeout={300}>
        <Switch location={location}>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              children={
                <div className="container">
                  <div className="page">
                    <route.main />
                    <FhirFooter />
                  </div>
                </div>
              }
            />
          ))}
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
};

const FhirFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }} className="footer">
      <a href="https://reliccare.com">Relic Care Playground</a>
      <div style={{ opacity: 0.5, margin: "10px 0"}}>
        Using{' '}
        <a href="https://www.hl7.org/fhir/" style={{ color: 'black' }}>
          HL7 FHIR
        </a>{' '}
        Standards,{' '}
        <a href="https://cs.ucl.ac.uk" style={{ color: 'black' }}>
          UCL CS
        </a>{' '}
        <a
          href="https://github.com/henryz00/GOSH-FHIRworks2020-React-Dashboard"
          style={{ color: 'black' }}
        >
          COMP0016 Project
        </a>{' '}
        for GOSH DRIVE and NHS England
      <div style={{ margin: "10px 0"}}>
        <Popconfirm
            title="Clear local storage"
            description="Are you sure you want to clear local FHIR data cache?"
            onConfirm={() => {
              window.$globalPatients = null;
              localStorage.removeItem("patients");
              message.success("Local data cache cleared");
            }}
            style={{ opacity: 0.5, padding: "10px 0"}}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>
              Click here to clear local FHIR data cache
            </Button>
        </Popconfirm>
     </div>
    </div>
  </Footer>
  );
};

export default App;
