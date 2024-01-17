import React, { Component } from 'react';
import { Table, Skeleton, message } from 'antd';
import { parseAllPatientData } from '../services/fhirApi';
import axios from 'axios';

class PatientTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tableData: null,
    };
  }

  updatePatients = () => {
    if (this.props.patientData != null && this.props.patientData[0] != null) {
      this.setState({
        tableData: this.updatePatientArray(this.props.patientData),
      });
    }
  };

  componentDidUpdate = (lastProp) => {
    if (lastProp !== this.props) this.updatePatients();
  };

  componentDidMount = (prop) => {
    this.updatePatients();
  };

  updatePatientArray = (patients) => {
    return parseAllPatientData(patients);
  };

  clearChat = (obj) => {
    axios.delete(`https://patient-service-summary-3.calmbay-07fbcdc7.eastus.azurecontainerapps.io/acs-user/${obj.resource.id}`)
    .then((response) => {
      message.success(response.data.message);
    })
    .catch(error => {
      message.error(error.response.data.error);
    });
  }
  

  render() {
    const { loading } = this.props;

    if (loading) {
      return (
        <div style={{ padding: '30px' }}>
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
        </div>
      );
    }

    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        width: 180,
        sorter: (a, b) => a.name.localeCompare(b.name),
        fixed: 'left',
      },
      {
        title: 'Chat',
        dataIndex: 'raw',
        key: 'raw',
        width: 70,
        render: (obj) => (
          <button
            style={{
              border: 'none',
              background: 'none',
              color: '#1677ff',
              cursor: 'pointer',
            }}
            onClick={() => {
              this.props.startChat(obj);
            }}
          >
            Start
          </button>
        ),
        fixed: 'left',
      },
      {
        title: 'Portal',
        dataIndex: 'raw',
        key: 'raw',
        width: 80,
        render: (obj) => (
          <button
            style={{
              border: 'none',
              background: 'none',
              color: '#1677ff',
              cursor: 'pointer',
            }}
            onClick={() => {
              this.props.viewPatient(obj);
            }}
          >
            Account
          </button>
        ),
        fixed: '',
      },
      {
        title: 'Chat',
        dataIndex: 'raw',
        key: 'raw',
        width: 80,
        render: (obj) => (
          <button
            style={{
              border: 'none',
              background: 'none',
              color: '#1677ff',
              cursor: 'pointer',
            }}
            onClick={() => {
              this.clearChat(obj);
            }}
          >
            Clear
          </button>
        ),
        fixed: '',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        width: 300,
        sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
      },
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        ellipsis: true,
        width: 330,
        sorter: (a, b) => (a.id || '').localeCompare(b.id || ''),
      },
      {
        title: 'Age',
        dataIndex: 'age',
        key: 'age',
        ellipsis: true,
        width: 80,
        sorter: (a, b) => (a.age || 0) - (b.age || 0), 
      },
      {
        title: 'Gender',
        dataIndex: 'gender',
        key: 'gender',
        ellipsis: true,
        width: 100,
        sorter: (a, b) => (a.gender || '').localeCompare(b.gender || ''),
      },
      {
        title: 'Birth Date',
        dataIndex: 'birthDate',
        key: 'birthDate',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''),
      },
      {
        title: 'language',
        dataIndex: 'language',
        key: 'language',
        ellipsis: true,
        sorter: (a, b) => (a.language || '').localeCompare(b.language || ''),
      },
      {
        title: 'Marital Status',
        dataIndex: 'maritalStatus',
        key: 'maritalStatus',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => (a.maritalStatus || '').localeCompare(b.maritalStatus || ''),
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => (a.phone || '').localeCompare(b.phone || ''),
      },      
    ];

    return (
      <Table
        columns={columns}
        pagination={{
          position: ['bottomCenter'],
        }}
        dataSource={this.state.tableData}
        rowKey="id"
        scroll={{
          x: 1500,
        }}
      />
    );
  }
}

export default PatientTable;