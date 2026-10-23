import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Plus, X } from "lucide-react";
import { Circle, CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { apiRequest } from "../../shared/api.js";
import { LocationMapCenter, LocationClickHandler } from "./ProjectMap.jsx";
export function ProjectDialog({
  onClose,
  onSubmit,
  role,
  token
}) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(100);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [managerOptions, setManagerOptions] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState([]);
  const [managerLoading, setManagerLoading] = useState(role === "admin");
  const [managerError, setManagerError] = useState("");
  const locationRequestStarted = useRef(false);
  const hasLocation = latitude !== "" && longitude !== "";
  const mapCenter = hasLocation ? [Number(latitude), Number(longitude)] : [37.7895, -122.4012];
  const matchingManagers = managerOptions.filter(manager => manager.name.toLowerCase().includes(managerSearch.trim().toLowerCase()));
  const selectedManagers = selectedManagerIds.map(id => managerOptions.find(manager => String(manager._id) === id)).filter(Boolean);
  useEffect(() => {
    if (role !== "admin" || !token) return undefined;
    const controller = new AbortController();
    apiRequest("/api/users/project-managers", token, {
      signal: controller.signal
    }).then(({
      managers
    }) => setManagerOptions(managers || [])).catch(error => {
      if (error.name !== "AbortError") setManagerError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setManagerLoading(false);
    });
    return () => controller.abort();
  }, [role, token]);
  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      setLocationError("This device or browser does not support location access.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(({
      coords
    }) => {
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
      setLocationLoading(false);
    }, error => {
      setLocationError(error.message || "Unable to get the device location.");
      setLocationLoading(false);
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  };
  useEffect(() => {
    if (locationRequestStarted.current) return;
    locationRequestStarted.current = true;
    captureCurrentLocation();
  }, []);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PROJECT SETUP</span>
            <h2 id="dialog-title">Create a project</h2>
            <p>Start a new site record for your team and client.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <label>
            Project name
            <input name="projectName" placeholder="e.g. Harbor Point Residences" required autoFocus />
          </label>
          <label>
            Client name
            <input name="clientName" placeholder="Client or organization" required />
          </label>
          <div className="form-row">
            <label>Client contact<input name="contactName" placeholder="Contact name" /></label>
            <label>Contact email<input name="contactEmail" type="email" placeholder="client@company.com" /></label>
          </div>
          <label>Contact phone<input name="contactPhone" type="tel" placeholder="(555) 000-0000" /></label>
          <label>
            Project address
            <input name="address" placeholder="Street address, city, state" required />
          </label>
          <label>Project description<textarea name="description" rows="3" placeholder="Scope, instructions, or site requirements" /></label>
          {role === "admin" && <div className="project-manager-assignment">
              <label htmlFor="project-manager-search">Assign Project Managers</label>
              <div className="project-manager-search-wrap">
                <input id="project-manager-search" type="search" value={managerSearch} placeholder="Search project managers by name" autoComplete="off" aria-autocomplete="list" aria-controls="project-manager-options" aria-expanded={Boolean(managerSearch.trim())} onChange={event => setManagerSearch(event.target.value)} />
                {managerSearch.trim() && <div id="project-manager-options" className="project-manager-options" role="listbox" aria-label="Matching project managers" aria-multiselectable="true">
                    {matchingManagers.map(manager => {
                const id = String(manager._id);
                const selected = selectedManagerIds.includes(id);
                return <button key={id} type="button" role="option" aria-selected={selected} className="project-manager-option" onClick={() => setSelectedManagerIds(ids => selected ? ids.filter(selectedId => selectedId !== id) : [...ids, id])}>
                          <span className={`manager-option-check ${selected ? "manager-option-selected" : ""}`} aria-hidden="true">{selected ? <Check size={12} /> : null}</span>
                          <span>{manager.name}</span>
                        </button>;
              })}
                    {!managerLoading && !matchingManagers.length && <span className="manager-dropdown-empty">No matching project managers.</span>}
                  </div>}
              </div>
              {managerLoading && <span className="project-manager-status" role="status">Loading project managers…</span>}
              {managerError && <span className="data-error" role="alert">{managerError}</span>}
              {selectedManagers.length > 0 && <div className="project-manager-selected" aria-label="Selected project managers">
                  {selectedManagers.map(manager => <span key={manager._id} className="project-manager-chip">
                      {manager.name}
                      <button type="button" aria-label={`Remove ${manager.name}`} onClick={() => setSelectedManagerIds(ids => ids.filter(id => id !== String(manager._id)))}><X size={12} /></button>
                    </span>)}
                </div>}
              {selectedManagerIds.map(id => <input key={id} type="hidden" name="assignedManagers" value={id} />)}
            </div>}
          <div className="site-coordinate-grid">
            <MapContainer className="site-map" center={mapCenter} zoom={14} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMapCenter latitude={mapCenter[0]} longitude={mapCenter[1]} />
              <LocationClickHandler onSelect={point => {
              setLatitude(point.latitude);
              setLongitude(point.longitude);
              setLocationError("");
            }} />
              {hasLocation && <Circle center={mapCenter} radius={Number(radius) || 100} pathOptions={{
              color: "#e87524",
              fillColor: "#e87524",
              fillOpacity: 0.12
            }} />}
              {hasLocation && <CircleMarker center={mapCenter} radius={7} pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#e87524",
              fillOpacity: 1
            }} />}
            </MapContainer>
            <div className="site-coordinate-fields">
              <label>GPS latitude<input name="latitude" type="number" min="-90" max="90" step="any" placeholder={locationLoading ? "Getting device location…" : "Click the map to set"} value={latitude} onChange={event => setLatitude(event.target.value)} required /></label>
              <label>GPS longitude<input name="longitude" type="number" min="-180" max="180" step="any" placeholder={locationLoading ? "Getting device location…" : "Click the map to set"} value={longitude} onChange={event => setLongitude(event.target.value)} required /></label>
              <button type="button" className="button button-secondary" onClick={captureCurrentLocation} disabled={locationLoading}>
                <MapPin size={16} />
                {locationLoading ? "Getting location…" : "Use current location"}
              </button>
              {locationLoading && <span role="status">Capturing this device’s current location…</span>}
              {locationError && <span className="data-error" role="alert">{locationError} Allow location access or select the site on the map.</span>}
              <label>Attendance radius<div className="input-suffix"><input name="radiusMetres" type="number" min="1" max="1000" value={radius} onChange={event => setRadius(event.target.value)} required /><span>metres</span></div></label>
            </div>
          </div>
          <div className="form-row">
            <label>
              Estimated start
              <input name="startDate" type="date" required />
            </label>
            <label>
              Estimated finish
              <input name="endDate" type="date" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Budget
              <input name="budget" type="number" min="0" step="0.01" placeholder="0.00" inputMode="decimal" />
            </label>
            <label>
              Priority
              <select name="priority" defaultValue="standard">
                <option value="low">Low</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <label>Project document links<input name="attachments" placeholder="Optional document URLs, separated by commas" /></label>
          <div className="location-note">
            <MapPin size={17} />
            <span>
              Attendance check-in is limited to the configured radius. The site coordinates are verified by the server on every check-in.
            </span>
          </div>
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" name="saveDraft" value="true" disabled={locationLoading || !hasLocation} onClick={event => {
            const form = event.currentTarget.closest("form");
            const draft = document.createElement("input");
            draft.type = "hidden";
            draft.name = "saveDraft";
            draft.value = "true";
            form.appendChild(draft);
            form.requestSubmit();
          }}>
              Save as draft
            </button>
            <button type="submit" className="button button-primary" disabled={locationLoading || !hasLocation}>
              <Plus size={16} />
              Create project
            </button>
          </div>
        </form>
      </section>
    </div>;
}
