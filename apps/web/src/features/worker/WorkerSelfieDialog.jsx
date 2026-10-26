import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, RefreshCw, X } from "lucide-react";

export function WorkerSelfieDialog({
  title,
  allowSelfieUpload = false,
  showCancel = false,
  submitLabel = "Use selfie and continue",
  submissionError = "",
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
  const [selfieError, setSelfieError] = useState("");

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
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      setCapturedPhoto(blob);
      const previewUrl = URL.createObjectURL(blob);
      previewUrlRef.current = previewUrl;
      setCapturedPreview(previewUrl);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraError("");
      setSelfieError("");
    }, "image/jpeg", 0.9);
  }

  function selectSelfie(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic"];
    if (!file.size || !(allowedMimeTypes.includes(file.type.toLowerCase())
      || ["", "application/octet-stream"].includes(file.type.toLowerCase()) && allowedExtensions.includes(extension))) {
      setSelfieError("Choose a valid JPEG, PNG, WebP, or HEIC selfie image.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setCapturedPhoto(file);
    setCapturedPreview(previewUrl);
    setSelfieError("");
    setCameraError("");
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }

  function retakeSelfie() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setCapturedPhoto(null);
    setCapturedPreview("");
    setCameraError("");
    setSelfieError("");
    setCameraCycle(current => current + 1);
  }

  return createPortal(<div className="worker-selfie-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !saving && onCancel()}>
    <section className="worker-selfie-dialog" role="dialog" aria-modal="true" aria-labelledby="worker-selfie-title">
      <div className="worker-selfie-heading">
        <div><h2 id="worker-selfie-title">{title}</h2><p>Capture a live selfie to verify this work action.</p></div>
        <button type="button" className="icon-button" onClick={onCancel} disabled={saving} aria-label="Close selfie capture"><X size={19} /></button>
      </div>
      <div className="worker-selfie-camera">
        {capturedPhoto
          ? <img src={capturedPreview} alt="Selected attendance verification selfie" />
          : <video ref={videoRef} autoPlay playsInline muted aria-label="Live selfie camera preview" />}
      </div>
      {cameraError && <p className="worker-selfie-error" role="alert">{cameraError}</p>}
      {selfieError && <p className="worker-selfie-error" role="alert">{selfieError}</p>}
      {submissionError && <p className="worker-selfie-error" role="alert">{submissionError}</p>}
      {cameraError && !capturedPhoto && <button type="button" className="worker-selfie-retry" onClick={() => {
        setCameraError("");
        setCameraCycle(current => current + 1);
      }} disabled={saving}>Try camera again</button>}
      <div className="worker-selfie-actions">
        {capturedPhoto
          ? <button type="button" className="button button-secondary" onClick={retakeSelfie} disabled={saving}><RefreshCw size={15} />Retake selfie</button>
          : <button type="button" className="button button-secondary" onClick={captureSelfie} disabled={Boolean(cameraError) || saving}><Camera size={16} />Capture selfie</button>}
        {allowSelfieUpload && <label className="button button-secondary worker-selfie-upload">
          Upload selfie
          <input className="worker-selfie-upload-input" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={selectSelfie} disabled={saving} />
        </label>}
        {showCancel && <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancel</button>}
        {capturedPhoto && <button type="button" className="button button-primary" onClick={() => onSubmit(capturedPhoto)} disabled={saving}>
          <Check size={16} />{saving ? "Submitting…" : submitLabel}
        </button>}
      </div>
    </section>
  </div>, document.body);
}
