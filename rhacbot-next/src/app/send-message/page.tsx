"use client";
import React, { useState } from 'react';
import { Form, Input, Upload, TreeSelect, Typography, message, Alert, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import buildings from '../../../data/buildings.json';
import { sendMessage, authenticate } from '../../../lib/api';
import { Button } from "@/components/ui/button"

const { Title } = Typography;
const { TextArea } = Input;

export default function SendMessagePage() {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedValues, setSelectedValues] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sendSummary, setSendSummary] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const buildingsByRegion = (buildings as any[]).reduce((acc: any, b: any) => {
    const region = b.region || 'Unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(b);
    return acc;
  }, {} as any);

  const treeData = Object.entries(buildingsByRegion).map(([regionName, regionBuildings]) => ({
    title: regionName,
    value: `region-${regionName}`,
    selectable: true,
    children: (regionBuildings as any[]).map((building) => ({ title: building.name, value: String(building.id) })),
  }));

  // Keep an "All Regions" root option (children empty array to satisfy TreeSelect typing)
  treeData.unshift({ title: 'All Regions', value: 'region-all', selectable: true, children: [] });

  const handleLogin = async (values: any) => {
    const { password } = values;
    try {
      const res = await authenticate(password);
      if (res && res.status === 200) {
        setAuthenticated(true);
      } else {
        messageApi.error('Incorrect password');
      }
    } catch (err) {
      messageApi.error('Authentication failed');
    }
  };

  const handleFileChange = ({ fileList }: any) => {
    if (fileList.length > 0) {
      const latestFile = fileList[fileList.length - 1].originFileObj;
      setFile(latestFile);
      setPreview(URL.createObjectURL(latestFile));
    } else {
      setFile(null);
      setPreview('');
    }
  };

  const handleSubmit = async (values: any) => {
    const { message_body } = values;
    const formData = new FormData();
    formData.append('password', password);
    formData.append('message_body', message_body);
    if (file) formData.append('image_file', file);

    const regions: string[] = [];
    const buildingIds: string[] = [];

    selectedValues.forEach((valueObj: any) => {
      const value = valueObj.value || valueObj;
      const strValue = String(value);
      if (strValue.startsWith('region-')) regions.push(strValue.replace('region-', ''));
      else buildingIds.push(strValue);
    });

    if (regions.length === 0 && buildingIds.length === 0) {
      messageApi.error('Please select at least one region or building');
      return;
    }

    // Append selected regions and building IDs to the FormData (match original behavior)
    if (regions.length > 0) {
      if (regions.includes('all')) {
        formData.append('regions', 'all');
      } else {
        regions.forEach((region) => formData.append('regions', region));
      }
    }

    if (buildingIds.length > 0) {
      buildingIds.forEach((id) => formData.append('building_ids', id));
    }

    try {
      const response = await sendMessage(formData);
      const data = (response && response.data) ? response.data : {};
      // Match original behavior: use response.status and response.data
      if (response && response.status === 200) {
        messageApi.success(data.message || 'Messages sent successfully');
        setSendSummary(null);
      } else if (response && response.status === 207) {
        setSendSummary(data);
        messageApi.warning(data.message || 'Some messages failed');
      } else {
        setSendSummary(data);
        messageApi.error(data.message || 'Failed to send messages');
      }
      form.resetFields();
      setSelectedValues([]);
      setFile(null);
      setPreview('');
    } catch (error) {
      messageApi.error('Error sending message');
    }
  };

    if (!authenticated) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="card">
            {contextHolder}
            <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
              <Title level={3} style={{ textAlign: 'center' }}>Executive Login</Title>
              <Form onFinish={handleLogin} autoComplete="off">
                <Form.Item name="password" rules={[{ required: true, message: 'Please input your password' }]}>
                  <Input.Password autoComplete="current-password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>Login</Button>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="card">
            {contextHolder}
            {sendSummary && (
              <div style={{ marginBottom: 12 }}>
                <Alert message={sendSummary.message || sendSummary.error} description={sendSummary.summary ? `Sent ${sendSummary.summary.sent}/${sendSummary.summary.total} — ${sendSummary.summary.failed} failed` : null} type={sendSummary.summary ? 'warning' : 'error'} showIcon action={sendSummary.failures ? (<Button size="small" onClick={() => setModalOpen(true)}>Details</Button>) : null} />
              </div>
            )}
        {/* <Modal title="Send failures" open={modalOpen} onCancel={() => setModalOpen(false)} footer={<Button onClick={() => setModalOpen(false)}>Close</Button>}>
          {sendSummary && sendSummary.failures ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {sendSummary.failures.map((f: any) => (
                <div key={f.group_id} style={{ marginBottom: 8 }}>
                  <strong>Group {f.group_id}:</strong>
                  <div>{f.error || 'Unknown error'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>No failure details available.</div>
          )}
        </Modal> */}

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Title level={3} style={{ textAlign: 'center' }}>Send Message</Title>
              <Form form={form} onFinish={handleSubmit} autoComplete="off">
                <Form.Item name="message_body" rules={[{ required: true, message: 'Please input the message body' }]}>
                  <TextArea rows={4} placeholder="Message Body" />
                </Form.Item>

                <Form.Item>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Upload beforeUpload={() => false} listType="picture-card" className="avatar-uploader" onChange={handleFileChange} accept="image/*" maxCount={1} showUploadList={false}>
                      {preview ? <img src={preview} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
                    </Upload>
                  </div>
                </Form.Item>

                <Form.Item>
                  <TreeSelect treeData={treeData} value={selectedValues} onChange={(value) => setSelectedValues(value as any)} treeCheckable={true} showCheckedStrategy={TreeSelect.SHOW_PARENT} placeholder="Please select regions or buildings" style={{ width: '100%' }} allowClear treeDefaultExpandAll treeCheckStrictly={true} labelInValue />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block>Send Message</Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      );
}
