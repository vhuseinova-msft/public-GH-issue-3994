import React from "react";
import { TabBar } from "antd-mobile";
import { HomeOutlined, TeamOutlined, SearchOutlined, BarChartOutlined, UserOutlined } from "@ant-design/icons";
import { withRouter } from "react-router-dom";

/**
 * The icon styles for the non-selected and selected states of the tab bar icons.
 */
const iconNonSelectStyle = { fontSize: "22px" };
const iconSelectedStyle = { fontSize: "22px", color: "#33A3F4" };

/**
 * Array of tab configurations containing information about each tab item.
 * Each tab item contains the title, key, icon, selectedIcon, and the pathname to navigate to.
 */
const tabs = [
  {
    title: "Home",
    key: "",
    icon: <HomeOutlined style={iconNonSelectStyle} />,
    selectedIcon: <HomeOutlined style={iconSelectedStyle} />,
    pathname: "/"
  },
  {
    title: "Patient List",
    key: "Patients",
    icon: <TeamOutlined style={iconNonSelectStyle} />,
    selectedIcon: <TeamOutlined style={iconSelectedStyle} />,
    pathname: "/patients"
  },
  {
    title: "Employee List",
    key: "Employees",
    icon: <UserOutlined style={iconNonSelectStyle} />,
    selectedIcon: <UserOutlined style={iconSelectedStyle} />,
    pathname: "/employees"
  },
  {
    title: "Search",
    key: "Search",
    icon: <SearchOutlined style={iconNonSelectStyle} />,
    selectedIcon: <SearchOutlined style={iconSelectedStyle} />,
    pathname: "/search"
  },
  {
    title: "Statistics",
    key: "Statistics",
    icon: <BarChartOutlined style={iconNonSelectStyle} />,
    selectedIcon: <BarChartOutlined style={iconSelectedStyle} />,
    pathname: "/statistics"
  }
];

/**
 * A custom TabBar component that displays a fixed bottom navigation bar with tab items.
 * It uses the 'antd-mobile' TabBar component for rendering and navigation.
 *
 * @param {object} location - The location object from 'react-router-dom' containing the current URL pathname.
 * @param {object} history - The history object from 'react-router-dom' for programmatic navigation.
 */
const TabBarMenu = ({ location, history }) => {
  /**
   * Function to handle tab item selection and navigate to the corresponding path.
   *
   * @param {string} value - The key of the selected tab item.
   */
  const setRouteActive = (value) => {
    history.push(value);
  };

  return (
    <div style={{ position: "fixed", width: "100%", bottom: 0, zIndex: 900, borderTop: "solid 1px #717e91a1", background: "#001529" }}>
      <TabBar
        tabs={tabs}
        initialPage={tabs.findIndex((tab) => tab.pathname === location.pathname)}
        onChange={(value) => setRouteActive(value)}
      >
        {/* Render tab items */}
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  );
};

// Wrap the component with 'withRouter' to have access to the 'location' and 'history' props.
export default withRouter(TabBarMenu);
