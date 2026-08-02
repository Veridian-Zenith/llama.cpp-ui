import type { ToolResult } from './types';

export async function getWeather(args: {
  location?: string;
  format?: 'text' | 'json';
}): Promise<ToolResult> {
  const { location = '', format = 'text' } = args;

  try {
    let url: string;
    if (location) {
      const encoded = encodeURIComponent(location);
      url = `https://wttr.in/${encoded}?format=${format === 'json' ? 'j1' : '4'}`;
    } else {
      url = `https://wttr.in/?format=${format === 'json' ? 'j1' : '4'}`;
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'curl/7.88.1',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { output: '', error: `Weather fetch failed: ${res.status}` };
    }

    const text = await res.text();

    if (format === 'json') {
      try {
        const data = JSON.parse(text);
        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];

        if (!current) {
          return { output: text, metadata: { source: 'wttr.in' } };
        }

        const locationName = area?.areaName?.[0]?.value || location || 'Unknown';
        const country = area?.country?.[0]?.value || '';

        const formatted = [
          `Weather for ${locationName}, ${country}`,
          '',
          `Temperature: ${current.temp_C}°C (${current.temp_F}°F)`,
          `Feels like: ${current.FeelsLikeC}°C`,
          `Condition: ${current.weatherDesc?.[0]?.value || 'Unknown'}`,
          `Humidity: ${current.humidity}%`,
          `Wind: ${current.windspeedKmph} km/h ${current.winddir16Point}`,
          `Visibility: ${current.visibility} km`,
          `UV Index: ${current.uvIndex}`,
          `Pressure: ${current.pressure} hPa`,
          `Cloud cover: ${current.cloudcover}%`,
        ].join('\n');

        return { output: formatted, metadata: { source: 'wttr.in', location: locationName } };
      } catch {
        return { output: text, metadata: { source: 'wttr.in' } };
      }
    }

    return { output: text, metadata: { source: 'wttr.in' } };
  } catch (e) {
    return { output: '', error: `Weather error: ${e}` };
  }
}
