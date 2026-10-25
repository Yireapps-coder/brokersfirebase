import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Mérida, Yucatán — sensible default centre for this market. */
const DEFAULT_CENTER: [number, number] = [20.9674, -89.5926];

type GeocodeResult = { lat: number; lng: number };

/**
 * Geocode a free-text address with OpenStreetMap Nominatim. Called only on
 * explicit user actions (search button) or once on mount when a property has
 * no coordinates yet — never in a loop — to respect Nominatim's usage policy.
 */
async function geocode(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number.parseFloat(data[0].lat);
    const lng = Number.parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Interactive map with a draggable pin for capturing a property's exact
 * coordinates in the CRM. Leaflet touches `window`, so it is loaded
 * dynamically inside an effect and never evaluates during SSR.
 */
export function PropertyLocationPicker({
  latitude,
  longitude,
  geocodeQuery,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  geocodeQuery?: string;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  // Keep the latest callback / props in refs so Leaflet handlers always read
  // fresh values without re-initialising the map.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const geocodeQueryRef = useRef(geocodeQuery);
  geocodeQueryRef.current = geocodeQuery;

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [autoLocating, setAutoLocating] = useState(false);

  function placeMarker(lat: number, lng: number, recenter: boolean) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!markerRef.current) {
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:14px">📍</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
      const marker = L.marker([lat, lng], { icon, draggable: true });
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (recenter) map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const hasCoords = latitude != null && longitude != null;
      const center: [number, number] = hasCoords
        ? [latitude as number, longitude as number]
        : DEFAULT_CENTER;

      const map = L.map(containerRef.current, {
        center,
        zoom: hasCoords ? 16 : 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Clicking the map drops / moves the pin.
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        placeMarker(e.latlng.lat, e.latlng.lng, false);
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      leafletRef.current = L;
      mapRef.current = map;

      if (hasCoords) {
        placeMarker(latitude as number, longitude as number, true);
      } else if (geocodeQueryRef.current && geocodeQueryRef.current.trim()) {
        // No saved coordinates: geocode the cascade address once as a starting
        // point. The agent then fine-tunes by dragging the pin.
        setAutoLocating(true);
        const hit = await geocode(geocodeQueryRef.current);
        setAutoLocating(false);
        if (!cancelled && hit) {
          placeMarker(hit.lat, hit.lng, true);
          onChangeRef.current(hit.lat, hit.lng);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    if (!search.trim() || searching) return;
    setSearching(true);
    const hit = await geocode(search);
    setSearching(false);
    if (hit) {
      placeMarker(hit.lat, hit.lng, true);
      onChangeRef.current(hit.lat, hit.lng);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Buscar dirección para centrar el mapa…"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={searching || !search.trim()}
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Buscar
        </Button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="h-80 w-full overflow-hidden rounded-xl border border-border"
          style={{ zIndex: 0 }}
        />
        {autoLocating && (
          <div className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            Ubicando dirección…
          </div>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Arrastra el pin o haz clic en el mapa para ajustar la ubicación exacta.
      </p>
    </div>
  );
}
