"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const router = useRouter();
  // On the client, Next.js only exposes environment variables prefixed with NEXT_PUBLIC_
  // Avoid using server-only envs here (process.env.ENV) which won't be available in the browser.
  const ENV = (process.env.NEXT_PUBLIC_ENV || 'development').toString();

  // Feature flag is handled by the AppShell; page no longer needs to compute it.

  useEffect(() => {
    // In development it's helpful to print the exposed NEXT_PUBLIC_* env vars so you can
    // confirm they were loaded by Next.js. These values are safe to print because they
    // are intentionally public (NEXT_PUBLIC_ prefix).
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('NEXT_PUBLIC_ENV=', process.env.NEXT_PUBLIC_ENV);
      // eslint-disable-next-line no-console
      console.log('NEXT_PUBLIC_API_URL=', process.env.NEXT_PUBLIC_API_URL);
      // eslint-disable-next-line no-console
      console.log('NEXT_PUBLIC_API_PREFIX=', process.env.NEXT_PUBLIC_API_PREFIX);
      // eslint-disable-next-line no-console
      console.log('NEXT_PUBLIC_STYLISH=', process.env.NEXT_PUBLIC_STYLISH);
    }
  }, []);

  return (
    <div 
      className="page-wrapper"
      style={{ 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px 0',
        boxSizing: 'border-box'
      }}>
      <div className="card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div className={`env-badge ${ENV === 'development' ? 'env-dev' : 'env-prod'}`} title={`Environment: ${ENV}`}>
              {ENV}
            </div>
          </div>

          <div className="homepage-container">
            <img src={'/rhac-logo.png'} alt="RHAC Logo" className="logo" />
            <Title level={2} style={{ textAlign: 'center', fontSize: 'clamp(22px, 5vw, 28px)' }}>Welcome to the RHACbot Control Panel!</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: 'clamp(14px, 3vw, 16px)', lineHeight: 1.6 }}>
              This platform allows RHAC members to manage floor chats and send messages to specific buildings or regions. You can add new floor chats or send announcements to residents.
            </Paragraph>

            <div className="button-group">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Button type="primary" size="large" onClick={() => router.push('/add-chat')} block>Add Floor Chat</Button>
                <Paragraph className="btn-desc" style={{ marginTop: 8, marginBottom: 0 }}>For RA's</Paragraph>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Button type="primary" size="large" onClick={() => router.push('/send-message')} block>Send Message</Button>
                <Paragraph className="btn-desc" style={{ marginTop: 8, marginBottom: 0 }}>For RHAC executive board</Paragraph>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
