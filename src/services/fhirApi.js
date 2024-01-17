let patientListDemo = require("./patientDemoData.json");
let observationDemo = require("./observationDemoData.json");

const SERVER_URL = `https://patient-service-summary-3.calmbay-07fbcdc7.eastus.azurecontainerapps.io/`;

const moment = require("moment");

const getPatientDemo = () => {
  return combinePatientsBundle(patientListDemo);
};

const getObservationDemo = () => {
  return combinePatientsBundle(observationDemo);
};

function combinePatientsBundle(json) {
  let result = [];
  for (let bundle of json) {
    result = result.concat(bundle.entry);
  }
  return result;
}

function requestObservation(id) {
  return new Promise((resolve, reject) => {
    fetch(SERVER_URL + "observation?GUID=" + id)
      .then(async res => {
        let json = await res.json();
        
        json = combinePatientsBundle(json);
        resolve(json);
      })
      .catch(e => {
        reject(e);
      });
  });
}

function requestPatientList() {
  return new Promise((resolve, reject) => {
    let localCache = localStorage.getItem("patients");
    if (localCache) {
      setTimeout(() => {
        resolve(JSON.parse(localCache));
      }, 1000);
    } else {
      fetch(SERVER_URL + "patients")
        .then(async res => {
          let json = await res.json();
          json = combinePatientsBundle(json);
          localStorage.setItem("patients", JSON.stringify(json));
          resolve(json);
        })
        .catch(e => {
          reject(e);
        });
    }
  });
}

function getPatientList(message) {
  return new Promise(async resolve => {
    let json = null;
    if (window.$globalPatients) {
      json = window.$globalPatients;
    } else {
      // start load api, show loading
      const hideLoading = message.loading("Please wait, fetching patient data...", 0);
      try {
        json = await requestPatientList();
        message.success({ content: "Patient data loaded!", duration: 2 });
      } catch (e) {
        json = getPatientDemo();
        message.warn({
          content: "Network Error, the server might be down. Local demo data is loaded.",
          duration: 5
        });
      }
      window.$globalPatients = json;
      hideLoading();
    }
    resolve(json);
  });
}

function parseAllPatientData(patients) {
  const tableData = [];
  patients.forEach(elementRaw => {
    if (!elementRaw) {
      return null;
    }
    let element = elementRaw.resource;
    const emailIndex = element.telecom?.findIndex(item => item.system === 'email');
    const phoneIndex = element.telecom?.findIndex(item => item.system === 'phone');
    
    let patient = {};
    
    patient.name = element.name?.[0]?.given?.[0] + " " + element.name?.[0]?.family;
    patient.id = element.id;
    //Todo: add phone and email separately. They will both be in element.telecom.
    //Todo: study the JSON in medplum to understand how email and phone are stored.
    patient.phone = phoneIndex !== -1 ? element.telecom?.[`${phoneIndex}`]?.value : "";
    patient.email = emailIndex !== -1 ? element.telecom?.[`${emailIndex}`]?.value : "";
    patient.language = element.communication?.[0]?.language?.text;
    patient.maritalStatus = element.maritalStatus?.text;
    patient.address = element.address?.[0]?.line[0];
    patient.city = element.address?.[0]?.city;
    patient.state = element.address?.[0]?.state;
    patient.country = element.address?.[0]?.country;
    patient.gender = element.gender;
    patient.birthDate = element.birthDate;
    patient.birthMonth = moment(element.birthDate).format("MMMM");
    patient.age = moment().diff(element.birthDate, "years");
    patient.raw = elementRaw;
    tableData.push(patient);
  });

  return tableData;
}

function parseAllEmployeeData(employees) {
  const tableData = [];
  employees?.forEach(employee => {
    if (!employee) {
      return null;
    }
    let emp = {};
    emp.name = employee?.givenName + " " + employee?.familyName;
    emp.id = employee?.customFields?.guid ?? employee?.id;
    emp.email = employee.email;
    emp.facility = employee?.companyId === "50114cf4-f3c9-45a7-b9a4-57fdb9e0a9e4" ? "Sunrise Senior Living - Santa Monica" : "San Diego Post-Acute Center"
    emp.title = employee?.customFields?.title;
    emp.raw = employee;
    tableData.push(emp);
   });

    return tableData;
}

export {
  requestPatientList,
  requestObservation,
  getPatientDemo,
  getObservationDemo,
  parseAllPatientData,
  parseAllEmployeeData,
  getPatientList
};
