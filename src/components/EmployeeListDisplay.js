import React from "react";
import EmployeeCard from "./EmployeeCard";
import StartChat from "./chat/StartChat";
import ObservationDrawer from './ObservationDrawer';
import { Layout, Pagination, Row, Col, Result } from "antd";
import { GlobalContext } from "./GlobalContext";
import EmployeeTable from "./EmployeeTable";

const { Content } = Layout;

class EmployeeListDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      employeesDummy: [null, null],
      page: props.page ? props.page : 0,
      itemPerPage: 10,
      showDrawer: false,
      startChat: true,
      currentSelectedEmployee: null
    };
  }

  static contextType = GlobalContext;

  viewEmployeeDrawer = employee => {
    this.setState({
      showDrawer: true,
      currentSelectedEmployee: employee
    });
  };

  startChat = employee => {
    this.setState({
      startChat: true,
      currentSelectedEmployee: employee
    });
  };
  
  onShowSizeChange = (current, pageSize) => {
    this.setState({
      itemPerPage: pageSize
    });
  };

  render() {
    let employees = this.props.employees ? this.props.employees : this.state.employeesDummy;

    let layout;
    if (this.context.viewInCard) {
      let startIdx = this.state.page * this.state.itemPerPage;

      let pagination = (
        <Pagination
          style={{ textAlign: "center" }}
          disabled={this.props.loading}
          defaultCurrent={1}
          onShowSizeChange={this.onShowSizeChange}
          defaultPageSize={this.state.itemPerPage}
          current={this.state.page + 1}
          total={employees && employees.length > 1 ? employees.length : 0}
          onChange={page => {
            this.setState({
              page: page - 1
            });
          }}
        />
      );

      let keyCounter = 0;

      // -------------------- card view
      let cardListItems = employees
        .slice(startIdx, startIdx + this.state.itemPerPage)
        .map(employee => (
          <Col xs={23} sm={23} md={12} lg={12} style={{ padding: "10px" }} key={keyCounter++}>
            <EmployeeCard
              employeeData={employee && employee?.resource}
              loading={this.props.loading}
              startChat={() => {
                this.startChat(employee);
              }}
              viewPatient={() => {
                this.viewEmployeeDrawer(employee);
              }}
            ></EmployeeCard>
          </Col>
        ));

      const cardLayout = (
        <div>
          <Content
            style={{
              margin: "0px 16px"
            }}
          >
            <Row>{cardListItems}</Row>
          </Content>
          {pagination}
        </div>
      );
      layout = cardLayout;
    } else {
      // ---------------------------- Table view
      const tableLayout = (
        <EmployeeTable
          loading={this.props.loading}
          employeeData={employees}
          startChat={employee => {
            this.startChat(employee)
          }}
          viewPatient={employee => {
            this.viewEmployeeDrawer(employee);
          }}
        ></EmployeeTable>
      );
      layout = tableLayout;
    }
    return (
      <div>
        
        {employees.length > 0 ? (
          <div>
            
            {layout}

            { this.state.showDrawer &&
              <ObservationDrawer
                patient={this.state.currentSelectedEmployee}
                visible={this.state.showDrawer}
                onClose={() => {
                  this.setState({
                    currentSelectedPatient: null,
                    showDrawer: false
                  });
                }}
              >
              </ObservationDrawer>
            }

            { this.state.startChat && 
              <StartChat
                patient={this.state.currentSelectedEmployee}
                open={this.state.startChat}
                onClose={() => {
                  this.setState({
                    currentSelectedEmployee: null,
                    startChat: false
                  });
                }}
              />
            }

          </div>
        ) : (
          <Result title="No search result to display" subTitle="You can try a different keyword" />
        )}
      </div>
    );
  }
}

export default EmployeeListDisplay;
