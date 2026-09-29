import React from 'react';
import { 
  Play, 
  Pause, 
  Zap, 
  RotateCcw, 
  Activity, 
  Radio, 
  ShieldAlert, 
  Network, 
  LayoutDashboard,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import type { NetworkStats, AppPage, AppTheme } from '../types/graph';

interface HeaderProps {
  stats: NetworkStats;
  isRunning: boolean;
  onTogglePlay: () => void;
  speedMs: number;
  onChangeSpeed: (speed: number) => void;
  onTriggerScenario: (scenario: 'lateral_movement' | 'credential_stuffing' | 'dns_exfil' | 'privilege_escalation') => void;
  onResetGraph: () => void;
  backendConnected: boolean;
  activePage: AppPage;
  onChangePage: (page: AppPage) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'graph', label: 'Live Graph Canvas', icon: Network },
  { id: 'anomalies', label: 'Anomaly Engine', icon: ShieldAlert },
  { id: 'stream', label: 'Event Stream', icon: Radio },
  { id: 'analytics', label: 'Algorithms & Centrality', icon: BarChart3 },
];

export const Header: React.FC<HeaderProps> = ({
  stats,
  isRunning,
  onTogglePlay,
  speedMs,
  onChangeSpeed,
  onTriggerScenario,
  onResetGraph,
  backendConnected,
  activePage,
  onChangePage,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="w-full glass-panel px-4 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/[0.08] sticky top-0 z-50">
      {/* Left: Brand Identity & Active Page Links */}
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        {/* Brand */}
        <div 
          onClick={() => onChangePage('overview')} 
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400/30 to-pink-600/20 border border-rose-400/40 shadow-[0_0_20px_rgba(247,138,156,0.35)] group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ping-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent dark:from-white dark:via-slate-100 dark:to-rose-200">
                AetherGraph
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Real-Time Graph Intelligence Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/[0.08]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangePage(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-500 dark:text-rose-400'}`} />
                <span>{item.label}</span>
                {item.id === 'anomalies' && stats.anomaliesDetected > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white text-rose-600 font-bold' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {stats.anomaliesDetected}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Controls, Attack Injector, Theme Switcher */}
      <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
        {/* Mobile Page Dropdown */}
        <div className="xl:hidden">
          <select
            value={activePage}
            onChange={(e) => onChangePage(e.target.value as AppPage)}
            className="bg-white/80 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
          >
            {NAV_ITEMS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        {/* Backend status badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] text-[11px]">
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
          <span className="text-slate-600 dark:text-slate-400">
            {backendConnected ? 'FastAPI WS Online' : 'Local In-Memory Stream'}
          </span>
        </div>

        {/* Live Stream Rate Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] text-xs">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
            {isRunning ? `${(1000 / speedMs).toFixed(1)} eps` : 'Paused'}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="hidden md:flex items-center bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-0.5 text-[11px]">
          {[
            { label: '1x', ms: 1800 },
            { label: '2x', ms: 900 },
            { label: '4x', ms: 450 },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => onChangeSpeed(s.ms)}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                speedMs === s.ms
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all border ${
            isRunning 
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25' 
              : 'bg-black/5 dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title={isRunning ? 'Pause stream' : 'Resume stream'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />}
          <span className="hidden sm:inline">{isRunning ? 'Live' : 'Paused'}</span>
        </button>

        {/* Attack Scenario Injector Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(247,138,156,0.35)] transition-all">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>Simulate Threat</span>
          </button>
          
          <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 border border-rose-500/30 shadow-2xl">
            <div className="px-3 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider">
              Inject Attack Scenarios
            </div>
            
            <button
              onClick={() => onTriggerScenario('lateral_movement')}
              className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/15 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-300 block">⚡ Lateral Movement Pivot</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Workstation Charlie bypassing gateway to Prod DB</span>
            </button>

            <button
              onClick={() => onTriggerScenario('credential_stuffing')}
              className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/15 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-300 block">💥 Credential Stuffing Burst</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">140+ auth attempts/s from bulletproof IP</span>
            </button>

            <button
              onClick={() => onTriggerScenario('dns_exfil')}
              className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/15 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-300 block">🛰️ DNS Tunneling Exfiltration</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Base64 encoded TXT payloads to C2 domain</span>
            </button>

            <button
              onClick={() => onTriggerScenario('privilege_escalation')}
              className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/15 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-300 block">🛡️ Token Privilege Escalation</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Contractor elevates directly to Global Admin</span>
            </button>
          </div>
        </div>

        {/* Reset Graph */}
        <button
          onClick={onResetGraph}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-slate-100 bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] transition-colors"
          title="Reset topology to baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Theme Switcher Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 bg-white/60 dark:bg-white/[0.06] border border-slate-300/60 dark:border-white/[0.1] shadow-sm transition-all hover:scale-105"
          title={`Switch to ${theme === 'dark' ? 'Light Minimal Pink' : 'Dark Obsidian'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-800" />
          )}
        </button>
      </div>
    </header>
  );
};
