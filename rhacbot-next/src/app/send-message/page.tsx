"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Form, Button, Input, Upload, TreeSelect, Typography, message, Alert, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import buildings from '../../../data/buildings.json';
import { sendMessage, authenticate } from '../../../lib/api';
import type { 
  Building, 
  ApiResponse, 
  AuthResponse,
  AuthErrorResponse,
  SendMessageResponse,
  MessageSendSummary,
  TreeSelectNode,
  TreeSelectValue,
  TreeSelectChangeValue
} from '../../../lib/types';
import { isApiError, hasMessageFailures } from '../../../lib/types';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function SendMessagePage() {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedValues, setSelectedValues] = useState<TreeSelectValue[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sendSummary, setSendSummary] = useState<SendMessageResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const buildingsByRegion = (buildings as Building[]).reduce((acc: Record<string, Building[]>, b: Building) => {
    const region = b.region || 'Unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(b);
    return acc;
  }, {} as Record<string, Building[]>);

  const regionNodes: TreeSelectNode[] = Object.entries(buildingsByRegion).map(([regionName, regionBuildings]) => ({
    title: `${regionName} Campus`,
    value: `region-${regionName}`,
    selectable: true,
    children: regionBuildings.map((building) => ({ 
      title: building.name, 
      value: String(building.id),
      selectable: true 
    })),
  }));

  // Make "Campuswide" the parent of all regions
  const treeData: TreeSelectNode[] = [{
    title: 'Campuswide',
    value: 'region-all',
    selectable: true,
    children: regionNodes
  }];

  // Handle tree select change with parent-child logic
  const handleTreeSelectChange = (newValue: TreeSelectChangeValue[]) => {
    const valueSet = new Set(newValue.map((v: TreeSelectChangeValue) => {
      return typeof v === 'string' ? v : v.value;
    }));
    const resultValues: TreeSelectValue[] = [];

    // Build maps for the three-level hierarchy
    const allRegionsNode = treeData[0];
    const allRegionValue = 'region-all';
    const allRegions: string[] = [];
    const regionToBuildings = new Map<string, string[]>();
    
    // Map each region to its buildings
    allRegionsNode.children?.forEach((regionNode) => {
      const regionValue = String(regionNode.value);
      allRegions.push(regionValue);
      
      if (regionNode.children && regionNode.children.length > 0) {
        const buildingIds = regionNode.children.map((child) => String(child.value));
        regionToBuildings.set(regionValue, buildingIds);
      }
    });

    // Check if "Campuswide" is selected
    if (valueSet.has(allRegionValue)) {
      // If all regions selected, just return that
      resultValues.push({ value: allRegionValue, label: 'Campuswide' });
      setSelectedValues(resultValues);
      return;
    }

    // Check if all individual regions are selected (should auto-select "Campuswide")
    const allRegionsSelected = allRegions.every((r) => valueSet.has(r));
    if (allRegionsSelected && allRegions.length > 0) {
      resultValues.push({ value: allRegionValue, label: 'Campuswide' });
      setSelectedValues(resultValues);
      return;
    }

    // Process each selected value
    valueSet.forEach((value) => {
      const strValue = String(value);
      
      // If it's a region (but not "all")
      if (strValue.startsWith('region-') && strValue !== allRegionValue) {
        const buildings = regionToBuildings.get(strValue) || [];
        
        // If region is explicitly selected, keep it regardless of children
        // OR if all children are selected, keep the region
        
        // Keep the region if it's selected directly or all children are selected
        const regionNode = allRegionsNode.children?.find((n) => n.value === strValue);
        resultValues.push({ value: strValue, label: regionNode?.title || strValue });
        // Remove children from valueSet so they don't appear individually
        buildings.forEach((bid) => valueSet.delete(bid));
      }
    });

    // Add remaining building IDs (those not part of a fully-selected region)
    valueSet.forEach((value) => {
      const strValue = String(value);
      if (!strValue.startsWith('region-')) {
        // Find the building name
        let buildingName = strValue;
        allRegionsNode.children?.forEach((regionNode) => {
          const child = regionNode.children?.find((c) => String(c.value) === strValue);
          if (child) buildingName = child.title || strValue;
        });
        resultValues.push({ value: strValue, label: buildingName });
      }
    });

    // Check if any region should be auto-selected because all its buildings are selected
    regionToBuildings.forEach((buildings, regionValue) => {
      const regionInResult = resultValues.some((v) => v.value === regionValue);
      if (!regionInResult && buildings.length > 0) {
        const allChildrenSelected = buildings.every((bid) => 
          resultValues.some((v) => v.value === bid)
        );
        if (allChildrenSelected) {
          // Remove individual buildings and add the region
          const filteredValues = resultValues.filter((v) => !buildings.includes(v.value));
          const regionNode = allRegionsNode.children?.find((n) => n.value === regionValue);
          filteredValues.push({ 
            value: regionValue, 
            label: regionNode?.title || regionValue 
          });
          resultValues.splice(0, resultValues.length, ...filteredValues);
        }
      }
    });

    setSelectedValues(resultValues);
  };

  const handleLogin = async (values: any) => {
    const { password } = values;
    try {
      const res: ApiResponse<AuthResponse | AuthErrorResponse> = await authenticate(password);
      if (res.status === 200) {
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

    selectedValues.forEach((valueObj: TreeSelectValue) => {
      const value = valueObj.value;
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
      const response: ApiResponse<SendMessageResponse> = await sendMessage(formData);
      const data = response.data;
      
      if (response.status === 200) {
        if (!isApiError(data)) {
          messageApi.success(data.message || 'Messages sent successfully');
        }
        setSendSummary(null);
      } else if (response.status === 207) {
        if (hasMessageFailures(data)) {
          messageApi.warning(data.message || 'Some messages failed');
        }
        setSendSummary(data);
      } else {
        if (isApiError(data)) {
          messageApi.error(data.error || 'Failed to send messages');
        } else if (!isApiError(data)) {
          messageApi.error(data.message || 'Failed to send messages');
        }
        setSendSummary(data);
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
        <div className="page-wrapper" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: '20px 0',
          boxSizing: 'border-box'
        }}>
          <div className="card">
            {contextHolder}
            <div className="card-inner">
              <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>RHAC Executive Board Login</Title>
              <Paragraph style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, marginBottom: 24, color: 'rgba(0,0,0,0.65)' }}>
                Send messages to all connected residence hall GroupMe chats
              </Paragraph>
              <Form onFinish={handleLogin} autoComplete="off" size="large">
                <Form.Item 
                  name="password" 
                  rules={[{ required: true, message: 'Please input your password' }]}
                  tooltip="Contact RHAC leadership if you need the executive password"
                >
                  <Input.Password autoComplete="current-password" placeholder="Executive Password" onChange={(e) => setPassword(e.target.value)} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block style={{ height: '48px', fontSize: '16px', fontWeight: 600 }}>
                    Login
                  </Button>
                </Form.Item>
              </Form>
              
              <Paragraph style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.55)', marginTop: 24, lineHeight: 1.6 }}>
                Are you an RA looking to connect your floor's GroupMe?<br />
                <Link href="/add-chat" style={{ color: '#ba0001', fontWeight: 600 }}>
                  Go to Add Chat →
                </Link>
              </Paragraph>
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
        <div className="page-wrapper scrollable-page" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: '20px 0',
          boxSizing: 'border-box'
        }}>
          <div className="card">
            {contextHolder}
            <div className="card-inner">
              {sendSummary && (
                <div style={{ marginBottom: 16 }}>
                  <Alert 
                    message={
                      isApiError(sendSummary) 
                        ? sendSummary.error 
                        : sendSummary.message
                    } 
                    description={
                      !isApiError(sendSummary) && sendSummary.summary
                        ? `Sent ${sendSummary.summary.sent}/${sendSummary.summary.total} — ${sendSummary.summary.failed} failed` 
                        : null
                    } 
                    type={
                      isApiError(sendSummary) 
                        ? 'error' 
                        : (hasMessageFailures(sendSummary) ? 'warning' : 'info')
                    } 
                    showIcon 
                    action={
                      hasMessageFailures(sendSummary) 
                        ? (<Button size="small" onClick={() => setModalOpen(true)}>Details</Button>) 
                        : null
                    } 
                  />
                </div>
              )}

              <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>Broadcast Message</Title>
              <Paragraph style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, marginBottom: 24, color: 'rgba(0,0,0,0.75)' }}>
                Send announcements to floor GroupMe chats across campus
              </Paragraph>

              {/* Info Box */}
              <div style={{ 
                background: '#f6f9fc', 
                border: '1px solid #e0e6ed',
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: 24
              }}>
                <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(0,0,0,0.75)' }}>
                  <strong>How targeting works:</strong><br />
                  • Select "Campuswide" to reach every connected floor chat across campus<br />
                  • Select specific regions (e.g., "North Campus") to target all buildings in that area<br />
                  • Select individual buildings to reach only those residence halls<br />
                  • Mix and match regions and buildings for custom targeting
                </Paragraph>
              </div>

              <Form form={form} onFinish={handleSubmit} autoComplete="off" size="large">
                <Form.Item 
                  name="message_body" 
                  label="Message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                  tooltip="This text will be sent to all selected floor GroupMe chats"
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Type your announcement here... (e.g., 'Join us for Movie Night this Friday at 7pm in the Union!')" 
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>

                <Form.Item
                  label="Image (Optional)"
                  tooltip="Add a flyer, photo, or graphic to your message"
                >
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
                      {preview ? <img src={preview} alt="Message image preview" style={{ width: '100%' }} /> : uploadButton}
                    </Upload>
                  </div>
                  {preview && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <Button size="small" onClick={() => { setFile(null); setPreview(''); }}>Remove Image</Button>
                    </div>
                  )}
                </Form.Item>

                <Form.Item
                  label="Target Audience"
                  tooltip="Choose which residence halls will receive this message"
                  name="targetAudience"
                  rules={[{ required: true, message: 'Please select at least one target' }]}
                >
                  <TreeSelect 
                    treeData={treeData} 
                    value={selectedValues} 
                    onChange={handleTreeSelectChange} 
                    treeCheckable={true} 
                    showCheckedStrategy={TreeSelect.SHOW_PARENT} 
                    placeholder="Select regions, buildings, or both" 
                    style={{ width: '100%' }} 
                    allowClear 
                    labelInValue 
                  />
                </Form.Item>

                {selectedValues.length > 0 && (
                  <div style={{ 
                    background: 'rgba(186, 0, 1, 0.05)', 
                    border: '1px solid rgba(186, 0, 1, 0.15)',
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    marginBottom: 16
                  }}>
                    <Paragraph style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                      <strong>Ready to send:</strong> Your message will be delivered to {selectedValues.length} selected target{selectedValues.length > 1 ? 's' : ''}
                    </Paragraph>
                  </div>
                )}

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    style={{ height: '48px', fontSize: '16px', fontWeight: 600 }}
                    disabled={selectedValues.length === 0}
                  >
                    Send Message to Selected Chats
                  </Button>
                </Form.Item>

                <Paragraph style={{ textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.55)', margin: 0, lineHeight: 1.5 }}>
                  Messages are sent immediately and cannot be unsent (for now, I could add that later). Please review carefully before sending.
                </Paragraph>
              </Form>
            </div>
          </div>
        </div>
      );
}
