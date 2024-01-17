import React, { useState, useEffect, useContext } from 'react';
import {
  requestObservation,
  getObservationDemo
} from '../services/fhirApi';
import { Drawer, Descriptions, message } from 'antd';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { GlobalContext } from './GlobalContext';

const keyGen = () => {
  let r = Math.random().toString(36).substring(7);
  return r;
};

// const findValueKey = (observation) => {
//   let key,
//     keys = [];
//   let filter = new RegExp('value.*|component', 'g');
//   for (key in observation)
//     if (observation.hasOwnProperty(key) && filter.test(key)) keys.push(key);
//   return keys[0];
// };

const ObservationDrawer = (props) => {
  const context = useContext(GlobalContext);
  const [loading, setLoading] = useState(true);
  const [observation, setObservation] = useState(null);
  const [rawDataDrawer, setRawDataDrawer] = useState(false);
  const [rawDataDrawerData, setRawDataDrawerData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (props.patient && !observation) {
        try {
          const json = await requestObservation(props.patient.resource.id);
          console.log("json", json);
          setObservation(json);
        } catch (e) {
          const json = getObservationDemo();
          message.warn({
            content:
              'Network Error, the server might be down. Local demo data is loaded.',
            duration: 2,
          });
          setObservation(json);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [props.patient, observation]);

  const onClose = () => {
    setLoading(true);
    setObservation(null);
    props.onClose();
  };

  const onChildrenDrawerClose = () => {
    setRawDataDrawer(false);
  };

  const openRawDataDrawer = (data) => {
    setRawDataDrawerData(data);
    setRawDataDrawer(true);
  };

  const ViewRawBtn = (props) => {
    return (
      <div style={{ margin: 'auto', textAlign: 'center', padding: '10px 0' }}>
        <button
          style={{
            border: 'none',
            background: 'none',
            color: loading ? 'gray' : '#1677ff',
            cursor: loading ? 'default' : 'pointer',
            pointerEvents: loading ? 'none' : 'auto',
          }}
          onClick={() => {
            openRawDataDrawer(props.object);
          }}
          disabled={loading}
        >
          View Raw FHIR Data
        </button>
      </div>
    );
  };

  const patient = props.patient && props.patient.resource;

  // let observations =
  //   observation &&
  //   observation.map((entry) => {
  //     let obs = entry.resource;
  //     let valueKey = findValueKey(obs);
  //     let valueItems;
  //     if (valueKey) {
  //       valueItems = Object.keys(obs[valueKey]).map((key) => {
  //         if (key === 'coding' || key === 'system' || key === 'code') return null;
  //         const value = obs[valueKey][key] + '';
  //         return (
  //           <Descriptions.Item key={keyGen()} label={key}>
  //             {value}
  //           </Descriptions.Item>
  //         );
  //       });

  //       if (valueKey === 'component') {
  //         valueItems = obs.component.map((blood) => {
  //           return (
  //             <Descriptions.Item key={keyGen()} label={blood.code?.text}>
  //               {blood.valueQuantity?.value + ' ' + blood.valueQuantity?.unit}
  //             </Descriptions.Item>
  //           );
  //         });
  //       }
  //     }
  //     return (
  //       <div key={keyGen()} style={{ wordBreak: 'break-all' }}>
  //         <Descriptions
  //           bordered={true}
  //           layout={context.isMobile ? 'horizontal' : 'vertical'}
  //           key={keyGen()}
  //           title={obs.code.text}
  //           column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
  //         >
  //           <Descriptions.Item key={keyGen()} label="ID">
  //             {obs.id}
  //           </Descriptions.Item>
  //           {valueItems}
  //           <Descriptions.Item key={keyGen()} label="Category">
  //             {obs.category?.[0]?.coding?.[0].display}
  //           </Descriptions.Item>
  //           <Descriptions.Item key={keyGen()} label="issued">
  //             {obs.issued}
  //           </Descriptions.Item>
  //           <Descriptions.Item key={keyGen()} label="effectiveDateTime">
  //             {obs.effectiveDateTime}
  //           </Descriptions.Item>
  //         </Descriptions>

  //         <ViewRawBtn object={obs}></ViewRawBtn>
  //       </div>
  //     );
  //   });

  return (
    <Drawer
      title="Patient Observation"
      placement="right"
      closable={true}
      onClose={onClose}
      open={props.visible}
      width={context.isMobile ? '100%' : '60%'}
      styles={{ body: { padding: '0 10px' } }}
    >
      {patient && (
        <div key={keyGen()}>
          <Descriptions title="Patient Basic Info">
            <Descriptions.Item key={keyGen()} label="Name">
              {patient.name ? `${patient?.name[0]?.family} ${patient?.name[0]?.given?.[0]} (${patient?.name[0]?.prefix?.[0]})` : "Patient name not available" }
            </Descriptions.Item>
            <Descriptions.Item key={keyGen()} label="ID">
              {patient.id ?  patient.id : "Not available"}
            </Descriptions.Item>
            <Descriptions.Item key={keyGen()} label="Telephone">
              {patient.telecom ?  patient?.telecom[0]?.value : "Not available"}
            </Descriptions.Item>
            <Descriptions.Item key={keyGen()} label="Birth Date">
              {patient.birthDate ?  patient.birthDate : "Not available"}
            </Descriptions.Item>
            <Descriptions.Item key={keyGen()} label="Address">
              {patient.address ? `${patient?.address[0]?.line[0]}, ${patient?.address[0]?.city}, ${patient?.address[0]?.state}, ${patient?.address[0]?.country}` : "Not available" }
            </Descriptions.Item>
          </Descriptions>
          <ViewRawBtn object={patient}></ViewRawBtn>
          {/* Skipping observations as we don't have observation api on medplum */}
          {/* {observations ? (
            observations
          ) : (
            <div>
              <Skeleton active />
              <Skeleton active />
              <Skeleton active />
              <Skeleton active />
              <Skeleton active />
            </div>
          )} */}
        </div>
      )}

      <Drawer
        title="Raw FHIR Data"
        width={context.isMobile ? '100%' : '50%'}
        closable={true}
        onClose={onChildrenDrawerClose}
        open={rawDataDrawer}
      >
        <JsonView
          data={rawDataDrawerData}
          shouldInitiallyExpand={(level) => true}
          style={defaultStyles}
        />
      </Drawer>
    </Drawer>
  );
};

export default ObservationDrawer;