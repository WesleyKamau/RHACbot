"use client";
import { useEffect } from 'react';
import { Form, Input, Button, Select, message, Typography } from 'antd';
import buildings from '../../../data/buildings.json';
import { addChat } from '../../../lib/api';
import type { AddChatRequest, Building, ApiResponse, AddChatResponse } from '../../../lib/types';
import { isApiError } from '../../../lib/types';

const { Title, Paragraph } = Typography;
const { Option, OptGroup } = Select;

export default function AddChatPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Group buildings by region
  const buildingsByRegion = (buildings as Building[]).reduce((acc, building) => {
    const region = building.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(building);
    return acc;
  }, {} as Record<string, Building[]>);

  // Sort regions and buildings within each region
  const sortedRegions = Object.keys(buildingsByRegion).sort();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (values: any) => {
    const data: AddChatRequest = {
      groupme_link: values.groupme_link,
      building_id: parseInt(String(values.building_id), 10),
      floor_number: parseInt(String(values.floor_number), 10),
    };

    try {
      const res: ApiResponse<AddChatResponse> = await addChat(data);
      
      if (res.status === 200) {
        messageApi.success(res.data.message || 'Chat added successfully');
        form.resetFields();
      } else if (isApiError(res.data)) {
        messageApi.error(res.data.error);
      } else {
        messageApi.error('Error adding chat');
      }
    } catch (err: any) {
      console.error(err);
      messageApi.error(err?.message || 'Error adding chat');
    }
  };

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
            <Title level={3} style={{ textAlign: 'center', marginBottom: 16 }}>Connect Your Floor's GroupMe</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, marginBottom: 24, color: 'rgba(0,0,0,0.75)' }}>
              Add your floor chat to receive RHAC event announcements and updates
            </Paragraph>

            {/* Help Box */}
            <div style={{ 
              background: '#f6f9fc', 
              border: '1px solid #e0e6ed',
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: 24
            }}>
              <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(0,0,0,0.75)' }}>
                <strong>Need a GroupMe share link?</strong><br />
                Open your floor's GroupMe → tap the group name → select "Share Group" → copy the link
              </Paragraph>
              <Paragraph style={{ margin: '8px 0 0 0', fontSize: 13 }}>
                <a 
                  href="https://support.microsoft.com/en-us/office/how-do-i-create-a-share-link-in-groupme-47ded1b7-e92d-4620-b3ff-b3d3740db761" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#ba0001', fontWeight: 600 }}
                >
                  View detailed instructions →
                </a>
              </Paragraph>
            </div>

            {/* Important Notice Box */}
            <div style={{ 
              background: '#fff7e6', 
              border: '1px solid #ffd591',
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: 24
            }}>
              <Paragraph style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(0,0,0,0.75)' }}>
                <strong>⚠️ Important:</strong> After submitting, you may need to approve RHACbot from your group's pending member requests. Check your GroupMe group settings to accept the join request.
              </Paragraph>
            </div>

            <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
              <Form.Item 
                name="groupme_link" 
                label="GroupMe Share Link" 
                rules={[{ required: true, message: 'Please paste your GroupMe share link' }]}
                tooltip="This allows RHACbot to join and send messages to your floor chat"
              >
                <Input placeholder="https://groupme.com/join_group/..." />
              </Form.Item>

              <Form.Item 
                name="building_id" 
                label="Your Building" 
                rules={[{ required: true, message: 'Please select your building' }]}
                tooltip="This helps RHAC send relevant announcements to your area"
              >
                <Select 
                  showSearch 
                  placeholder="Select your residence hall" 
                  optionFilterProp="children" 
                  filterOption={(input, option) => {
                    // Enable search across both building names and regions
                    if (option?.children) {
                      return String(option.children).toLowerCase().includes(String(input).toLowerCase());
                    }
                    return false;
                  }}
                >
                  {sortedRegions.map((region) => (
                    <OptGroup key={region} label={`${region} Campus`}>
                      {buildingsByRegion[region]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((building) => (
                          <Option key={building.id} value={building.id}>
                            {building.name}
                          </Option>
                        ))}
                    </OptGroup>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="floor_number" 
                label="Floor Number" 
                rules={[{ required: true, message: 'Please enter your floor number' }]}
              >
                <Input type="number" placeholder="e.g., 3" min="1" max="20" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block style={{ height: '48px', fontSize: '16px', fontWeight: 600 }}>
                  Connect GroupMe
                </Button>
              </Form.Item>

              <Paragraph style={{ textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.55)', margin: 0, lineHeight: 1.5 }}>
                By connecting, your floor chat will receive <strong>occasional announcements</strong> about RHAC events and important updates.
              </Paragraph>
            </Form>
          </div>
        </div>
    </div>
  );
}
