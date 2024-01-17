import React, { useState } from 'react';
import {
  Form,
  Row,
  Col,
  Input,
  Button,
  DatePicker,
  Select,
  Checkbox,
  Tooltip,
} from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import { GlobalContext } from './GlobalContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SearchForm = (props) => {
  const [expand, setExpand] = useState(false);
  const [form] = Form.useForm();

  const context = React.useContext(GlobalContext);

  const onFinish = (values) => {
    props.searchRequest(values);
  };

  return (
    <Form
      form={form}
      style={{
        padding: '10px 20px 0px 16px',
      }}
      name="advanced_search"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Row gutter={25}>
        <Col xs={24} sm={24} md={12} lg={8} className="search_inputs" key={1}>
          <Form.Item
            label={`Patient Name`}
            name={`name`}
            rules={[
              { message: "Enter Patient's first or last name" },
            ]}
          >
            <Input placeholder="Enter Patient's first or last name to filter" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={8} className="search_inputs" key={2}>
          <Form.Item name="birthdate" label="Birthdate Range" colon={false}>
            <RangePicker />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={8} className="search_inputs" key={3}>
          <Form.Item name="gender" label="Gender" colon={false}>
            <Select placeholder="Select a gender to filter" allowClear>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
            </Select>
          </Form.Item>
        </Col>

        {expand && (
          <React.Fragment>
            <Col
              xs={24}
              sm={24}
              md={12}
              lg={8}
              className="search_inputs"
              key={4}
            >
              <Form.Item name={`phone`} label={`Phone number`} colon={false}>
                <Input placeholder="Enter phone number to filter" />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              sm={24}
              md={12}
              lg={8}
              className="search_inputs"
              key={5}
            >
              <Form.Item name={`address`} label={`Country code`} colon={false}>
                <Input placeholder="Enter country code to filter" />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              sm={24}
              md={12}
              lg={8}
              className="search_inputs"
              key={6}
            >
              <Form.Item
                name={`maritalStatus`}
                label={`Marital Status`}
                colon={false}
              >
                <Input placeholder="Enter marital status to filter" />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              sm={24}
              md={12}
              lg={8}
              className="search_inputs"
              key={7}
            >
              <Form.Item name={`id`} label={`Patient ID`} colon={false}>
                <Input placeholder="Enter Patient ID to filter" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={16}>
              <Form.Item
                name={'anythingElse'}
                label="Search for anything else"
                colon={false}
              >
                <Input.TextArea
                  placeholder="Just type anything you would like to search, you can search for Social Security Number, Driver's License, Passport Number, Ethics etc. Regular expression is supported."
                  autoSize={{ minRows: 3, maxRows: 5 }}
                />
              </Form.Item>
            </Col>
          </React.Fragment>
        )}
      </Row>

      <Row>
        <Col
          xs={24}
          sm={8}
          md={8}
          lg={8}
          span={8}
          style={{ textAlign: context.isMobile ? 'center' : 'left' }}
        >
          <Form.Item
            name={`exactMatch`}
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <Checkbox checked>
              <Tooltip
                placement={context.isMobile ? 'top' : 'right'}
                title="Match the exact content from the search query"
              >
                Exact Match
              </Tooltip>
            </Checkbox>
          </Form.Item>
        </Col>
        <Col
          xs={24}
          sm={16}
          md={16}
          lg={16}
          span={16}
          style={{ textAlign: context.isMobile ? 'center' : 'right' }}
        >
          <button
            style={{
              marginRight: 12,
              fontSize: 12,
              border: 'none',
              background: 'none',
              color: '#1677ff',
              cursor: 'pointer',
            }}
            onClick={() => {
              setExpand(!expand);
            }}
          >
            {expand ? <UpOutlined /> : <DownOutlined />} Search More
          </button>
          <Button htmlType="submit">Search</Button>
          <Button
            style={{
              marginLeft: 8,
            }}
            onClick={() => {
              form.resetFields();
              window.location.reload();
            }}
          >
            Clear
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchForm;
