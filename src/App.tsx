import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { LeftPanel } from './components/LeftPanel';
import { ChatArea } from './components/ChatArea';
import { FloatingWidget } from './components/FloatingWidget';
import { SettingsPanel } from './components/SettingsPanel';
import { Assistant } from './components/Assistant';
import { ParticleField } from './components/ParticleField';
import { TerminalPanel } from './components/TerminalPanel';
import { useStore } from './lib/store';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { connect, settings, chats, switchChat, terminalOpen } = useStore();

  useEffect(() => {
    connect(settings.serverUrl);
    const savedId = localStorage.getItem('llamacpp-active-chat');
    if (savedId && chats.find((c) => c.id === savedId)) {
      switchChat(savedId);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--vz-bg-primary)] text-[var(--vz-text-secondary)] overflow-hidden relative">
      <ParticleField />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[var(--vz-accent-vibrant)]/[0.03] rounded-full blur-[250px] pointer-events-none animate-glow-breathe" />
      <div className="fixed bottom-[-150px] right-[-150px] w-[500px] h-[400px] bg-[var(--vz-accent-vibrant)]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed top-1/3 left-[-100px] w-[300px] h-[300px] bg-[var(--vz-accent-vibrant)]/[0.015] rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar — floating gradient */}
        <TopBar onOpenSettings={() => setSettingsOpen(true)} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Left sidebar — slides in */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="shrink-0 border-r border-[var(--vz-border-color)]/10 overflow-hidden"
              >
                <LeftPanel onOpenSettings={() => setSettingsOpen(true)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center — chat area with floating widget */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <ChatArea onOpenPanel={() => setSettingsOpen(true)} />

            {/* Floating status widget */}
            <FloatingWidget />
          </div>
        </div>

        {/* Terminal panel — slides up */}
        <AnimatePresence>
          {terminalOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 220, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="shrink-0 border-t border-[var(--vz-border-color)]/20 overflow-hidden"
            >
              <TerminalPanel isOpen={terminalOpen} onClose={() => useStore.getState().setTerminalOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar — always visible */}
        <BottomBar onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Settings overlay — full screen backdrop */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md z-40"
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[720px] max-lg:w-full z-50 shadow-2xl shadow-black/90"
            >
              <SettingsPanel onClose={() => setSettingsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating assistant */}
      <Assistant />
    </div>
  );
}
