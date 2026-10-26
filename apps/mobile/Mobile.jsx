import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { LoginScreen } from "./src/screens/LoginScreen.jsx";
import { HomeScreen } from "./src/screens/HomeScreen.jsx";
import { ProjectsScreen } from "./src/screens/ProjectsScreen.jsx";
import { AttendanceScreen } from "./src/screens/AttendanceScreen.jsx";
import { ProgressScreen } from "./src/screens/ProgressScreen.jsx";
import { NotificationsScreen } from "./src/screens/NotificationsScreen.jsx";
import { ProfileScreen } from "./src/screens/ProfileScreen.jsx";
import { C } from "./src/shared/theme.js";
import { styles } from "./src/shared/styles.js";
import { API_URL, apiRequest } from "./src/shared/api.js";
const SITE = {
  latitude: 37.7895,
  longitude: -122.4012,
  radius: 100
};
const TABS = [{
  id: "Home",
  icon: "view-dashboard-outline"
}, {
  id: "Projects",
  icon: "hard-hat"
}, {
  id: "Attendance",
  icon: "map-marker-check-outline"
}, {
  id: "Alerts",
  icon: "bell-outline"
}, {
  id: "Profile",
  icon: "account-outline"
}];
function distanceMetres(from, to) {
  const radians = degrees => degrees * Math.PI / 180;
  const latDelta = radians(to.latitude - from.latitude);
  const lonDelta = radians(to.longitude - from.longitude);
  const value = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}
function Mobile() {
  const [tab, setTab] = useState("Home");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [flow, setFlow] = useState("");
  const [location, setLocation] = useState(null);
  const [gpsState, setGpsState] = useState("idle");
  const [selfie, setSelfie] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [progressText, setProgressText] = useState("");
  const [remarks, setRemarks] = useState("");
  const [progressPercent, setProgressPercent] = useState("0");
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [restoringSession, setRestoringSession] = useState(true);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [updatingSubtask, setUpdatingSubtask] = useState("");
  const [taskAction, setTaskAction] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loginError, setLoginError] = useState("");
  const cameraRef = useRef(null);
  const notify = (title, message) => Alert.alert(title, message, [{
    text: "OK"
  }]);
  const saveAttendance = record => {
    setAttendance(record);
    setAttendanceRecords(current => [record, ...current.filter(item => item._id !== record._id)]);
  };
  useEffect(() => {
    SecureStore.getItemAsync("buildflow-token").then(async savedToken => {
      if (savedToken) {
        try {
          const result = await apiRequest("/api/auth/me", undefined, savedToken, "GET");
          if (result.user.role !== "worker") {
            await SecureStore.deleteItemAsync("buildflow-token");
            setRestoringSession(false);
            return;
          }
          setToken(savedToken);
          setUser(result.user);
        } catch {
          await SecureStore.deleteItemAsync("buildflow-token");
        }
      }
      setRestoringSession(false);
    });
  }, []);
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([apiRequest("/api/projects?page=1&limit=100", undefined, token, "GET"), apiRequest("/api/attendance/me?page=1&limit=100", undefined, token, "GET"), apiRequest("/api/progress?page=1&limit=25", undefined, token, "GET"), apiRequest("/api/notifications?page=1&limit=25", undefined, token, "GET")]).then(async ([projectResult, attendanceResult, progressResult, notificationResult]) => {
      if (!active) return;
      const formatted = (projectResult.projects || []).map(project => ({
        id: project._id,
        projectId: project.projectId,
        name: project.name,
        description: project.description || "",
        managerName: project.manager?.name || "Project manager",
        address: project.address,
        location: project.location,
        dates: `${new Date(project.startDate).toLocaleDateString()} – ${new Date(project.endDate).toLocaleDateString()}`,
        distance: "Distance checked at site",
        trade: `${project.priority || "standard"} priority`,
        progress: Number(project.progress) || 0,
        status: project.status,
        assigned: String(project.assignedWorker?._id || project.assignedWorker || "") === user?.id
      }));
      const tasksByProject = await Promise.all(formatted.map(async project => {
        const result = await apiRequest(`/api/projects/${encodeURIComponent(project.id)}/subtasks`, undefined, token, "GET");
        return (result.subtasks || []).map(subtask => ({
          ...subtask,
          projectId: project.id,
          projectName: project.name,
          projectLocation: project.location,
          projectStatus: project.status
        }));
      }));
      if (!active) return;
      setProjects(formatted);
      setAssignedTasks(tasksByProject.flat());
      const todayKey = new Date().toISOString().slice(0, 10);
      const attendanceRows = attendanceResult.attendance || [];
      const activeAttendance = attendanceRows.find(record => ["active", "on_break"].includes(record.status));
      const attendanceProjectId = activeAttendance?.project?._id || activeAttendance?.project;
      setCurrentProject(formatted.find(project => String(project.id) === String(attendanceProjectId)) || formatted.find(project => project.assigned) || formatted.find(project => project.status === "In Progress") || null);
      setAttendanceRecords(attendanceRows);
      setAttendance(activeAttendance || attendanceRows.find(record => record.dayKey === todayKey) || null);
      setProgressUpdates(progressResult.updates || []);
      setNotifications(notificationResult.notifications || []);
    }).catch(error => notify("Workspace unavailable", error.message)).finally(() => {
      if (active) setRestoringSession(false);
    });
    return () => {
      active = false;
    };
  }, [token, user?.id]);
  const updateSubtaskStatus = async (subtask, status) => {
    if (updatingSubtask) return;
    setUpdatingSubtask(subtask._id);
    try {
      const projectId = subtask.projectId;
      const selfieUrl = await uploadImage(selfie, {
        imagePurpose: status === "In Progress" ? "check-in" : "check-out",
        taskId: subtask._id
      });
      if (status === "In Progress") {
        const attendanceProjectId = attendance?.project?._id || attendance?.project;
        if (attendance?.status === "on_break" && String(attendanceProjectId) === String(projectId)) {
          throw new Error("Resume your project session before starting a task.");
        }
        if (attendance?.status === "active" && String(attendanceProjectId) !== String(projectId)) {
          throw new Error("Check out of your current project shift before starting a task on another project.");
        }
        if (attendance?.status !== "active") {
          const result = await apiRequest("/api/attendance/check-in", {
            projectId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            selfieUrl
          }, token);
          saveAttendance(result.attendance);
        }
      }
      const result = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(subtask._id)}`, {
        status,
        selfieUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }, token, "PATCH");
      setAssignedTasks(current => current.map(item => item._id === subtask._id ? {
        ...result.subtask,
        projectId: item.projectId,
        projectName: item.projectName,
        projectLocation: item.projectLocation,
        projectStatus: item.projectStatus
      } : item));
      if (result.progressUpdate) setProgressUpdates(current => [result.progressUpdate, ...current]);
      setFlow("");
      setTaskAction(null);
      setSelfie(null);
      notify("Task updated", status === "Completed" ? "Your task was completed with check-out selfie and GPS verification." : `Task changed to ${status}.`);
    } catch (error) {
      notify("Task not updated", error.message);
    } finally {
      setUpdatingSubtask("");
    }
  };
  const startTaskAction = (task, status) => {
    const project = projects.find(item => item.id === task.projectId);
    if (!project) return notify("Project unavailable", "This task is not linked to an available project.");
    setTaskAction({
      task,
      status,
      project
    });
    setTaskDescription("");
    setTaskPhotos([]);
    setCurrentProject(project);
    checkLocation(status === "In Progress" ? "task-start" : "task-complete", project);
  };
  const handleLogin = async (email, password) => {
    setLoginError("");
    try {
      const result = await apiRequest("/api/auth/login", {
        email,
        password
      }, null);
      if (result.user.role !== "worker") {
        throw new Error("Use the web workspace to sign in as an administrator or project manager.");
      }
      await SecureStore.setItemAsync("buildflow-token", result.token);
      setToken(result.token);
      setUser(result.user);
    } catch (error) {
      setLoginError(error.message);
    }
  };
  const handleLogout = async () => {
    try {
      if (token) await apiRequest("/api/auth/logout", null, token);
    } catch (error) {
      console.error("Unable to record logout activity:", error);
    }
    await SecureStore.deleteItemAsync("buildflow-token");
    setToken(null);
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
    setAssignedTasks([]);
    setTaskAction(null);
    setAttendance(null);
    setAttendanceRecords([]);
    setProgressUpdates([]);
    setNotifications([]);
  };
  const uploadImage = async (uri, context = {}) => {
    if (!API_URL || !token) throw new Error("Sign in and configure the project API before uploading photos.");
    const uriExtension = uri.split("?")[0].split(".").pop()?.toLowerCase();
    const imageFormat = {
      jpg: { extension: "jpg", type: "image/jpeg" },
      jpeg: { extension: "jpeg", type: "image/jpeg" },
      png: { extension: "png", type: "image/png" },
      webp: { extension: "webp", type: "image/webp" },
      heic: { extension: "heic", type: "image/heic" }
    }[uriExtension] || { extension: "jpg", type: "image/jpeg" };
    const form = new FormData();
    for (const [key, value] of Object.entries(context)) {
      if (value) form.append(key, String(value));
    }
    form.append("file", {
      uri,
      name: `site-${Date.now()}.${imageFormat.extension}`,
      type: imageFormat.type
    });
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Photo upload failed.");
    return result.url;
  };
  const checkLocation = async (intent = "checkin", targetProject = currentProject) => {
    if (!targetProject) return notify("No active assignment", "A verified project assignment is required before check-in.");
    if (intent === "checkout") {
      setCheckoutDescription("");
      setCheckoutPhotos([]);
      setSelfie(null);
    }
    if (intent === "task-start" || intent === "task-complete") setSelfie(null);
    setGpsState("checking");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setGpsState("permission-denied");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const site = targetProject.location || SITE;
      if (position.coords.accuracy == null || position.coords.accuracy > (site.radiusMetres || site.radius || 100)) {
        setLocation({
          ...position.coords,
          distance: null
        });
        setGpsState("poor-accuracy");
        return;
      }
      const distance = distanceMetres(position.coords, site);
      const fix = {
        ...position.coords,
        distance
      };
      setLocation(fix);
      if (distance > (site.radiusMetres || site.radius || 100)) {
        setGpsState("outside");
        return;
      }
      setGpsState("within");
      const permissionResult = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      if (!permissionResult.granted) {
        setGpsState("camera-denied");
        return;
      }
      setFlow(intent === "checkout" ? "camera-checkout" : intent === "task-start" ? "camera-task-start" : intent === "task-complete" ? "camera-task-complete" : "camera");
    } catch (error) {
      setGpsState("error");
      notify("Location unavailable", error.message || "We could not get a GPS fix. Try again outdoors.");
    }
  };
  const captureSelfie = async () => {
    if (!cameraRef.current) return;
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false
      });
      setSelfie(picture.uri);
      setFlow(flow === "camera-checkout" ? "confirm-checkout" : flow === "camera-task-start" ? "confirm-task-start" : flow === "camera-task-complete" ? "confirm-task-complete" : "confirm-checkin");
    } catch (error) {
      notify("Camera unavailable", error.message || "Please retry the selfie capture.");
    } finally {
      setBusy(false);
    }
  };
  const submitCheckIn = async () => {
    if (!location || !selfie || location.distance > (currentProject?.location?.radiusMetres || 100)) return;
    setBusy(true);
    try {
      const selfieUrl = await uploadImage(selfie, {
        imagePurpose: "check-in",
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId
      });
      const result = await apiRequest("/api/attendance/check-in", {
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        selfieUrl
      }, token);
      saveAttendance(result.attendance);
      setFlow("");
      setTab("Home");
      setGpsState("checked-in");
      notify("Check-in recorded", "Your verified attendance is now active.");
    } catch (error) {
      notify("Check-in not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };
  const submitCheckOut = async () => {
    if (!location || !selfie) return notify("Check-out verification needed", "A GPS fix and check-out selfie are required.");
    setBusy(true);
    try {
      const selfieUrl = await uploadImage(selfie, {
        imagePurpose: "check-out",
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId
      });
      const result = await apiRequest("/api/attendance/check-out", {
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        selfieUrl
      }, token);
      saveAttendance(result.attendance);
      setSelfie(null);
      if (result.update) setProgressUpdates(current => [result.update, ...current.filter(update => update._id !== result.update._id)]);
      setFlow("");
      setTab("Home");
      notify("Check-Out submitted", "Your selfie and verified shift were saved.");
    } catch (error) {
      notify("Check-out not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };
  const submitTaskAction = async () => {
    if (!taskAction || !location || !selfie) return notify("Task verification needed", "A GPS fix and check-out selfie are required.");
    await updateSubtaskStatus(taskAction.task, taskAction.status);
  };
  const acceptProject = async project => {
    setBusy(true);
    try {
      const result = await apiRequest(`/api/projects/${project.id}/accept`, {}, token);
      setProjects(current => current.filter(item => item.id !== project.id));
      setCurrentProject(result.project);
      setProjectDetail(null);
      notify("Project accepted", "The server confirmed your exclusive assignment.");
    } catch (error) {
      notify(error.status === 409 ? "Already assigned" : "Acceptance not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };
  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return notify("Photo access needed", "Allow photo library access in device settings to attach work images.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7
    });
    if (!result.canceled) setPhotos(current => [...current, ...result.assets.map(asset => asset.uri)]);
  };
  const cancelCheckOut = () => {
    if (busy) return;
    setFlow("");
    setSelfie(null);
    setTab("Home");
  };
  const cancelTaskAction = () => {
    if (busy) return;
    setFlow("");
    setSelfie(null);
    setTaskAction(null);
  };
  const submitProgress = async () => {
    if (progressText.trim().length < 10) return notify("Add a work summary", "Describe the work completed in at least a few words.");
    setBusy(true);
    try {
      const photoUrls = await Promise.all(photos.map(photo => uploadImage(photo, {
        imagePurpose: "daily-attendance",
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId
      })));
      const result = await apiRequest("/api/progress", {
        projectId: currentProject?._id || currentProject?.id,
        description: progressText.trim(),
        progress: Number(progressPercent),
        remarks,
        photos: photoUrls
      }, token);
      if (result.update) setProgressUpdates(current => [result.update, ...current]);
      setProgressText("");
      setRemarks("");
      setPhotos([]);
      notify("Progress submitted", "Your update was sent to the project manager.");
    } catch (error) {
      notify("Progress not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };
  if (restoringSession) return <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <MaterialCommunityIcons name="hard-hat" size={28} color={C.orange} />
          <Text style={styles.cardTitle}>Loading your field workspace…</Text>
        </View>
      </SafeAreaView>;
  if (!token || !user) return <LoginScreen onLogin={handleLogin} error={loginError} />;
  const cameraProject = taskAction?.project || currentProject;
  if (["camera", "camera-checkout", "camera-task-start", "camera-task-complete"].includes(flow)) {
    return <SafeAreaView style={styles.cameraScreen}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.cameraTop}>
            <Pressable onPress={() => taskAction ? cancelTaskAction() : setFlow("")} style={styles.cameraClose}>
              <MaterialCommunityIcons name="close" size={24} color={C.white} />
            </Pressable>
            <Text style={styles.cameraTitle}>{flow === "camera-checkout" || flow === "camera-task-complete" ? "Check-out selfie" : flow === "camera-task-start" ? "Task check-in selfie" : "Attendance selfie"}</Text>
            <Text style={styles.cameraCaption}>Keep your face in frame</Text>
          </View>
          <View style={styles.faceFrame} />
          <View style={styles.cameraBottom}>
            <View style={styles.gpsCameraPill}>
              <MaterialCommunityIcons name="map-marker-check" size={15} color="#96deb7" />
              <Text>
                {location?.distance} m from site · ±
                {Math.round(location?.accuracy || 0)} m
              </Text>
            </View>
            <Pressable disabled={busy || !cameraProject} onPress={captureSelfie} style={styles.captureButton}>
              <View />
            </Pressable>
          </View>
        </CameraView>
      </SafeAreaView>;
  }
  if (flow === "confirm-checkin") {
    return <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable onPress={() => setFlow("camera")} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>Confirm check-in</Text>
        </View>
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <Text style={styles.eyebrow}>ATTENDANCE VERIFICATION</Text>
          <Text style={styles.screenTitle}>Ready to start work?</Text>
          <Text style={styles.bodyCopy}>
            Review your site and verification details before submitting.
          </Text>
          {selfie && <Image source={{
          uri: selfie
        }} style={styles.selfiePreview} />}
          <View style={styles.confirmCard}>
            <ConfirmRow icon="office-building-outline" label="Project" value={currentProject?.name || "Assigned project"} />
            <ConfirmRow icon="map-marker-check-outline" label="GPS distance" value={`${location?.distance} m · inside ${currentProject?.location?.radiusMetres || 100} m radius`} />
            <ConfirmRow icon="crosshairs-gps" label="GPS accuracy" value={`±${Math.round(location?.accuracy || 0)} m`} />
            <ConfirmRow icon="clock-outline" label="Device time" value={new Date().toLocaleString()} />
          </View>
          <Pressable disabled={busy} onPress={submitCheckIn} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {busy ? "Submitting…" : "Start"}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.white} />
          </Pressable>
          <Text style={styles.securityNote}>
            The server will re-verify your GPS location before recording
            attendance.
          </Text>
        </ScrollView>
      </SafeAreaView>;
  }
  if (flow === "confirm-checkout") {
    return <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable onPress={() => setFlow("camera-checkout")} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>Project Update & Check-Out</Text>
        </View>
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <Text style={styles.eyebrow}>ATTENDANCE VERIFICATION</Text>
          <Text style={styles.screenTitle}>Confirm your check-out</Text>
          {selfie && <Image source={{
          uri: selfie
        }} style={styles.selfiePreview} />}
          <ConfirmRow icon="map-marker-check-outline" label="GPS distance" value={`${location?.distance} m · verified`} />
          <Pressable disabled={busy} onPress={submitCheckOut} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{busy ? "Uploading and submitting…" : "Submit Check-Out"}</Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.white} />
          </Pressable>
          <Pressable disabled={busy} onPress={cancelCheckOut} style={styles.checkOutButton}>
            <Text style={styles.checkOutText}>Cancel</Text>
          </Pressable>
          <Text style={styles.securityNote}>A verified location and check-out selfie are required.</Text>
        </ScrollView>
      </SafeAreaView>;
  }
  if (flow === "confirm-task-start" || flow === "confirm-task-complete") {
    const completingTask = flow === "confirm-task-complete";
    return <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable onPress={() => setFlow(completingTask ? "camera-task-complete" : "camera-task-start")} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>{completingTask ? "Task Update & Check-Out" : "Start Assigned Task"}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <Text style={styles.eyebrow}>{completingTask ? "PROJECT UPDATE" : "CHECK-IN VERIFICATION"}</Text>
          <Text style={styles.screenTitle}>{taskAction?.task.title}</Text>
          {selfie && <Image source={{ uri: selfie }} style={styles.selfiePreview} />}
          <ConfirmRow icon="office-building-outline" label="Project" value={taskAction?.project.name || "Assigned project"} />
          <ConfirmRow icon="map-marker-check-outline" label="GPS distance" value={`${location?.distance} m · verified`} />
          <ConfirmRow icon="crosshairs-gps" label="GPS accuracy" value={`±${Math.round(location?.accuracy || 0)} m`} />
          <Pressable disabled={busy} onPress={submitTaskAction} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{busy ? "Uploading and submitting…" : completingTask ? "Complete Task" : "Start Task"}</Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.white} />
          </Pressable>
          <Pressable disabled={busy} onPress={cancelTaskAction} style={styles.checkOutButton}>
            <Text style={styles.checkOutText}>Cancel</Text>
          </Pressable>
          <Text style={styles.securityNote}>{completingTask ? "A check-out selfie and GPS verification are required to complete this task." : "A check-in selfie and GPS verification are required to start this assigned task."}</Text>
        </ScrollView>
      </SafeAreaView>;
  }
  if (projectDetail) return <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable onPress={() => setProjectDetail(null)} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>Project details</Text>
        </View>
        <ScrollView contentContainerStyle={styles.pageContent}>
          <View style={styles.detailHero}>
            <MaterialCommunityIcons name="office-building-outline" size={26} color={C.orange} />
            <Text style={styles.detailTitle}>{projectDetail.name}</Text>
            <Text style={styles.bodyCopy}>{projectDetail.description}</Text>
          </View>
          <InfoSection title="SITE">
            <InfoRow icon="map-marker-outline" text={`${projectDetail.address || projectDetail.location?.address || "Site location"} · ${projectDetail.distance || "Distance checked on site"}`} />
            <InfoRow icon="calendar-range-outline" text={projectDetail.dates} />
            <InfoRow icon="hard-hat" text={projectDetail.trade} />
          </InfoSection>
          <InfoSection title="PROJECT MANAGER">
            <InfoRow icon="account-outline" text="Daniel Kim · Site manager" />
          </InfoSection>
          <Pressable disabled={busy} onPress={() => acceptProject(projectDetail)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {busy ? "Checking availability…" : "Accept project"}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.white} />
          </Pressable>
          <Text style={styles.securityNote}>
            Acceptance is exclusive. The server confirms the assignment before
            it appears in your projects.
          </Text>
        </ScrollView>
      </SafeAreaView>;
  const showGpsState = () => {
    const messages = {
      "permission-denied": ["Location permission denied", "Enable location access in device settings to continue."],
      outside: ["Outside attendance radius", `You are ${location?.distance || "more than 100"} m from the site. Check-in is blocked beyond 100 m.`],
      "camera-denied": ["Camera permission denied", "Enable camera access in device settings to complete the required selfie verification."],
      "poor-accuracy": ["GPS fix unavailable", "Move outdoors and request a new location fix."],
      error: ["Location unavailable", "Try again when your device can access GPS."]
    };
    if (messages[gpsState]) notify(...messages[gpsState]);
  };
  const startBreak = async () => {
    setBusy(true);
    try {
      const result = await apiRequest("/api/attendance/break/start", {
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId
      }, token);
      saveAttendance(result.attendance);
    } catch (error) {
      notify("Break not started", error.message);
    } finally {
      setBusy(false);
    }
  };
  const resumeWork = async () => {
    setBusy(true);
    try {
      const result = await apiRequest("/api/attendance/break/resume", {
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId
      }, token);
      saveAttendance(result.attendance);
    } catch (error) {
      notify("Could not resume work", error.message);
    } finally {
      setBusy(false);
    }
  };
  const content = tab === "Home" ? <HomeScreen user={user} project={currentProject} attendance={attendance} progressUpdates={progressUpdates} weeklyHours={attendanceRecords.reduce((total, record) => {
    const checkIn = new Date(record.checkedInAt);
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    if (Number.isNaN(checkIn.getTime()) || checkIn < monday) return total;
    const checkOut = record.checkedOutAt ? new Date(record.checkedOutAt) : new Date();
    return total + Math.max(0, (checkOut - checkIn) / 3600000);
  }, 0).toFixed(1)} pendingUpdates={progressUpdates.filter(update => update.reviewStatus === "Pending").length} onCheckIn={() => checkLocation("checkin")} onCheckOut={() => checkLocation("checkout")} onBreak={startBreak} onResume={resumeWork} busy={busy} gpsState={gpsState} onProgress={() => setTab("Progress")} /> : tab === "Projects" ? <ProjectsScreen tasks={assignedTasks} updatingSubtask={updatingSubtask} onTaskAction={startTaskAction} /> : tab === "Attendance" ? <AttendanceScreen onVerify={() => checkLocation("checkin")} onCheckOut={() => checkLocation("checkout")} attendance={attendance} attendanceRecords={attendanceRecords} state={gpsState} location={location} onStateInfo={showGpsState} project={currentProject} /> : tab === "Progress" ? <ProgressScreen text={progressText} setText={setProgressText} remarks={remarks} setRemarks={setRemarks} percent={progressPercent} setPercent={setProgressPercent} photos={photos} onPick={pickPhotos} onSubmit={submitProgress} busy={busy} project={currentProject} /> : tab === "Alerts" ? <NotificationsScreen notifications={notifications} onMarkRead={async notification => {
    try {
      await apiRequest(`/api/notifications/${notification._id}/read`, undefined, token, "PATCH");
      setNotifications(current => current.map(item => item._id === notification._id ? {
        ...item,
        readAt: new Date().toISOString()
      } : item));
    } catch (error) {
      notify("Could not update notification", error.message);
    }
  }} /> : <ProfileScreen user={user} project={currentProject} onLogout={handleLogout} />;
  return <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="office-building" size={19} color={C.white} />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brandName}>BuildFlow</Text>
          <Text style={styles.brandLabel}>FIELD WORKSPACE</Text>
        </View>
        <Pressable onPress={() => setTab("Alerts")} style={styles.topBell}>
          <MaterialCommunityIcons name="bell-outline" size={21} color={C.ink} />
          <View style={styles.unreadDot} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
        {content}
      </ScrollView>
      <View style={styles.bottomTabs}>
        {TABS.map(({
        id,
        icon
      }) => <Pressable key={id} onPress={() => setTab(id)} style={styles.tabButton}>
            <View style={[styles.tabIcon, tab === id && styles.tabIconActive]}>
              <MaterialCommunityIcons name={icon} size={21} color={tab === id ? C.orange : C.muted} />
            </View>
            <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>
              {id}
            </Text>
          </Pressable>)}
      </View>
    </SafeAreaView>;
}
export default Mobile;
