export interface UserProfile {
  name: string;
  persona: string;
  preferredLanguage: string;
  interests: string[];
  customInstructions: string;
  avatarEmoji: string;
  timezone: string;
  latitude: string;
  longitude: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'llamacpp-profile';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  persona: '',
  preferredLanguage: 'English',
  interests: [],
  customInstructions: '',
  avatarEmoji: '🧑',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  latitude: '',
  longitude: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export const profileStore = {
  get(): UserProfile {
    return loadProfile();
  },

  update(partial: Partial<UserProfile>): UserProfile {
    const profile = loadProfile();
    Object.assign(profile, partial, { updatedAt: Date.now() });
    saveProfile(profile);
    return profile;
  },

  reset(): UserProfile {
    const profile = { ...DEFAULT_PROFILE, createdAt: Date.now(), updatedAt: Date.now() };
    saveProfile(profile);
    return profile;
  },

  /** Build a personalization block for system prompt injection */
  buildPersonalizationBlock(): string {
    const p = loadProfile();
    const lines: string[] = ['# User Profile'];

    if (p.name) lines.push(`Name: ${p.name}`);
    if (p.persona) lines.push(`About the user: ${p.persona}`);
    if (p.preferredLanguage) lines.push(`Preferred language: ${p.preferredLanguage}`);
    if (p.interests.length > 0) lines.push(`Interests: ${p.interests.join(', ')}`);
    if (p.latitude && p.longitude) lines.push(`Location: ${p.latitude}, ${p.longitude}`);
    if (p.customInstructions) lines.push(`Special instructions: ${p.customInstructions}`);
    lines.push(`Timezone: ${p.timezone}`);

    return lines.join('\n');
  },

  /** Build full personalized system prompt */
  buildPersonalizedSystemPrompt(basePrompt: string): string {
    const personalization = this.buildPersonalizationBlock();
    if (!personalization || personalization === '# User Profile') return basePrompt;
    return `${basePrompt}\n\n${personalization}`;
  },
};
