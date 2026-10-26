import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, MapPin, X } from "lucide-react";
import { displayDateTime } from "../../shared/formatters.js";

function pdfBytesForJpeg(jpegBytes, width, height, details) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const scale = Math.min((pageWidth - 60) / width, (pageHeight - 150) / height);
  const imageWidth = width * scale;
  const imageHeight = height * scale;
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = 35 + (pageHeight - 150 - imageHeight) / 2;
  const encoder = new TextEncoder();
  const pdfText = value => String(value).replace(/[^\x20-\x7e]/g, "?").replace(/([\\()])/g, "\\$1");
  const textContent = details.map((line, index) => `BT\n/F1 10 Tf\n42 ${pageHeight - 32 - index * 15} Td\n(${pdfText(line)}) Tj\nET`).join("\n");
  const imageContent = `q\n${imageWidth} 0 0 ${imageHeight} ${imageX} ${imageY} cm\n/Im0 Do\nQ`;
  const content = encoder.encode(`${textContent}\n${imageContent}`);
  const objects = [
    encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"),
    encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 6 0 R >> /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
    null,
    null,
    encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  ];
  const imagePrefix = encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  const imageSuffix = encoder.encode("\nendstream");
  objects[3] = new Uint8Array(imagePrefix.length + jpegBytes.length + imageSuffix.length);
  objects[3].set(imagePrefix);
  objects[3].set(jpegBytes, imagePrefix.length);
  objects[3].set(imageSuffix, imagePrefix.length + jpegBytes.length);
  const contentPrefix = encoder.encode(`<< /Length ${content.length} >>\nstream\n`);
  const contentSuffix = encoder.encode("\nendstream");
  objects[4] = new Uint8Array(contentPrefix.length + content.length + contentSuffix.length);
  objects[4].set(contentPrefix);
  objects[4].set(content, contentPrefix.length);
  objects[4].set(contentSuffix, contentPrefix.length + content.length);

  const parts = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];
  let byteOffset = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(byteOffset);
    const objectHeader = encoder.encode(`${index + 1} 0 obj\n`);
    const objectFooter = encoder.encode("\nendobj\n");
    parts.push(objectHeader, object, objectFooter);
    byteOffset += objectHeader.length + object.length + objectFooter.length;
  });
  const xrefOffset = byteOffset;
  const xref = encoder.encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  parts.push(xref);
  return new Blob(parts, { type: "application/pdf" });
}

async function createSelfiePdf(imageUrl, details) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not download the selfie image.");
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the selfie image for the PDF.");
    context.drawImage(bitmap, 0, 0, width, height);
    const jpeg = await new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Could not convert the selfie image to PDF format."));
    }, "image/jpeg", 0.92));
    return pdfBytesForJpeg(new Uint8Array(await jpeg.arrayBuffer()), width, height, details);
  } finally {
    bitmap.close();
  }
}

function safeFilenamePart(value) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "") || "Worker";
}

function formatFilenameDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown-DateTime";
  const pad = part => String(part).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function formatCoordinate(value, positive, negative) {
  if (value === null || value === undefined || value === "") return "—";
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) return "—";
  return `${Math.abs(coordinate).toFixed(6)}° ${coordinate >= 0 ? positive : negative}`;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function LocationDetails({ title, location, project }) {
  if (!location) return <section><h3>{title}</h3><p>GPS data unavailable.</p></section>;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const hasCoordinates = hasValue(location.latitude) && hasValue(location.longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
    : null;

  return <section>
    <h3>{title}</h3>
    <p>{project?.address || "Project site"}</p>
    <dl>
      <div><dt>Latitude</dt><dd>{formatCoordinate(location.latitude, "N", "S")}</dd></div>
      <div><dt>Longitude</dt><dd>{formatCoordinate(location.longitude, "E", "W")}</dd></div>
      <div><dt>Accuracy</dt><dd>{hasValue(location.accuracyMetres) ? `±${location.accuracyMetres} m` : "—"}</dd></div>
      <div><dt>Distance from site</dt><dd>{hasValue(location.distanceMetres) ? `${location.distanceMetres} m` : "—"}</dd></div>
    </dl>
    {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} />Open location<ExternalLink size={13} /></a>}
  </section>;
}

export function AttendanceDetailsDialog({ attendance, onClose }) {
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  if (!attendance) return null;
  const { project, worker } = attendance;
  const downloadSelfie = async (imageUrl, kind, date, location) => {
    if (downloading) return;
    setDownloading(kind);
    setDownloadError("");
    try {
      const gps = location && hasValue(location.latitude) && hasValue(location.longitude)
        ? `GPS: ${formatCoordinate(location.latitude, "N", "S")}, ${formatCoordinate(location.longitude, "E", "W")}`
        : "GPS: unavailable";
      const pdf = await createSelfiePdf(imageUrl, [
        `Project: ${project?.name || "—"}`,
        `${kind === "CheckIn" ? "Check-In" : "Check-Out"}: ${displayDateTime(date)}`,
        gps
      ]);
      const objectUrl = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${safeFilenamePart(worker?.name || "Worker")}-${kind}-${formatFilenameDate(date)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Could not download the selfie PDF.");
    } finally {
      setDownloading("");
    }
  };

  return createPortal(<div className="attendance-selfie-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="attendance-record-dialog" role="dialog" aria-modal="true" aria-labelledby="attendance-details-title">
      <header>
        <div>
          <span className="eyebrow">ATTENDANCE RECORD</span>
          <h2 id="attendance-details-title">{worker?.name || "Worker"} · {project?.name || "Project"}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close attendance details"><X size={19} /></button>
      </header>
      <div className="attendance-record-summary">
        <span>Status<strong>{attendance.status || "—"}</strong></span>
        <span>Check-in<strong>{displayDateTime(attendance.checkedInAt)}</strong></span>
        <span>Check-out<strong>{displayDateTime(attendance.checkedOutAt)}</strong></span>
        <span>Project ID<strong>{project?.projectId || "—"}</strong></span>
        <span>Attendance day<strong>{attendance.dayKey || "—"}</strong></span>
        <span>Site radius<strong>{hasValue(project?.location?.radiusMetres) ? `${project.location.radiusMetres} m` : "—"}</strong></span>
      </div>
      <div className="attendance-record-locations">
        <LocationDetails title="Check-in GPS fix" location={attendance.checkInLocation} project={project} />
        <LocationDetails title="Check-out GPS fix" location={attendance.checkOutLocation} project={project} />
      </div>
      <div className="attendance-record-images">
        <section>
          <h3>Check-in selfie</h3>
          {attendance.checkInSelfieUrl ? <div className="attendance-record-selfie"><img src={attendance.checkInSelfieUrl} alt="Worker check-in selfie" loading="lazy" /><button type="button" onClick={() => downloadSelfie(attendance.checkInSelfieUrl, "CheckIn", attendance.checkedInAt, attendance.checkInLocation)} disabled={Boolean(downloading)}><span>{downloading === "CheckIn" ? "Preparing PDF..." : "Download image"}<Download size={14} /></span></button></div> : <p>—</p>}
        </section>
        <section>
          <h3>Check-out selfie</h3>
          {attendance.checkOutSelfieUrl ? <div className="attendance-record-selfie"><img src={attendance.checkOutSelfieUrl} alt="Worker check-out selfie" loading="lazy" /><button type="button" onClick={() => downloadSelfie(attendance.checkOutSelfieUrl, "CheckOut", attendance.checkedOutAt, attendance.checkOutLocation)} disabled={Boolean(downloading)}><span>{downloading === "CheckOut" ? "Preparing PDF..." : "Download image"}<Download size={14} /></span></button></div> : <p>—</p>}
        </section>
      </div>
      {downloadError && <p className="attendance-record-download-error" role="alert">{downloadError}</p>}
      {attendance.workDescription && <section className="attendance-record-work">
        <h3>Work description</h3>
        <p>{attendance.workDescription}</p>
        {attendance.workPhotoUrls?.map((url, index) => <a key={`${attendance._id}-photo-${index}`} href={url} target="_blank" rel="noreferrer">Work photo {index + 1}<ExternalLink size={13} /></a>)}
      </section>}
    </section>
  </div>, document.body);
}
