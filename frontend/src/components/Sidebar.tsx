import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Video,
  ShieldAlert,
  BarChart3,
  Navigation,
  Activity,
  CloudSun,
} from 'lucide-react';

interface SidebarProps {
  backendHealthy: boolean;
  sourcesStatus: Record<string, string>;
}

export const Sidebar: React.FC<SidebarProps> = ({ backendHealthy, sourcesStatus }) => {
  const tomtomStatus = sourcesStatus.tomtom_traffic_flow || 'unconfigured';
  const openMeteoStatus = sourcesStatus.open_meteo || 'unknown';

  const navItems = [
    {
      to: '/',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/map',
      label: 'Live Traffic Map',
      icon: Map,
      badge: 'Leaflet',
    },
    {
      to: '/video-analytics',
      label: 'CCTV & Video Analytics',
      icon: Video,
      badge: 'YOLOv8',
    },
    {
      to: '/risk-analysis',
      label: 'Accident Risk Analysis',
      icon: ShieldAlert,
      badge: 'Multi-input',
    },
    {
      to: '/historical',
      label: 'Historical Analytics',
      icon: BarChart3,
      badge: '850 records',
    },
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #1e293b',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <Navigation size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              Smart Traffic AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Hyderabad Safety Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            padding: '0.35rem 0.6rem',
            marginBottom: '0.2rem',
          }}
        >
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? '#1e293b' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={17} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#334155',
                    color: '#cbd5e1',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Telemetry Status Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid #1e293b',
          background: '#090d16',
          fontSize: '0.73rem',
        }}
      >
        <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          System Telemetry
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Backend Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
              <Activity size={13} />
              <span>FastAPI Backend</span>
            </span>
            <span
              style={{
                color: backendHealthy ? '#4ade80' : '#f87171',
                fontWeight: 600,
              }}
            >
              {backendHealthy ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Open-Meteo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
              <CloudSun size={13} />
              <span>Open-Meteo</span>
            </span>
            <span
              style={{
                color: openMeteoStatus === 'operational' ? '#38bdf8' : '#facc15',
                fontWeight: 600,
              }}
            >
              {openMeteoStatus === 'operational' ? 'Active' : 'Degraded'}
            </span>
          </div>

          {/* TomTom Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
              <Navigation size={13} />
              <span>TomTom API</span>
            </span>
            <span
              style={{
                color: tomtomStatus === 'configured' ? '#4ade80' : '#facc15',
                fontWeight: 600,
              }}
            >
              {tomtomStatus === 'configured' ? 'Configured' : 'Unconfigured'}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid #1e293b',
            color: '#64748b',
            fontSize: '0.68rem',
            textAlign: 'center',
          }}
        >
          v0.2.0 • Hyderabad Corridor Monitor
        </div>
      </div>
    </aside>
  );
};
