import React from "react";
import { Menu } from "antd";
import { useHistory, useLocation } from "react-router-dom";
import { HomeOutlined, TeamOutlined, UserOutlined, SearchOutlined, BarChartOutlined } from "@ant-design/icons";

const SideMenu = () => {
  const location = useLocation();
  const history = useHistory();
  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: "Home", link: "/" },
    { key: "/patients", icon: <TeamOutlined />, label: "Patient List", link: "/patients" },
    { key: "/employees", icon: <UserOutlined />, label: "Employee List", link: "/employees" },
    { key: "/search", icon: <SearchOutlined />, label: "Search", link: "/search" },
    { key: "/statistics", icon: <BarChartOutlined />, label: "Statistics", link: "/statistics" },
  ];
  
  const onClick = (e) => {
    history.push(e.key);
  };

  return (
    <Menu
      theme="dark"
      mode="inline"
      style={{
        height: '100%',
        borderRight: 0,
      }}
      onClick={onClick}
      defaultSelectedKeys={["/"]}
      selectedKeys={[location.pathname]}
      items={menuItems}
    >
    </Menu>
  );
};

export default SideMenu;
