"use client";
import React, { useEffect } from 'react';
import { Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

export default function LearnMorePage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also try to scroll the container
    const container = document.getElementById('vanta-root');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  return (
    <div 
      className="page-wrapper scrollable-page"
      style={{ 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        minHeight: '100vh',
        padding: '40px 20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
      <div className="card" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="card-inner">
          <img src={'/rhac-logo.png'} alt="RHAC Logo" className="logo" style={{ maxWidth: '120px', display: 'block', margin: '0 auto 20px' }} />
          
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>About RHAC & RHACbot</Title>
          
          <Title level={3} style={{ fontSize: '20px', marginTop: 24 }}>What is RHAC?</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            The <strong>Residence Halls Advisory Council (RHAC)</strong> is the governing organization for all residence halls at The Ohio State University. 
            We partner with Housing and Residence Education, Community Councils, and Dining Services to create the premiere residence hall experience for our students.
          </Paragraph>
          
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            Any on-campus student may freely join the RHAC General Body by attending meetings or volunteering to serve on one of our committees. 
            RHAC events are open to any student who lives on campus, and we're always looking for new members!
          </Paragraph>

          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            RHAC represents OSU's residence halls on the regional and national levels as a member of the Central Atlantic Affiliate of College 
            and University Residence Halls (CAACURH) and the National Association of College and University Residence Halls (NACURH). 
            RHAC is a partner organization of the National Residence Halls Honorary (NRHH), an organization representing the top 1% of residence hall students.
          </Paragraph>

          <Divider />

          <Title level={3} style={{ fontSize: '20px', marginTop: 24 }}>What is RHACbot?</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            <strong>RHACbot</strong> is a communication tool that connects RHAC to on-campus students through GroupMe, 
            a messaging platform that RAs and residents already use daily.
          </Paragraph>

          <Title level={4} style={{ fontSize: '17px', marginTop: 20, marginBottom: 12 }}>How It Works</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>For RAs:</strong> Add your floor's GroupMe chat to RHACbot by providing a share link and selecting your building and floor number. 
                This allows RHAC to send relevant announcements directly to your residents.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>For RHAC Executive Board:</strong> Send targeted messages to specific buildings, regions, or all residence halls at once. 
                Messages can include text and images for event announcements, important updates, and more.
              </li>
            </ul>
          </Paragraph>

          <Title level={4} style={{ fontSize: '17px', marginTop: 20, marginBottom: 12 }}>Message Frequency & Relevance</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            Messages through RHACbot are <strong>infrequent and relevant</strong>:
          </Paragraph>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Only RHAC executive board members can send messages</li>
              <li style={{ marginBottom: '8px' }}>Messages are targeted by building or region to ensure relevance</li>
              <li style={{ marginBottom: '8px' }}>Used primarily for event announcements and important community updates</li>
              <li style={{ marginBottom: '8px' }}>No spam or excessive messaging</li>
            </ul>
          </Paragraph>

          <Divider />

          <Title level={3} style={{ fontSize: '20px', marginTop: 24 }}>Privacy & Data</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            RHACbot only stores:
          </Paragraph>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>GroupMe chat IDs (for sending messages)</li>
              <li style={{ marginBottom: '8px' }}>Building and floor associations (for targeted messaging)</li>
            </ul>
          </Paragraph>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            No personal information, chat history, or message content is collected or stored.
          </Paragraph>

          <Divider />

          <Title level={3} style={{ fontSize: '20px', marginTop: 24 }}>Questions?</Title>
          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7 }}>
            If you have questions or suggestions about your residence hall experience or RHACbot, please email us at{' '}
            <a href="mailto:ohiostaterhac@osu.edu" style={{ color: '#ba0001', fontWeight: 600 }}>
              ohiostaterhac@osu.edu
            </a>
          </Paragraph>

          <Paragraph style={{ fontSize: '15px', lineHeight: 1.7, marginTop: 16 }}>
            Learn more about RHAC at{' '}
            <a 
              href="https://involvedliving.osu.edu/rhac/about-us" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#ba0001', fontWeight: 600 }}
            >
              involvedliving.osu.edu/rhac/about-us
            </a>
          </Paragraph>

          <Divider style={{ margin: '32px 0 24px 0' }} />

          <Paragraph style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(0,0,0,0.45)', marginBottom: 0 }}>
            Built by{' '}
            <a 
              href="https://wesleykamau.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#ba0001', fontWeight: 600, textDecoration: 'none' }}
            >
              Wesley Kamau
            </a>
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
