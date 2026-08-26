import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { profileStore } from '../lib/profile';

interface WeatherData {
  location: string;
  temp: string;
  feelsLike: string;
  condition: string;
  humidity: string;
  wind: string;
  windDir: string;
  uv: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (loc?: string) => {
    setLoading(true);
    setError(null);
    try {
      const profile = profileStore.get();
      const query = loc || (profile.latitude && profile.longitude ? `${profile.latitude},${profile.longitude}` : undefined);
      const url = query
        ? `https://wttr.in/${encodeURIComponent(query)}?format=j1`
        : 'https://wttr.in/?format=j1';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'curl/7.88.1' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const current = data.current_condition?.[0];
      const area = data.nearest_area?.[0];

      if (!current) throw new Error('No data');

      setWeather({
        location: area?.areaName?.[0]?.value || loc || 'Unknown',
        temp: current.temp_C,
        feelsLike: current.FeelsLikeC,
        condition: current.weatherDesc?.[0]?.value || 'Unknown',
        humidity: current.humidity,
        wind: current.windspeedKmph,
        windDir: current.winddir16Point,
        uv: current.uvIndex,
      });
    } catch (e) {
      setError(`Failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchWeather();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or lat,lon"
          className="flex-1 bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)] rounded-lg px-2 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/50 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchWeather(location);
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchWeather(location)}
          disabled={loading}
          className="p-1.5 rounded-lg bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)] text-[var(--vz-accent-vibrant)]/60 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer disabled:opacity-40"
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
        </motion.button>
      </div>

      {error && (
        <div className="text-[9px] font-mono text-red-400/60 text-center">{error}</div>
      )}

      {weather && !error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-[var(--vz-bg-secondary)]/50 border border-[var(--vz-border-color)]/50 p-2 space-y-2"
        >
          <div className="flex items-center gap-1.5">
            <MapPin size={9} className="text-[var(--vz-accent-vibrant)]/50" />
            <span className="text-[10px] font-mono text-[var(--vz-text-secondary)]/50 truncate">
              {weather.location}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-mono font-bold text-[var(--vz-accent-vibrant)]">
                {weather.temp}°C
              </div>
              <div className="text-[9px] font-mono text-[var(--vz-text-secondary)]/40">
                Feels {weather.feelsLike}°C
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-[var(--vz-text-secondary)]/60">
                {weather.condition}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-[var(--vz-text-secondary)]/40">
            <span>Humidity: {weather.humidity}%</span>
            <span>Wind: {weather.wind} km/h {weather.windDir}</span>
            <span>UV: {weather.uv}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
