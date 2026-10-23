import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
export function LocationMapCenter({
  latitude,
  longitude
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(container);
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}
export function LocationClickHandler({
  onSelect
}) {
  useMapEvents({
    click: event => onSelect({
      latitude: event.latlng.lat,
      longitude: event.latlng.lng
    })
  });
  return null;
}
