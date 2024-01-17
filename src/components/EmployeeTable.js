import React, { Component } from 'react';
import { Table, Skeleton } from 'antd';
import { parseAllEmployeeData } from '../services/fhirApi';

class EmployeeTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tableData: null,
    };
  }

  updateEmployees = () => {
    if (this.props.employeeData != null) {
      this.setState({
        tableData: parseAllEmployeeData(this.props?.employeeData),
      });
    }
  };

  componentDidUpdate = (lastProp) => {
    if (lastProp !== this.props) this.updateEmployees();
  };

  componentDidMount = (prop) => {
    this.updateEmployees();
  };

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
        width: 120,
        sorter: (a, b) => a?.name?.localeCompare(b.name),
        fixed: 'left',
      },
      {
        title: 'Start Chat',
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
              this.props.startChat(obj);
            }}
          >
            Start Chat
          </button>
        ),
        fixed: 'left',
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        width: 180,
        sorter: (a, b) => a?.title.localeCompare(b?.title),
      },
      {
        title: 'Facility',
        dataIndex: 'facility',
        key: 'facility',
        ellipsis: true,
        width: 220,
        sorter: (a, b) => a?.facility.localeCompare(b?.facility),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        width: 180,
        sorter: (a, b) => a?.email.localeCompare(b?.email),
      },
      {
        title: 'GUID',
        dataIndex: 'id',
        key: 'id',
        ellipsis: true,
        width: 330,
        sorter: (a, b) => a?.id.localeCompare(b?.id),
      }
    ];

    return (
      <Table
        columns={columns}
        pagination={{
          position: ['bottomCenter'],
        }}
        dataSource={this.state?.tableData}
        rowKey="id"
        scroll={{
          x: 2000,
        }}
      />
    );
  }
}

export default EmployeeTable;
