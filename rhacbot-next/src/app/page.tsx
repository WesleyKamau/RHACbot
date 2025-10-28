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
          {/* <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div className={`env-badge ${ENV === 'development' ? 'env-dev' : 'env-prod'}`} title={`Environment: ${ENV}`}>
              {ENV}
            </div>
          </div> */}

          <div className="homepage-container">
            <img src={'/rhac-logo.png'} alt="RHAC Logo" className="logo" />
            <Title level={2} style={{ textAlign: 'center', fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 8 }}>
              Welcome, RAs! <span className="wave-emoji">👋</span>
            </Title>
            <Paragraph style={{ textAlign: 'center', fontSize: 'clamp(15px, 3vw, 17px)', lineHeight: 1.6, marginBottom: 24, color: 'rgba(0,0,0,0.75)' }}>
              Connect your floor's GroupMe to RHAC.
            </Paragraph>

            {/* Primary CTA for RAs */}
            <div style={{ marginBottom: 32 }}>
              <Button 
                type="primary" 
                size="large" 
                onClick={() => router.push('/add-chat')} 
                block
                style={{ height: 'auto', padding: '16px 24px', fontSize: '18px', fontWeight: 600 }}
              >
                Add My Floor's GroupMe
              </Button>
              <Paragraph style={{ textAlign: 'center', marginTop: 12, fontSize: '14px', color: 'rgba(0,0,0,0.65)', lineHeight: 1.5 }}>
                Get your residents connected to RHAC event announcements
              </Paragraph>
            </div>

            {/* Info Box */}
            <div style={{ 
              background: 'rgba(186, 0, 1, 0.05)', 
              border: '1px solid rgba(186, 0, 1, 0.15)',
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <Title level={4} style={{ fontSize: '16px', marginBottom: 12, color: '#ba0001' }}>
                What you need:
              </Title>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
                <li>A GroupMe share link for your floor chat</li>
                <li>Your building name</li>
                <li>Your floor number</li>
              </ul>
              <Paragraph style={{ margin: '12px 0 0 0', fontSize: '13px', color: 'rgba(0,0,0,0.65)', fontStyle: 'italic' }}>
                Not sure how to create a share link?{' '}
                <a 
                  href="https://support.microsoft.com/en-us/office/how-do-i-create-a-share-link-in-groupme-47ded1b7-e92d-4620-b3ff-b3d3740db761" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#ba0001', fontWeight: 600 }}
                >
                  See instructions
                </a>
              </Paragraph>
            </div>

            {/* Secondary Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: 20, flexWrap: 'wrap' }}>
              <Button 
                size="large" 
                onClick={() => router.push('/learn-more')} 
                style={{ flex: 1, minWidth: '140px' }}
              >
                Learn More
              </Button>
              <Button 
                size="large" 
                onClick={() => router.push('/send-message')} 
                style={{ flex: 1, minWidth: '140px' }}
              >
                Executive Login
              </Button>
            </div>

            {/* Quick Info */}
            <Paragraph style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(0,0,0,0.55)', lineHeight: 1.6, margin: 0 }}>
              RHACbot sends <strong>infrequent, targeted announcements</strong> about RHAC events and updates to your floor's GroupMe.
            </Paragraph>
          </div>
        </div>
    </div>
  );
}
