import { useEffect, useRef } from "react";

import { formatPrice } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/property-catalog";
import type { PropertyType } from "@/lib/property-catalog";
import type { PropertyMapPoint } from "@/lib/api/public.functions";

const OPERATION_SHORT: Record<string, string> = { venta: "Venta", renta: "Renta" };

/**
 * Client-only Leaflet map with proximity marker clustering.
 * Leaflet touches `window`, so everything is loaded dynamically inside an
 * effect — the module never evaluates during SSR.
 */
export function PropertiesMap({ points }: { points: PropertyMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [23.6345, -102.5528], // Mexico
        zoom: 5,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
      });
      map.addLayer(cluster);

      leafletRef.current = L;
      mapRef.current = map;
      clusterRef.current = cluster;
      renderMarkers();
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers whenever the filtered point set changes.
  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  function renderMarkers() {
    const L = leafletRef.current;
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!L || !cluster || !map) return;

    cluster.clearLayers();
    if (points.length === 0) return;

    const icon = L.divIcon({
      className: "",
      html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:13px">📍</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26],
    });

    for (const p of points) {
      const op = OPERATION_SHORT[p.operation_type] ?? p.operation_type;
      const type = propertyTypeLabel(p.property_type as PropertyType);
      const price =
        p.publish_prices && p.price != null
          ? formatPrice(p.price, p.currency)
          : "Precio a consultar";
      const marker = L.marker([p.latitude, p.longitude], { icon });
      marker.bindPopup(
        `<div style="min-width:160px">
          <div style="font-size:11px;color:#64748b">${op} · ${type}</div>
          <a href="/propiedades/${p.slug}" style="font-weight:600;color:#1B4F8A;text-decoration:none">${p.title}</a>
          <div style="font-weight:700;margin-top:2px">${price}</div>
        </div>`,
      );
      cluster.addLayer(marker);
    }

    const bounds = cluster.getBounds();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-[70vh] w-full overflow-hidden rounded-xl border border-border"
      style={{ zIndex: 0 }}
    />
  );
}
