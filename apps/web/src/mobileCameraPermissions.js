import { useCallback, useState } from "react";

export function useCameraPermissions() {
  const [permission, setPermission] = useState({
    granted: false,
    canAskAgain: true,
    status: "undetermined",
  });

  const request = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const denied = { granted: false, canAskAgain: false, status: "denied" };
      setPermission(denied);
      return denied;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      const granted = { granted: true, canAskAgain: true, status: "granted" };
      setPermission(granted);
      return granted;
    } catch {
      const denied = { granted: false, canAskAgain: true, status: "denied" };
      setPermission(denied);
      return denied;
    }
  }, []);

  return [permission, request];
}
