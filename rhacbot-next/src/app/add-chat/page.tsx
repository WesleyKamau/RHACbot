"use client";
import { Form, Input, Button, Select, message, Typography } from 'antd';
import buildings from '../../../data/buildings.json';
import { addChat } from '../../../lib/api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

export default function AddChatPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values: any) => {
    const data = {
      groupme_link: values.groupme_link,
      building_id: parseInt(String(values.building_id), 10),
      floor_number: parseInt(String(values.floor_number), 10),
    };

    try {
      const res = await addChat(data);
      // backend returns { status, data }
      const messageText = res && res.data && res.data.message ? res.data.message : 'Chat added';
      if (res && res.status === 200) {
        messageApi.success(messageText);
        form.resetFields();
      } else {
        const errMsg = res && res.data && res.data.error ? res.data.error : 'Error adding chat';
        messageApi.error(errMsg);
      }
    } catch (err: any) {
      console.error(err);
      const fallback = err && err.message ? err.message : 'Error adding chat';
      messageApi.error(fallback);
    }
  };

  return (
    <div style={{ 
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
                  filterOption={(input, option) => String(option?.children).toLowerCase().includes(String(input).toLowerCase())}
                >
                  {buildings.map((b: any) => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="floor_number" 
                label="Floor Number" 
                rules={[{ required: true, message: 'Please enter your floor number' }]}
              >
                <Input type="number" placeholder="e.g., 3" min="1" />
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
