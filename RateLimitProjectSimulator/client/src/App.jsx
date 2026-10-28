import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import KpiMetrics from './components/KpiMetrics';
import SimulatorControls from './components/SimulatorControls';
import SlidingWindowTimeline from './components/SlidingWindowTimeline';
import TrafficTable from './components/TrafficTable';
import RequestModal from './components/RequestModal';
import RulesManager from './components/RulesManager';
import AbuseConsole from './components/AbuseConsole';
import ConceptsGuide from './components/ConceptsGuide';
import { Activity, Layers, Sliders, AlertOctagon, BookOpen, Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socketConnected, setSocketConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState({ mode: 'in-memory-mongo', connected: true });
  
  // Simulator configuration state
  const [selectedUser, setSelectedUser] = useState('user_alice');
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/public/quotes');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('sliding-window-log');
  const [rateLimit, setRateLimit] = useState(5);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [clientTier, setClientTier] = useState('free');

  // Real-time telemetry data state
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    bannedRequests: 0,
    rejectionRate: 0,
    activeUsersCount: 1,
    abuseIncidents: 0
  });
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState([]);
  const [bans, setBans] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [inspectLog, setInspectLog] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [abuseNotification, setAbuseNotification] = useState(null);

  // Initialize Socket.io connection & initial API fetches
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('request_logged', (newLog) => {
      setLogs(prev => [newLog, ...prev.slice(0, 300)]);
      // Increment live metric counts
      setMetrics(prev => {
        const total = prev.totalRequests + 1;
        const allowed = prev.allowedRequests + (newLog.statusCode < 300 ? 1 : 0);
        const blocked = prev.blockedRequests + (newLog.statusCode === 429 ? 1 : 0);
        const banned = prev.bannedRequests + (newLog.statusCode === 403 ? 1 : 0);
        const rate = total > 0 ? Number(((blocked + banned) / total * 100).toFixed(1)) : 0;
        return {
          ...prev,
          totalRequests: total,
          allowedRequests: allowed,
          blockedRequests: blocked,
          bannedRequests: banned,
          rejectionRate: rate,
          abuseIncidents: prev.abuseIncidents + (newLog.abuseDetected ? 1 : 0)
        };
      });
    });

    socket.on('abuse_alert', (alert) => {
      setAbuseNotification(alert);
      setTimeout(() => setAbuseNotification(null), 5000);
      fetchBans();
    });

    // Initial Data Fetch
    fetchMetrics();
    fetchLogs();
    fetchRules();
    fetchBans();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      if (data.success && data.data) {
        setMetrics(data.data);
        if (data.data.dbStatus) setDbStatus(data.data.dbStatus);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?limit=50');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    }
  };

  const fetchBans = async () => {
    try {
      const res = await fetch('/api/admin/bans');
      const data = await res.json();
      if (data.success) {
        setBans(data.bans || []);
      }
    } catch (err) {
      console.error('Failed to fetch bans:', err);
    }
  };

  // Dispatch a simulated HTTP request through the gateway
  const handleSendRequest = useCallback(async () => {
    setIsSending(true);
    const start = Date.now();

    const apiKey = clientTier === 'pro' 
      ? 'pro-tier-key' 
      : clientTier === 'enterprise' 
        ? 'enterprise-tier-key' 
        : 'free-tier-key';

    const url = `${selectedEndpoint}?userId=${encodeURIComponent(selectedUser)}&simAlgorithm=${selectedAlgorithm}&simLimit=${rateLimit}&simWindow=${windowSeconds}&tier=${clientTier}`;

    try {
      const response = await fetch(url, {
        method: selectedEndpoint.includes('login') || selectedEndpoint.includes('heavy-compute') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedUser,
          'x-api-key': apiKey
        },
        body: selectedEndpoint.includes('login') ? JSON.stringify({ username: selectedUser }) : undefined
      });

      const data = await response.json().catch(() => ({}));
      const latencyMs = Date.now() - start;

      const remainingHeader = response.headers.get('x-ratelimit-remaining');
      const retryAfterHeader = response.headers.get('retry-after');

      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        remaining: remainingHeader !== null ? parseInt(remainingHeader) : data.remaining,
        retryAfter: retryAfterHeader !== null ? parseInt(retryAfterHeader) : data.retryAfter,
        latencyMs,
        data
      });
    } catch (err) {
      setLastResponse({
        status: 500,
        statusText: 'Network Error',
        latencyMs: Date.now() - start,
        data: { error: err.message }
      });
    } finally {
      setIsSending(false);
    }
  }, [selectedUser, selectedEndpoint, selectedAlgorithm, rateLimit, windowSeconds, clientTier]);

  // Run automated burst scenario
  const handleRunBurst = async (count, delayMs = 60) => {
    for (let i = 0; i < count; i++) {
      handleSendRequest();
      if (delayMs > 0 && i < count - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  };

  // Reset all sliding window buckets and bans
  const handleResetState = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/rules/reset-state', { method: 'POST' });
      await res.json();
      await fetchMetrics();
      await fetchBans();
      setLastResponse(null);
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  // Clear request logs history
  const handleClearLogs = async () => {
    try {
      await fetch('/api/admin/logs', { method: 'DELETE' });
      setLogs([]);
      await fetchMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  // Update rule in database
  const handleUpdateRule = async (ruleId, updates) => {
    const res = await fetch(`/api/admin/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.success) {
      fetchRules();
    }
  };

  // Add client to blacklist
  const handleAddBan = async (banData) => {
    const res = await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banData)
    });
    const data = await res.json();
    if (data.success) {
      fetchBans();
    }
  };

  // Remove ban
  const handleRemoveBan = async (id) => {
    const res = await fetch(`/api/admin/bans/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchBans();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        socketConnected={socketConnected}
        dbStatus={dbStatus}
        onResetState={handleResetState}
        resetting={resetting}
      />

      <main className="app-container">
        {/* Real-time Abuse Alert Banner */}
        {abuseNotification && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.25), rgba(244, 63, 94, 0.1))',
            border: '1px solid rgba(244, 63, 94, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 0 25px rgba(244, 63, 94, 0.25)'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertOctagon size={20} color="#fb7185" />
              <div>
                <b style={{ color: '#fb7185', fontSize: '0.88rem' }}>SECURITY ALERT DETECTED: </b>
                <span style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                  {abuseNotification.reason || abuseNotification.type} on client <b>{abuseNotification.userId}</b>
                </span>
              </div>
            </div>
            <button 
              className="chip-btn" 
              style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.4)' }}
              onClick={() => setActiveTab('abuse')}
            >
              Inspect Firewall
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="tab-navigation">
          {[
            { id: 'dashboard', label: 'Live Gateway Dashboard', icon: Activity },
            { id: 'visualizer', label: 'Sliding Window Timeline', icon: Layers },
            { id: 'rules', label: 'Rate Limit Policies', icon: Sliders },
            { id: 'abuse', label: 'Abuse & Firewall', icon: AlertOctagon },
            { id: 'concepts', label: 'System Design Concepts', icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Real-Time KPI Cards (Shown on top of Dashboard and Visualizer) */}
        {(activeTab === 'dashboard' || activeTab === 'visualizer') && (
          <KpiMetrics metrics={metrics} />
        )}

        {/* Tab 1: Live Gateway Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout animate-fade-in">
            {/* Left Column: Interactive Request Simulator */}
            <SimulatorControls 
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              selectedEndpoint={selectedEndpoint}
              setSelectedEndpoint={setSelectedEndpoint}
              selectedAlgorithm={selectedAlgorithm}
              setSelectedAlgorithm={setSelectedAlgorithm}
              rateLimit={rateLimit}
              setRateLimit={setRateLimit}
              windowSeconds={windowSeconds}
              setWindowSeconds={setWindowSeconds}
              clientTier={clientTier}
              setClientTier={setClientTier}
              onSendRequest={handleSendRequest}
              onRunBurst={handleRunBurst}
              isSending={isSending}
              lastResponse={lastResponse}
            />

            {/* Right Column: Sliding Window Bar + Live Traffic Table */}
            <div className="dashboard-right-col">
              <SlidingWindowTimeline 
                selectedUser={selectedUser}
                selectedEndpoint={selectedEndpoint}
                rateLimit={rateLimit}
                windowSeconds={windowSeconds}
                recentRequests={logs}
              />

              <TrafficTable 
                logs={logs}
                onClearLogs={handleClearLogs}
                onInspectRequest={setInspectLog}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Sliding Window Deep-Dive Visualizer */}
        {activeTab === 'visualizer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', minWidth: 0 }} className="animate-fade-in">
            <SlidingWindowTimeline 
              selectedUser={selectedUser}
              selectedEndpoint={selectedEndpoint}
              rateLimit={rateLimit}
              windowSeconds={windowSeconds}
              recentRequests={logs}
            />

            <div className="dashboard-layout">
              <SimulatorControls 
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                selectedEndpoint={selectedEndpoint}
                setSelectedEndpoint={setSelectedEndpoint}
                selectedAlgorithm={selectedAlgorithm}
                setSelectedAlgorithm={setSelectedAlgorithm}
                rateLimit={rateLimit}
                setRateLimit={setRateLimit}
                windowSeconds={windowSeconds}
                setWindowSeconds={setWindowSeconds}
                clientTier={clientTier}
                setClientTier={setClientTier}
                onSendRequest={handleSendRequest}
                onRunBurst={handleRunBurst}
                isSending={isSending}
                lastResponse={lastResponse}
              />

              <div className="dashboard-right-col">
                <TrafficTable 
                  logs={logs}
                  onClearLogs={handleClearLogs}
                  onInspectRequest={setInspectLog}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Gateway Policies & Rules Manager */}
        {activeTab === 'rules' && (
          <div className="animate-fade-in">
            <RulesManager 
              rules={rules}
              onUpdateRule={handleUpdateRule}
              onRefreshRules={fetchRules}
            />
          </div>
        )}

        {/* Tab 4: Abuse Prevention & Firewall Console */}
        {activeTab === 'abuse' && (
          <div className="animate-fade-in">
            <AbuseConsole 
              bans={bans}
              onAddBan={handleAddBan}
              onRemoveBan={handleRemoveBan}
              abuseIncidents={metrics.abuseIncidents}
            />
          </div>
        )}

        {/* Tab 5: Architecture & Concepts Guide */}
        {activeTab === 'concepts' && (
          <div className="animate-fade-in">
            <ConceptsGuide 
              selectedUser={selectedUser}
              selectedEndpoint={selectedEndpoint}
              rateLimit={rateLimit}
              windowSeconds={windowSeconds}
            />
          </div>
        )}
      </main>

      {/* Deep Inspection Modal */}
      {inspectLog && (
        <RequestModal 
          log={inspectLog} 
          onClose={() => setInspectLog(null)} 
        />
      )}
    </div>
  );
}
