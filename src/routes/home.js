import React from "react";
import "./home.css";
import icon_user from "../assets/icon_user.png";
import icon_search from "../assets/icon_search.png";
import icon_stats from "../assets/icon_stats.png";
import icon_employee from "../assets/icon_employee.png";
import Header from "../components/Header";

import { withRouter } from "react-router-dom";

class HomePage extends React.Component {
  render() {
    const { history } = this.props;
    return (
      <div>
        <Header title="Playground Dashboard" isHome="true"></Header>
        <div className="center_float">
          <div
            className="menu_card"
            onClick={() => {
              history.push("/patients");
            }}
          >
            <img src={icon_user} alt="user" />
            <div className="text">Patient List</div>
          </div>
          <div
            className="menu_card"
            onClick={() => {
              history.push("/employees");
            }}
          >
            <img src={icon_employee} alt="user" />
            <div className="text">Employee List</div>
          </div>
          <div
            className="menu_card"
            onClick={() => {
              history.push("/search");
            }}
          >
            <img src={icon_search} alt="user" />
            <div className="text">Search</div>
          </div>
          <div
            className="menu_card"
            onClick={() => {
              history.push("/statistics");
            }}
          >
            <img src={icon_stats} alt="user" />
            <div className="text">Statistics</div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(HomePage);
