import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';

const RUNES = ["ᚦ","ᚧ","ᚨ","ᚱ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛈ","ᛇ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛝ","ᛟ","ᛞ"];

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 640 || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    f(); window.addEventListener('resize', f);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', f);
    return () => { window.removeEventListener('resize', f); mq.removeEventListener?.('change', f); };
  }, []);
  return m;
}

export function BackgroundEffect() {
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll();
  const yRange = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -80]);
  const ySpring = useSpring(yRange, { stiffness: isMobile ? 100 : 50, damping: 30 });

  const [massive] = useState(() => [...Array(isMobile ? 3 : 10)].map((_, i) => ({
    left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`,
    size: `${isMobile ? 6 + Math.random()*4 : 8 + Math.random() * 10}rem`, speed: 30 + i * 4, dir: i % 2 === 0 ? 1 : -1, rune: RUNES[i % RUNES.length],
  })));
  const [gridRunes] = useState(() => [...Array(isMobile ? 0 : 80)].map((_, i) => RUNES[i % RUNES.length]));

  if (isMobile && typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[var(--vz-bg-primary)]">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--vz-gradient-1) 0%, var(--vz-gradient-2) 50%, var(--vz-gradient-3) 100%)", opacity: 0.04 }} />
        <div className="absolute inset-0 bg-[var(--vz-bg-primary)]/50" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[var(--vz-bg-primary)] will-change-transform">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--vz-gradient-1) 0%, var(--vz-gradient-2) 50%, var(--vz-gradient-3) 100%)", opacity: isMobile ? 0.04 : 0.06 }} />
      <motion.div style={isMobile ? {} : { y: ySpring }} className="absolute inset-0">
        {massive.map((r, i) => (
          <motion.div
            key={i}
            className="absolute text-[var(--vz-accent-vibrant)] font-serif select-none opacity-[0.14] blur-[0.5px] drop-shadow-[0_0_8px_var(--vz-glow-color)] will-change-transform"
            style={{ fontSize: r.size, left: r.left, top: r.top }}
            animate={isMobile ? {} : { x: [0, r.dir * 30, 0], opacity: [0.1, 0.18, 0.1] }}
            transition={isMobile ? {} : { duration: r.speed, repeat: Infinity, ease: "easeInOut" }}
          >{r.rune}</motion.div>
        ))}
      </motion.div>
      {gridRunes.length > 0 && (
        <div className="absolute inset-0 opacity-[0.02] grid gap-10 p-6 rotate-12 scale-125 will-change-transform" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
          {gridRunes.map((r, i) => (
            <span key={i} className="text-lg font-serif text-[var(--vz-accent-vibrant)] text-center block opacity-40">{r}</span>
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-[var(--vz-bg-primary)]/50" />
    </div>
  );
}
