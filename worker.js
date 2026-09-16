// Cloudflare Worker: serves the static build and a server-side weather endpoint.
// Weather data is fetched from a public forecast service and cached at the edge.

const LAT = 31.7717;
const LON = 35.2394;
const CACHE_TTL = 1800; // seconds (30 minutes)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/weather') {
      return handleWeather(ctx);
    }

    // Everything else is served from the static assets.
    return env.ASSETS.fetch(request);
  }
};

async function handleWeather(ctx) {
  const endpoint =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${LAT}&longitude=${LON}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset' +
    '&timezone=auto&forecast_days=7';

  const cache = caches.default;
  const cached = await cache.match(endpoint);
  if (cached) {
    const age = Date.now() - new Date(cached.headers.get('date') || 0).getTime();
    if (age < CACHE_TTL * 1000) return cached;
  }

  try {
    const upstream = await fetch(endpoint, {
      headers: { 'User-Agent': 'gethsemane-guide/1.0 (+https://gethsemaneil.com)' }
    });
    if (!upstream.ok) throw new Error('upstream ' + upstream.status);
    const body = await upstream.text();

    const response = new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${CACHE_TTL}`,
        'date': new Date().toUTCString(),
        'access-control-allow-origin': '*'
      }
    });

    ctx.waitUntil(cache.put(endpoint, response.clone()));
    return response;
  } catch (err) {
    // If we have a stale cached copy, serve it rather than failing.
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'weather_unavailable' }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } }
    );
  }
}
