import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { LeftPanel } from './components/LeftPanel';
import { ChatArea } from './components/ChatArea';
import { FloatingWidget } from './components/FloatingWidget';
import { BackgroundEffect } from './components/BackgroundEffect';
import { useStore } from './lib/store';

const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TerminalPanel = lazy(() => import('./components/TerminalPanel').then(m => ({ default: m.TerminalPanel })));
const Assistant = lazy(() => import('./components/Assistant').then(m => ({ default: m.Assistant })));

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const connect = useStore((state) => state.connect);
  const settings = useStore((state) => state.settings);
  const chats = useStore((state) => state.chats);
  const switchChat = useStore((state) => state.switchChat);
  const terminalOpen = useStore((state) => state.terminalOpen);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    const savedAtmo = localStorage.getItem('llamacpp-atmosphere');
    if (savedAtmo) document.documentElement.classList.add(savedAtmo);
  }, []);

  useEffect(() => {
    connect(settings.serverUrl);
    const savedId = localStorage.getItem('llamacpp-active-chat');
    if (savedId && chats.find((c) => c.id === savedId)) {
      switchChat(savedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  return (
    <div className="h-screen flex flex-col bg-[var(--vz-bg-primary)] text-[var(--vz-text-secondary)] overflow-hidden relative">
      <BackgroundEffect />

      {/* Ambient glow orbs — subtler, behind runes */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[var(--vz-accent-vibrant)]/[0.02] rounded-full blur-[250px] pointer-events-none" />
      <div className="fixed bottom-[-150px] right-[-150px] w-[500px] h-[400px] bg-[var(--vz-accent-vibrant)]/[0.015] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar — floating gradient */}
        <TopBar onOpenSettings={() => setSettingsOpen(true)} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Desktop sidebar — fluid width, GPU transform slide */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="hidden md:flex shrink-0 border-r border-[var(--vz-border-color)]/10 overflow-hidden w-[clamp(220px,18vw,280px)] will-change-transform"
              >
                <LeftPanel onOpenSettings={() => setSettingsOpen(true)} />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Mobile drawer — same style, overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="fixed left-0 top-0 bottom-0 w-[clamp(260px,75vw,320px)] max-w-[85vw] z-40 border-r border-[var(--vz-border-color)]/10 bg-[var(--vz-bg-primary)] md:hidden overflow-hidden shadow-2xl will-change-transform"
                >
                  <LeftPanel onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }} />
                </motion.div>
              </>
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
              <Suspense fallback={null}>
                <TerminalPanel isOpen={terminalOpen} onClose={() => useStore.getState().setTerminalOpen(false)} />
              </Suspense>
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
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[640px] max-w-[96vw] z-50 shadow-2xl shadow-black/90"
            >
              <Suspense fallback={<div className="p-6 text-sm text-[var(--vz-text-secondary)]/40">Loading…</div>}>
                <SettingsPanel onClose={() => setSettingsOpen(false)} />
              </Suspense>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating assistant */}
      <Suspense fallback={null}>
        <Assistant />
      </Suspense>
    </div>
  );
}
