# Gethsemane independent visitor guide

An independent nonprofit tourism and educational information guide in Hebrew. It is not the sanctuary, the Church of All Nations, the Custody of the Holy Land or a ticketing service.

## Architecture and commands

The existing static Astro site and same-origin Cloudflare Worker weather endpoint are retained. Node22.13.0, pnpm11.24.0, all exact direct dependency versions, the lockfile and the existing supply-chain/install-script policies are unchanged.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm run build
npx wrangler deploy --dry-run
npx wrangler dev --local --port 8929
```

Cloudflare project: `gethsemaneil`, matching the successful historical connected build. The previous source name `gethsemane-guide` was overridden by CI; the configuration now names the actual project. The compatibility date, ASSETS binding and native static build remain. No new external service/storage/domain binding was added. The Worker runs before assets to canonicalize the established HTTP/www entrances and preserve genuine noindex404 responses.

## Source and scope

- The garden, Church of All Nations/Basilica of the Agony and Grotto of Gethsemane are distinct entities.
- The operator’s sanctuary/grotto schedules and the Christian Information Center’s church/grotto schedules differ. The dated public table preserves their scopes and differences rather than inventing one recurring schedule. No unconditional openingHours or free-entry schema is emitted.
- The dated Google Maps rating/count is attributed to Maps and is not guide-owned review data. The map point is not an entrance or parking certification.
- Exact walking durations, facility guarantees, flat accessible routes, unsupported parking/transit and seasonal crowd claims were removed or qualified.
- The former four JPEGs had no established source/license. They and all derived references were removed; [CREDITS.md](CREDITS.md) documents the original CC0 symbolic olive illustration and its raster social preview. It is explicitly not a photograph or map.
- Existing automatic Google Analytics remains. Public privacy text describes analytics, Cloudflare hosting and the server-side weather connection; Maps is now an external link only.
- Open-Meteo model weather is requested for the fixed Maps area point. It is not a garden weather station, a weather warning or proof of site access. Invalid, expired and failed responses stay unavailable. The server has bounded fresh caching only; the client clears old values on failure and shows model/cache time. WMO intensity/thunder cues are separate from rain probability.
- The service worker retires legacy caches and performs no request interception.

Local check/build, protocol/weather fixtures, browser acceptance, deployment and production verification are separate gates. A dry-run does not publish. Use the connected browser for responsive, keyboard/touch, image and current-page visual checks before any authorized release.
