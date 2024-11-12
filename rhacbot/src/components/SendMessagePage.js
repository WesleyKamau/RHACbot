// src/components/SendMessagePage.jsx
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Upload,
  TreeSelect,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { sendMessage } from '../api';
import buildings from '../buildings.json'; // Import the buildings data

const { Title } = Typography;
const { TextArea } = Input;

function SendMessagePage() {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedValues, setSelectedValues] = useState([]);
  const [file, setFile] = useState(null); // Track selected file
  const [preview, setPreview] = useState(''); // Track preview URL

  // Organize buildings by region
  const buildingsByRegion = buildings.reduce((acc, building) => {
    const region = building.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(building);
    return acc;
  }, {});

  // Generate tree data for TreeSelect
  const treeData = [
    {
      title: 'All Regions',
      value: 'region-all',
      children: Object.entries(buildingsByRegion).map(
        ([regionName, regionBuildings]) => ({
          title: regionName,
          value: `region-${regionName}`,
          children: regionBuildings.map((building) => ({
            title: building.name,
            value: building.id.toString(),
          })),
        })
      ),
    },
  ];

  const handleLogin = (values) => {
    const { password } = values;
    if (password === process.env.REACT_APP_EXECUTIVE_PASSWORD) {
      setAuthenticated(true);
    } else {
      message.error('Incorrect password');
    }
  };

  const handleFileChange = ({ fileList }) => {
    if (fileList.length > 0) {
      const latestFile = fileList[fileList.length - 1].originFileObj;
      setFile(latestFile);
      setPreview(URL.createObjectURL(latestFile)); // Generate preview URL
    } else {
      setFile(null);
      setPreview('');
    }
  };

  const handleSubmit = async (values) => {
    const { message_body } = values;

    const formData = new FormData();
    formData.append('password', password);
    formData.append('message_body', message_body);
    if (file) {
      formData.append('image_file', file);
    }

    const regions = new Set();
    const buildingIds = new Set();

    // Process selected values to separate regions and building IDs
    const processSelectedValues = (values) => {
      values.forEach((value) => {
        if (value === 'region-all') {
          regions.add('all');
          buildings.forEach((building) => {
            buildingIds.add(building.id.toString());
          });
        } else if (value.startsWith('region-')) {
          const regionName = value.replace('region-', '');
          regions.add(regionName);
          buildingsByRegion[regionName].forEach((building) => {
            buildingIds.add(building.id.toString());
          });
        } else {
          buildingIds.add(value);
        }
      });
    };

    processSelectedValues(selectedValues);

    // Append regions to formData
    regions.forEach((region) => {
      formData.append('regions', region);
    });

    // Append building IDs to formData
    buildingIds.forEach((id) => {
      formData.append('building_ids', id);
    });

    if (buildingIds.size === 0) {
      message.error('Please select at least one region or building');
      return;
    }

    try {
      const response = await sendMessage(formData);
      message.success(response.data.message);
      form.resetFields();
      setSelectedValues([]);
      setFile(null);
      setPreview('');
    } catch (error) {
      message.error('Error sending message');
    }
  };

  if (!authenticated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            maxWidth: '60vw',
            width: '100%',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px' }}>
            <Title level={3} style={{ textAlign: 'center' }}>
              Executive Login
            </Title>
            <Form onFinish={handleLogin}>
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password' }]}
              >
                <Input.Password placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          maxWidth: '60vw',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Title level={3} style={{ textAlign: 'center' }}>
            Send Message
          </Title>
          <Form form={form} onFinish={handleSubmit}>
            <Form.Item
              name="message_body"
              rules={[{ required: true, message: 'Please input the message body' }]}
            >
              <TextArea rows={4} placeholder="Message Body" />
            </Form.Item>
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Upload
                  beforeUpload={() => false}
                  listType="picture-card"
                  className="avatar-uploader"
                  onChange={handleFileChange}
                  accept="image/*"
                  maxCount={1}
                  showUploadList={false}
                >
                  {preview ? <img src={preview} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
                </Upload>
              </div>
            </Form.Item>
            <Form.Item>
              <TreeSelect
                treeData={treeData}
                value={selectedValues}
                onChange={(value) => setSelectedValues(value)}
                treeCheckable={true}
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                placeholder="Please select regions or buildings"
                style={{ width: '100%' }}
                allowClear
                treeDefaultExpandAll
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Send Message
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default SendMessagePage;
