import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, RefreshCw, X } from "lucide-react";

export function WorkerSelfieDialog({
  title,
  requireWorkEvidence = false,
  submitLabel = "Use selfie and continue",
  saving,
  onCancel,
  onSubmit
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [cameraCycle, setCameraCycle] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workPhotos, setWorkPhotos] = useState([]);
  const [workPhotoError, setWorkPhotoError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is unavailable. Use a secure browser connection and allow camera access.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" }
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        if (!cancelled) setCameraError(error.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings and try again."
          : `Unable to open the camera: ${error.message}`);
      }
    }
    openCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [cameraCycle]);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, saving]);

  function captureSelfie() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is not ready yet. Please wait and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("The selfie could not be captured. Please try again.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) {
        setCameraError("The selfie could not be captured. Please try again.");
        return;
      }
      setCapturedPhoto(blob);
      const previewUrl = URL.createObjectURL(blob);
      previewUrlRef.current = previewUrl;
      setCapturedPreview(previewUrl);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraError("");
    }, "image/jpeg", 0.9);
  }

  function retakeSelfie() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setCapturedPhoto(null);
    setCapturedPreview("");
    setCameraError("");
    setCameraCycle(current => current + 1);
  }

  const workEvidenceValid = !requireWorkEvidence
    || workDescription.trim().length >= 10 && workPhotos.length > 0 && workPhotos.length <= 20;

  return createPortal(<div className="worker-selfie-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !saving && onCancel()}>
    <section className="worker-selfie-dialog" role="dialog" aria-modal="true" aria-labelledby="worker-selfie-title">
      <div className="worker-selfie-heading">
        <div><h2 id="worker-selfie-title">{title}</h2><p>{requireWorkEvidence ? "Add a project update and capture a live selfie to check out." : "Capture a live selfie to verify this work action."}</p></div>
        <button type="button" className="icon-button" onClick={onCancel} disabled={saving} aria-label="Close selfie capture"><X size={19} /></button>
      </div>
      <div className="worker-selfie-camera">
        {capturedPhoto
          ? <img src={capturedPreview} alt="Captured check-in verification selfie" />
          : <video ref={videoRef} autoPlay playsInline muted aria-label="Live selfie camera preview" />}
      </div>
      {cameraError && <p className="worker-selfie-error" role="alert">{cameraError}</p>}
      {cameraError && !capturedPhoto && <button type="button" className="worker-selfie-retry" onClick={() => {
        setCameraError("");
        setCameraCycle(current => current + 1);
      }} disabled={saving}>Try camera again</button>}
      {requireWorkEvidence && <div className="worker-checkout-evidence">
        <label>Work Progress Description
          <textarea minLength={10} maxLength={3000} value={workDescription} onChange={event => setWorkDescription(event.target.value)} placeholder="Describe the work completed (at least 10 characters)." />
        </label>
        <label>Progress Photos
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" multiple onChange={event => {
            const selectedPhotos = Array.from(event.target.files || []);
            if (selectedPhotos.length > 20) {
              setWorkPhotoError("Select no more than 20 progress photos.");
              setWorkPhotos([]);
              event.target.value = "";
              return;
            }
            setWorkPhotoError("");
            setWorkPhotos(selectedPhotos);
          }} />
        </label>
        {workPhotoError && <p className="worker-selfie-error" role="alert">{workPhotoError}</p>}
        {workPhotos.length > 0 && <span className="worker-checkout-photo-count">{workPhotos.length} photo{workPhotos.length === 1 ? "" : "s"} selected</span>}
        {workPhotos.length === 0 && <p className="worker-checkout-requirement">Select or capture at least one progress photo. Up to 20 photos are allowed.</p>}
        {workDescription.trim().length < 10 && <p className="worker-checkout-requirement">Enter at least 10 characters describing the completed work.</p>}
      </div>}
      <div className="worker-selfie-actions">
        {capturedPhoto
          ? <button type="button" className="button button-secondary" onClick={retakeSelfie} disabled={saving}><RefreshCw size={15} />Retake selfie</button>
          : <button type="button" className="button button-secondary" onClick={captureSelfie} disabled={Boolean(cameraError) || saving}><Camera size={16} />Capture selfie</button>}
        {requireWorkEvidence && <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancel</button>}
        {capturedPhoto && <button type="button" className="button button-primary" onClick={() => onSubmit(capturedPhoto, { workDescription, workPhotos })} disabled={saving || !workEvidenceValid}>
          <Check size={16} />{saving ? "Submitting…" : submitLabel}
        </button>}
      </div>
    </section>
  </div>, document.body);
}
