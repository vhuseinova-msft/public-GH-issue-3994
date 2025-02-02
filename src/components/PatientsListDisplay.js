import React from "react";
import PatientCard from "./PatientCard";
import PatientTable from "./PatientTable";
import StartChat from "./chat/StartChat";
import CreateAccount from './CreateAccount'
import { Layout, Pagination, Row, Col, Result } from "antd";
import { GlobalContext } from "./GlobalContext";

const { Content } = Layout;

class PatientsListDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patientsDummy: [null, null, null, null, null, null, null, null, null],
      page: props.page ? props.page : 0,
      itemPerPage: 10,
      showDrawer: false,
      startChat: false,
      currentSelectedPatient: null
    };
  }

  static contextType = GlobalContext;

  viewPatientDrawer = patient => {
    this.setState({
      showDrawer: true,
      currentSelectedPatient: patient
    });
  };

  startChat = patient => {
    this.setState({
      startChat: true,
      currentSelectedPatient: patient
    });
  };
  
  onShowSizeChange = (current, pageSize) => {
    this.setState({
      itemPerPage: pageSize
    });
  };

  render() {
    let patients = this.props.patients ? this.props.patients : this.state.patientsDummy;

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
          total={patients && patients.length > 1 ? patients.length : 0}
          onChange={page => {
            this.setState({
              page: page - 1
            });
          }}
        />
      );

      let keyCounter = 0;

      // -------------------- card view
      let cardListItems = patients
        .slice(startIdx, startIdx + this.state.itemPerPage)
        .map(patient => (
          <Col xs={23} sm={23} md={12} lg={12} style={{ padding: "10px" }} key={keyCounter++}>
            <PatientCard
              patientData={patient && patient.resource}
              loading={this.props.loading}
              startChat={() => {
                this.startChat(patient);
              }}
              viewPatient={() => {
                this.viewPatientDrawer(patient);
              }}
            ></PatientCard>
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
        <PatientTable
          loading={this.props.loading}
          patientData={patients}
          startChat={patient => {
            this.startChat(patient)
          }}
          viewPatient={patient => {
            this.viewPatientDrawer(patient);
          }}
        ></PatientTable>
      );
      layout = tableLayout;
    }
    return (
      <div>
        
        {patients.length > 0 ? (
          <div>
            
            {layout}

            { this.state.showDrawer &&
              <CreateAccount
                patient={this.state.currentSelectedPatient}
                visible={this.state.showDrawer}
                onClose={() => {
                  this.setState({
                    currentSelectedPatient: null,
                    showDrawer: false
                  });
                }}
              >
              </CreateAccount>
            }

            { this.state.startChat && 
              <StartChat
                patient={this.state.currentSelectedPatient}
                open={this.state.startChat}
                onClose={() => {
                  this.setState({
                    currentSelectedPatient: null,
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

export default PatientsListDisplay;
