import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HotspotItem } from '@/data/surveyWorkflowData';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';

interface DebrisHotspotMapProps {
  hotspots: HotspotItem[];
  selectedHotspotId: string;
  onSelectHotspot: (id: string) => void;
  mapMode: 'map' | 'satellite';
  onToggleMapMode: (mode: 'map' | 'satellite') => void;
}

export default function DebrisHotspotMap({
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  mapMode,
  onToggleMapMode,
}: DebrisHotspotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Default survey overview center (Arabian Sea off southwest coast of India)
  const defaultCenterLat = 14.0;
  const defaultCenterLng = 72.8;
  const defaultZoom = 6;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [defaultCenterLat, defaultCenterLng],
      zoom: defaultZoom,
      zoomControl: false, // custom zoom buttons matching mockup
      attributionControl: false, // clean presentation
    });

    // Create layer group for pins and circles
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url: string;
    let maxZoom = 18;

    if (mapMode === 'satellite') {
      // High-resolution Esri World Imagery (satellite) - 100% free, no API key required
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
    } else {
      // OpenStreetMap standard tiles - 100% free, no API key required
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    }

    const newTileLayer = L.tileLayer(url, {
      maxZoom,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapMode]);

  // Update Hotspot Clusters and Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    hotspots.forEach((spot) => {
      const isSelected = spot.id === selectedHotspotId;

      // Color scheme based on priority
      const primaryColor =
        spot.priority === 'High'
          ? '#EF4444' // Rose Red
          : spot.priority === 'Medium'
          ? '#F97316' // Orange
          : '#EAB308'; // Amber/Yellow

      // 1. Outer heat glow circle
      const outerGlow = L.circle([spot.lat, spot.lng], {
        radius: 900,
        color: primaryColor,
        weight: 0,
        fillColor: primaryColor,
        fillOpacity: isSelected ? 0.28 : 0.16,
      }).addTo(layerGroup);

      // 2. Mid cluster boundary circle (dashed)
      const boundaryCircle = L.circle([spot.lat, spot.lng], {
        radius: 650,
        color: isSelected ? '#38BDF8' : primaryColor,
        weight: isSelected ? 2.5 : 1.5,
        dashArray: '5, 6',
        fillColor: primaryColor,
        fillOpacity: isSelected ? 0.35 : 0.22,
      }).addTo(layerGroup);

      // 3. Core heat circle
      const coreCircle = L.circle([spot.lat, spot.lng], {
        radius: 350,
        color: '#EF4444',
        weight: 0,
        fillColor: '#EF4444',
        fillOpacity: isSelected ? 0.45 : 0.3,
      }).addTo(layerGroup);

      // Clicking circle selects hotspot
      [outerGlow, boundaryCircle, coreCircle].forEach((circle) => {
        circle.on('click', () => {
          onSelectHotspot(spot.id);
          map.flyTo([spot.lat, spot.lng], 14, { duration: 1 });
        });
      });

      // 4. Cluster Label Badge (HTML DivIcon)
      const badgeIcon = L.divIcon({
        className: 'custom-hotspot-label',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            background: ${isSelected ? '#0284C7' : 'rgba(15, 23, 42, 0.92)'};
            color: #ffffff;
            font-family: ui-monospace, monospace;
            font-size: 11px;
            font-weight: 700;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 1.5px solid ${isSelected ? '#38BDF8' : 'rgba(255,255,255,0.25)'};
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>${spot.code}</span>
            <span style="font-size: 9px; opacity: 0.85;">(${spot.priority})</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const labelMarker = L.marker([spot.lat, spot.lng], {
        icon: badgeIcon,
        zIndexOffset: isSelected ? 1000 : 500,
      }).addTo(layerGroup);

      labelMarker.on('click', () => {
        onSelectHotspot(spot.id);
        map.flyTo([spot.lat, spot.lng], 14, { duration: 1 });
      });

      // 5. Individual debris pins inside cluster
      spot.pins.forEach((pin) => {
        let pinColor = '#EF4444'; // confirmed
        let pinLabel = 'Confirmed Debris';
        if (pin.type === 'probable') {
          pinColor = '#F59E0B';
          pinLabel = 'Probable Debris';
        } else if (pin.type === 'novel') {
          pinColor = '#FACC15';
          pinLabel = 'Novel Candidate';
        } else if (pin.type === 'non-debris') {
          pinColor = '#94A3B8';
          pinLabel = 'Reviewed (Non-debris)';
        }

        const marker = L.circleMarker([pin.lat, pin.lng], {
          radius: 6.5,
          color: '#ffffff',
          weight: 2,
          fillColor: pinColor,
          fillOpacity: 1,
        }).addTo(layerGroup);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
            <div style="font-weight: bold; color: #0F172A;">${pinLabel}</div>
            <div style="color: #64748B; font-family: monospace; font-size: 10px; margin-top: 2px;">
              ${pin.lat.toFixed(4)}°N, ${pin.lng.toFixed(4)}°E
            </div>
            <div style="color: #0284C7; font-size: 10px; margin-top: 2px; font-weight: 600;">
              Cluster: ${spot.code} (${spot.priority})
            </div>
          </div>
        `);
      });
    });
  }, [hotspots, selectedHotspotId, onSelectHotspot]);

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo([defaultCenterLat, defaultCenterLng], defaultZoom, { duration: 1.2 });
  };

  return (
    <div className="relative flex-1 min-h-[500px] w-full bg-[#071927] overflow-hidden select-none">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating Map Zoom & Recenter Controls (Top Right) */}
      <div className="absolute top-4 right-4 bg-navy-900/85 backdrop-blur-xs border border-navy-700/60 rounded-md p-1 flex flex-col gap-1 text-white shadow-md z-[500]">
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-navy-800 rounded text-ocean-200 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-navy-800 rounded text-ocean-200 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleRecenter}
          className="p-1.5 hover:bg-navy-800 rounded text-ocean-200 transition-colors"
          title="Recenter Map"
        >
          <Crosshair size={15} />
        </button>
      </div>

      {/* Floating Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 bg-navy-900/90 backdrop-blur-xs border border-navy-700/70 rounded-lg p-2.5 text-xs text-white shadow-lg z-[500] space-y-1.5 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          <span className="text-[11px] text-slate-200">Confirmed Debris</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
          <span className="text-[11px] text-slate-200">Probable Debris</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white" />
          <span className="text-[11px] text-slate-200">Novel Candidate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
          <span className="text-[11px] text-slate-200">Reviewed (Non-debris)</span>
        </div>
      </div>

      {/* Real Scale Bar / Coordinate HUD (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-navy-900/90 backdrop-blur-xs border border-navy-700/70 rounded px-2.5 py-1 text-[11px] font-mono text-ocean-200 flex items-center gap-2 shadow-lg z-[500]">
        <div className="w-12 h-1 bg-white rounded-full" />
        <span>1 km</span>
        <span className="text-navy-400">|</span>
        <span className="text-[10px] text-slate-300">OpenStreetMap / Esri</span>
      </div>
    </div>
  );
}
