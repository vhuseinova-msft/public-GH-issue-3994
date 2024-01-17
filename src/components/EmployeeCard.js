import React, { Component } from 'react';
import { Card } from 'antd';
import { GlobalContext } from './GlobalContext';

class EmployeeCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
    };
  }

  static contextType = GlobalContext;

  render() {
    const { employeeData, loading } = this.props;

    const name =
      employeeData &&
      employeeData?.givenName + ' ' + employeeData?.familyName;

    return (
      <Card
        title={employeeData ? name : 'Loading...'}
        extra={
          <button
            style={{
              border: 'none',
              background: 'none',
              color: loading ? 'gray' : '#1677ff',
              cursor: loading ? 'default' : 'pointer',
              pointerEvents: loading ? 'none' : 'auto',
            }}
            onClick={this.props.startChat}
            disabled={loading}
          >
            Start Chat
          </button>
        }
        style={{
          width: this.context.isMobile ? '100%' : 'auto',
          margin: '5px',
        }}
        loading={loading}
        hoverable
      >
        {employeeData && (
          <div>
            <p>{employeeData.maritalStatus.text + ', ' + employeeData.gender}</p>
            <p>
              {employeeData.birthDate +
                ', ' +
                employeeData.communication[0].language.text}
            </p>
            <p>{employeeData.telecom.value}</p>
            <p>{employeeData.id}</p>
            <p>
              {employeeData.address[0].line[0] +
                ', ' +
                employeeData.address[0].country}
            </p>
            <p style={{ color: '#1677ff' }} onClick={this.props.viewPatient}>
              View Detail
            </p>
          </div>
        )}
      </Card>
    );
  }
}

export default EmployeeCard;
