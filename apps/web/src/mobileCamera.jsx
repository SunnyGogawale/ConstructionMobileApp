import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Text, View } from "react-native";

const CameraView = forwardRef(function BrowserCameraView({ children, style, facing = "front" }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({
      audio: false,
      video: { facingMode: facing === "front" ? "user" : "environment" },
    }).then(stream => {
      if (!active) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {
      if (active) setCameraError("Camera access is unavailable. Check browser permissions and try again.");
    });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [facing]);

  useImperativeHandle(ref, () => ({
    takePictureAsync: async ({ quality = 0.8 } = {}) => {
      const video = videoRef.current;
      if (!video?.videoWidth || !video.videoHeight) {
        throw new Error("The camera is not ready. Please wait and try again.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const image = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!image) throw new Error("Unable to capture an image from the camera.");
      return {
        uri: URL.createObjectURL(image),
        width: canvas.width,
        height: canvas.height,
      };
    },
  }), []);

  return (
    <View style={[style, { position: "relative", overflow: "hidden" }]}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {cameraError ? (
        <View style={{ position: "absolute", inset: 0, justifyContent: "center", padding: 20, backgroundColor: "#142a35cc" }}>
          <Text style={{ color: "#fff", textAlign: "center" }}>{cameraError}</Text>
        </View>
      ) : children}
    </View>
  );
});

export default CameraView;
