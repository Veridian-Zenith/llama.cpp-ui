import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Plus, X } from 'lucide-react';
import { profileStore, type UserProfile } from '../lib/profile';

export function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>(() => profileStore.get());
  const [newInterest, setNewInterest] = useState('');

  const update = (partial: Partial<UserProfile>) => {
    const updated = profileStore.update(partial);
    setProfile(updated);
  };

  const reset = () => {
    if (confirm('Reset profile to defaults?')) {
      const fresh = profileStore.reset();
      setProfile(fresh);
    }
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    const interests = [...profile.interests, newInterest.trim()];
    update({ interests });
    setNewInterest('');
  };

  const removeInterest = (idx: number) => {
    const interests = profile.interests.filter((_, i) => i !== idx);
    update({ interests });
  };

  return (
    <div className="space-y-3">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 flex items-center justify-center text-lg">
          {profile.avatarEmoji}
        </div>
        <div className="flex-1">
          <input
            type="text" value={profile.name} onChange={(e) => update({ name: e.target.value })}
            placeholder="Your name"
            className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
          />
        </div>
      </div>

      {/* Emoji picker (simple) */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">Avatar</span>
        <div className="flex flex-wrap gap-1">
          {['🧑', '👩', '👨', '🤖', '🧠', '⚡', '🔥', '💎', '🦊', '🐱', '🐙', '🌙'].map((e) => (
            <button
              key={e}
              onClick={() => update({ avatarEmoji: e })}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer ${
                profile.avatarEmoji === e
                  ? 'bg-[var(--vz-accent-vibrant)]/15 border border-[var(--vz-accent-vibrant)]/40'
                  : 'bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/30 hover:border-[var(--vz-accent-vibrant)]/20'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Persona */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">About you</span>
        <textarea
          value={profile.persona} onChange={(e) => update({ persona: e.target.value })}
          placeholder="I'm a software engineer who likes..."
          rows={2}
          className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-2 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors resize-none"
        />
      </div>

      {/* Language */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">Preferred language</span>
        <input
          type="text" value={profile.preferredLanguage} onChange={(e) => update({ preferredLanguage: e.target.value })}
          placeholder="English"
          className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
        />
      </div>

      {/* Location (lat/long) */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">Location</span>
        <div className="flex gap-1.5">
          <input
            type="text" value={profile.latitude} onChange={(e) => update({ latitude: e.target.value })}
            placeholder="Latitude"
            className="flex-1 bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
          />
          <input
            type="text" value={profile.longitude} onChange={(e) => update({ longitude: e.target.value })}
            placeholder="Longitude"
            className="flex-1 bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">Interests</span>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {profile.interests.map((interest, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/20 text-[10px] font-mono text-[var(--vz-accent-vibrant)]/70">
              {interest}
              <button onClick={() => removeInterest(i)} className="text-[var(--vz-accent-vibrant)]/40 hover:text-red-400 cursor-pointer"><X size={9} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add interest..."
            className="flex-1 bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-2.5 py-1 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40"
            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
          />
          <motion.button whileTap={{ scale: 0.95 }} onClick={addInterest}
            className="px-2 rounded-lg bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)] text-[10px] font-bold cursor-pointer">
            <Plus size={11} />
          </motion.button>
        </div>
      </div>

      {/* Custom instructions */}
      <div>
        <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider block mb-1">Custom instructions</span>
        <textarea
          value={profile.customInstructions} onChange={(e) => update({ customInstructions: e.target.value })}
          placeholder="Always respond in code blocks..."
          rows={3}
          className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-2 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors resize-none"
        />
      </div>

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={reset}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 text-[10px] font-bold text-red-400/50 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
      >
        <RotateCcw size={10} /> Reset Profile
      </motion.button>
    </div>
  );
}
