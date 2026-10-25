import { useEffect, useRef } from "react";

/**
 * Client-only single-property Leaflet map. Leaflet touches `window`, so the
 * library is loaded dynamically inside an effect and never runs during SSR.
 *
 * When `exact` is false we render an approximate-area circle instead of a
 * pin, so the precise location is not revealed.
 */
export function PropertyLocationMap({
  latitude,
  longitude,
  exact,
}: {
  latitude: number;
  longitude: number;
  exact: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: exact ? 16 : 14,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      if (exact) {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:14px">📍</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });
        L.marker([latitude, longitude], { icon }).addTo(map);
      } else {
        L.circle([latitude, longitude], {
          radius: 600,
          color: "hsl(var(--primary))",
          fillColor: "hsl(var(--primary))",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, exact]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-xl border border-border"
      style={{ zIndex: 0 }}
    />
  );
}
