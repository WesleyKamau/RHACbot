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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card">
          {contextHolder}
          <div className="card-inner">
            <Title level={3} style={{ textAlign: 'center' }}>Add RHACbot to your GroupMe!</Title>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <Paragraph style={{ margin: 0, fontSize: 13 }}>
                Need help creating a GroupMe invite link? See the instructions: {' '}
                <a href="https://support.microsoft.com/en-us/office/how-do-i-create-a-share-link-in-groupme-47ded1b7-e92d-4620-b3ff-b3d3740db761" target="_blank" rel="noopener noreferrer">How do I create a share link in GroupMe</a>
              </Paragraph>
            </div>
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item name="groupme_link" label="GroupMe Invite Link" rules={[{ required: true }]}>
                <Input placeholder="GroupMe Invite Link" />
              </Form.Item>

              <Form.Item name="building_id" label="Building" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select Building" optionFilterProp="children" filterOption={(input, option) => String(option?.children).toLowerCase().includes(String(input).toLowerCase())}>
                  {buildings.map((b: any) => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="floor_number" label="Floor Number" rules={[{ required: true }]}>
                <Input type="number" placeholder="Floor Number" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>Add Chat</Button>
              </Form.Item>
            </Form>
          </div>
        </div>
    </div>
  );
}
