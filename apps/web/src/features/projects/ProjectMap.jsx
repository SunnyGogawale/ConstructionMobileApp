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
