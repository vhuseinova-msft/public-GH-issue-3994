import React from "react";
import PatientsListDisplay from "../components/PatientsListDisplay";
import { getPatientList } from "../services/fhirApi";
import Header from "../components/Header";
import Overlay from "../components/Overlay";
import { message } from "antd";

const moment = require("moment");

class PatientsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      awaitingData: true,
      patients: null,
      page: 0
    };
  }

  async componentDidMount() {
    const json = await getPatientList(message);

    this.setState({
      awaitingData: false,
      patients: json
    });
  }

  render() {
    let patientData = this.state.patients;
    if (this.props.filter && this.state.patients) {
      patientData = doFilter(this.state.patients, this.props.filter);
    }
    return (
      <div>
        <Overlay show={this.state.awaitingData}></Overlay>
        {!this.props.filter && <Header title="Patient List"></Header>}
        <PatientsListDisplay patients={patientData} loading={this.state.awaitingData} />
      </div>
    );
  }
}

function recursiveFind(obj, value, exact) {
  if (Array.isArray(obj) && obj.length > 0 && obj[0].given && obj[0].family) {
    const fullName = obj[0].given.join(" ") + " " + obj[0].family;
    const searchString = value.toLowerCase();

    if (exact) {
      return fullName.toLowerCase().includes(searchString);
    } else {
      const regex = new RegExp(searchString.split('').join('.*'), "g");
      return fullName.toLowerCase().search(regex) !== -1;
    }
  }

  return false;
}




function doFilter(patients, filter) {
  const result = [];
  for (let patient of patients) {
    const data = patient.resource;
    const match = [];
    if (filter.name) {
      match.push(recursiveFind(data.name, filter.name, filter.exactMatch));
    }
    if (filter.birthdate) {
      const isWithIn =
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

export default PatientsPage;
