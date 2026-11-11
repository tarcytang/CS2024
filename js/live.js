/* =========================================================
   Live Singapore readings from data.gov.sg (NEA open data, no key needed).
   - Requests are made one at a time (data.gov.sg limits rapid requests without a key).
   - Each request is retried once, and results are cached for 10 minutes.
   - The reader searches the response for the value, so small API layout changes don't break it.
   - If PSI isn't available, PM2.5 is shown instead. If nothing loads, sample values are shown and labelled.
   Usage: elements with data-live="uv|uv-band|psi|psi-band|psi-label|temp|rh", data-live-advice, data-live-source
   ========================================================= */
(function () {
  const V2 = "https://api-open.data.gov.sg/v2/real-time/api/";
  const V1 = "https://api.data.gov.sg/v1/environment/";
  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function getJSON(url, tries = 2) {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) return await r.json();
      } catch (e) { /* network error, retry */ }
      await wait(1200);
    }
    throw new Error("Failed: " + url);
  }

  /* find the first object anywhere in the JSON that has this key */
  function findKey(obj, key) {
    if (!obj || typeof obj !== "object") return undefined;
    if (key in obj) return obj[key];
    for (const v of Object.values(obj)) { const f = findKey(v, key); if (f !== undefined) return f; }
    return undefined;
  }
  /* region object like {west: 40, east: 45, national: 44} -> national, or the average */
  function regionValue(o) {
    if (typeof o === "number") return o;
    if (!o || typeof o !== "object") return null;
    if (typeof o.national === "number") return o.national;
    const nums = Object.values(o).filter(v => typeof v === "number");
    return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  }
  /* station readings -> average of every "value" found */
  function stationAverage(j) {
    const vals = [];
    (function walk(x) {
      if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === "object") {
        if (typeof x.value === "number" && ("stationId" in x || "station_id" in x)) vals.push(x.value);
        Object.values(x).forEach(walk);
      }
    })(j);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  async function tryBoth(v2path, v1path, read) {
    try { const v = read(await getJSON(V2 + v2path)); if (v != null) return v; } catch (e) {}
    try { const v = read(await getJSON(V1 + v1path)); if (v != null) return v; } catch (e) {}
    return null;
  }

  const readUV = j => { const idx = findKey(j, "index"); return Array.isArray(idx) && idx.length ? idx[0].value : null; };
  const readPSI = j => regionValue(findKey(j, "psi_twenty_four_hourly"));
  const readPM = j => regionValue(findKey(j, "pm25_one_hourly"));

  const uvBand = v => v <= 2 ? "Low" : v <= 5 ? "Moderate" : v <= 7 ? "High" : v <= 10 ? "Very high" : "Extreme";
  const psiBand = v => v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 200 ? "Unhealthy" : v <= 300 ? "Very unhealthy" : "Hazardous";
  const pmBand = v => v <= 55 ? "Normal" : v <= 150 ? "Elevated" : v <= 250 ? "High" : "Very high";

  function advice(d) {
    if (d.uv != null && d.uv >= 6) return `UV is ${uvBand(d.uv).toLowerCase()}. Apply DD Cream SPF 30 before heading out, and reapply after two hours outdoors.`;
    if (d.psi != null && d.psi > 50) return "Air quality is moderate. Cleanse with the Creamy Wash tonight to clear pollutant build-up.";
    if (d.temp != null && d.temp >= 31) return "It's hot out. Keep the Face Mist handy to replace moisture lost to heat.";
    if (d.rh != null && d.rh < 65) return "The air is drier than usual. Add an extra layer of Mousse Moisturiser.";
    const h = +new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore", hour: "numeric", hour12: false });
    if (h >= 19 || h < 7) return "The sun is down, so UV is near zero. Time for your night routine: cleanse away the day's sweat and pollutants, then moisturise.";
    if (d.uv != null && d.uv <= 2) return "UV is low right now, often because of cloud or rain. Keep SPF on anyway, as UV can rise quickly when the sun comes out.";
    return "Conditions are mild right now. Stick to your usual routine and keep SPF on during the day.";
  }

  function render(d, sample, time) {
    const set = (k, val) => document.querySelectorAll(`[data-live="${k}"]`).forEach(el => el.textContent = val);
    set("uv", d.uv != null ? d.uv : "–");
    const sgHour = +new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore", hour: "numeric", hour12: false });
    const night = sgHour >= 19 || sgHour < 7;
    set("uv-band", d.uv != null ? (night && d.uv <= 1 ? "Low, sun is down" : uvBand(d.uv)) : "Measured 7am–7pm");
    if (d.psi != null) { set("psi-label", "PSI (24h)"); set("psi", d.psi); set("psi-band", psiBand(d.psi)); }
    else if (d.pm != null) { set("psi-label", "PM2.5 (1h)"); set("psi", d.pm); set("psi-band", pmBand(d.pm)); }
    else { set("psi", "–"); set("psi-band", "Not available right now"); }
    set("temp", d.temp != null ? d.temp.toFixed(1) + "°C" : "–");
    set("rh", d.rh != null ? Math.round(d.rh) + "%" : "–");
    document.querySelectorAll("[data-live-advice]").forEach(el => el.textContent = advice(d));
    document.querySelectorAll("[data-live-source]").forEach(el => {
      el.textContent = sample ? "Sample readings shown. Live data loads when the site is online."
        : "Live from NEA via data.gov.sg, updated " + new Date(time).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
    });
  }

  async function load() {
    if (!document.querySelector("[data-live]")) return;
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("dekatre_live")); } catch (e) {}
    if (cached && Date.now() - cached.time < 10 * 60 * 1000) return render(cached.d, false, cached.time);

    const d = {};
    d.uv = await tryBoth("uv", "uv-index", readUV);
    d.psi = await tryBoth("psi", "psi", readPSI);
    if (d.psi == null) d.pm = await tryBoth("pm25", "pm25", readPM);
    d.temp = await tryBoth("air-temperature", "air-temperature", stationAverage);
    d.rh = await tryBoth("relative-humidity", "relative-humidity", stationAverage);

    const nothing = [d.uv, d.psi, d.pm, d.temp, d.rh].every(v => v == null);
    if (nothing) return render({ uv: 8, psi: 48, temp: 31.4, rh: 74 }, true);
    const time = Date.now();
    try { sessionStorage.setItem("dekatre_live", JSON.stringify({ d, time })); } catch (e) {}
    render(d, false, time);
  }
  document.addEventListener("DOMContentLoaded", load);
})();
