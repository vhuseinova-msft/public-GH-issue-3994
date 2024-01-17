import React from "react";
import EmployeeListDisplay from "../components/EmployeeListDisplay";
import Header from "../components/Header";
import Overlay from "../components/Overlay";
import { getPatientList } from "../services/fhirApi";
// import axios from "axios";
import { message } from "antd";
import Employees from "../config/copilot-employees.json"

const moment = require("moment");

class EmployeesPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      awaitingData: true,
      employees: null,
      page: 0,
      patients: null
    };
  }

  async componentDidMount() {
    let json = await getPatientList(message);
    this.setState({
      patients: json
    })
    this.getEmployees() 
  }

  async getEmployees() {
    //const endpoint = "https://cors-anywhere.herokuapp.com/https://api-beta.copilot.com/v1/clients" // Only for Development
    // const endpoint = "https://api-beta.copilot.com/v1/clients"
    // axios.get(endpoint, {
    //         headers: {
    //             "accept": "application/json",
    //             "X-API-KEY": "iuZCAPkbZO16fM8mTKwMU68yPmtuqJAq6ZJqS5HA"
    //         }
    //     }).then(response => {
          
    //     }).catch(err => {
    //         console.log(err)
    //     })
    let employees = Employees.data
    employees = employees?.filter(x => {
      return x?.companyId === "be25bb51-3366-4474-b0f3-e8efccc0af05" || x?.companyId === "50114cf4-f3c9-45a7-b9a4-57fdb9e0a9e4"
    })
    for(let i = 0; i < employees?.length; i++) {
      const patientIndex = this.state.patients.findIndex(x => x?.resource?.id === employees[i]?.customFields?.guid)
      employees[i].resource = this.state.patients[patientIndex < 0 ? 0 : patientIndex]?.resource
    }
    this.setState({
      awaitingData: false,
      employees: employees
    });
  }

  render() {
    let employeeData = this.state.employees;
    if (this.props.filter && this.state.employees) {
      employeeData = doFilter(this.state.employees, this.props.filter);
    }
    return (
      <div>
        <Overlay show={this.state.awaitingData}></Overlay>
        {!this.props.filter && <Header title="Employee List"></Header>}
        <EmployeeListDisplay employees={employeeData} loading={this.state.awaitingData} />
      </div>
    );
  }
}

function recursiveFind(obj, value, exact) {
  let json = JSON.stringify(obj);
  const regex = exact
    ? new RegExp('"' + value.toLowerCase() + '"', "g")
    : new RegExp(".*" + value.toLowerCase() + ".*", "g");
  return json.toLowerCase().search(regex) !== -1;
}

function doFilter(patients, filter) {
  let result = [];
  for (let patient of patients) {
    let data = patient.resource;
    let match = [];
    if (filter.name) {
      match.push(recursiveFind(data.name, filter.name, filter.exactMatch));
    }
    if (filter.birthdate) {
      let isWithIn =
        filter.birthdate[0] <= moment(data.birthDate) &&
        moment(data.birthDate) <= filter.birthdate[1];
      match.push(isWithIn);
    }
    if (filter.gender) {
      match.push(data.gender === filter.gender);
    }
    if (filter.phone) {
      match.push(recursiveFind(data.telecom, filter.phone, filter.exactMatch));
    }
    if (filter.address) {
      match.push(recursiveFind(data.address, filter.address, filter.exactMatch));
    }
    if (filter.maritalStatus) {
      match.push(recursiveFind(data.maritalStatus, filter.maritalStatus, filter.exactMatch));
    }
    if (filter.id) {
      match.push(recursiveFind(data.id, filter.id, filter.exactMatch));
    }
    if (filter.anythingElse) {
      match.push(recursiveFind(data, filter.anythingElse, filter.exactMatch));
    }

    // result
    if (match.every(x => x === true)) {
      result.push(patient);
    }
  }
  console.log(result);
  return result;
}

export default EmployeesPage;
