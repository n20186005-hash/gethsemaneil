// Static Astro assets and the existing same-origin Open-Meteo endpoint.
const HOST = 'gethsemaneil.com';
const LAT = 31.7793098;
const LON = 35.2397801;
const TTL = 1800;
const endpoint = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: String(LAT), longitude: String(LON),
  current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m',
  daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
  timezone: 'Asia/Jerusalem', forecast_days: '7'
});
function valid(data, now = Date.now()) {
  const cur = data?.current;
  const day = data?.daily;
  const offset = data?.utc_offset_seconds;
  if (!cur || !day || ![7200,10800].includes(offset) || typeof cur.time !== 'string' || !Number.isFinite(cur.temperature_2m)) return false;
  const stamp = Date.parse(cur.time + (/Z$|[+-]\d\d:\d\d$/.test(cur.time) ? '' : 'Z')) - (/Z$|[+-]\d\d:\d\d$/.test(cur.time) ? 0 : offset*1000);
  if (!Number.isFinite(stamp) || Math.abs(now-stamp)>3*3600000) return false;
  if (!Array.isArray(day.time) || !day.time.length || day.time.length>7 || day.time.some(d=>typeof d!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))) return false;
  if (day.time[0]!==new Date(now+offset*1000).toISOString().slice(0,10)) return false;
  return ['weather_code','temperature_2m_max','temperature_2m_min','precipitation_probability_max','uv_index_max'].every(k=>Array.isArray(day[k]) && day[k].length===day.time.length && day[k].every(v=>v===null || Number.isFinite(v)));
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if ((url.hostname===HOST && url.protocol!=='https:') || url.hostname==='www.'+HOST) {
      url.protocol='https:';url.hostname=HOST;url.port='';return Response.redirect(url.toString(),301);
    }
    if (url.pathname==='/api/weather') {
      if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
      const response=await handleWeather(ctx);
      return request.method==='HEAD' ? new Response(null,{status:response.status,headers:response.headers}) : response;
    }
    const errorRoute=['/404','/404/','/404.html'].includes(url.pathname);
    if(errorRoute)url.pathname='/404';
    const response=await env.ASSETS.fetch(errorRoute ? new Request(url,request) : request);
    if(response.status===404 || errorRoute){const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex');return new Response(response.body,{status:404,headers});}
    return response;
  }
};
async function handleWeather(ctx) {
  const cache=caches.default;
  try {
    const cached=await cache.match(endpoint);
    if(cached){const at=Date.parse(cached.headers.get('X-Weather-Fetched-At')||'');if(Number.isFinite(at)&&Date.now()-at>=0&&Date.now()-at<TTL*1000&&valid(await cached.clone().json()))return cached;}
  } catch { /* A cache error cannot make stale weather usable. */ }
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try {
    const upstream=await fetch(endpoint,{signal:controller.signal,headers:{'User-Agent':'gethsemane-guide/1.0 (+https://gethsemaneil.com)'}});
    if(!upstream.ok)throw Error('upstream');
    const data=await upstream.json();if(!valid(data))throw Error('unavailable weather data');
    const response=new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=${TTL}`,'X-Weather-Fetched-At':new Date().toISOString(),'X-Robots-Tag':'noindex'}});
    ctx.waitUntil(cache.put(endpoint,response.clone()).catch(()=>{}));return response;
  } catch {
    return new Response(JSON.stringify({error:'weather_unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  } finally {clearTimeout(timer);}
}
