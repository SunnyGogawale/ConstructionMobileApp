import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const C = {
  ink: "#17272f",
  navy: "#142d39",
  orange: "#e87524",
  orangeLight: "#fff0e5",
  green: "#328163",
  greenLight: "#eaf4ee",
  muted: "#768588",
  line: "#e4eae7",
  canvas: "#f4f6f5",
  white: "#ffffff",
  amber: "#a97925",
  amberLight: "#fbf3e3",
  red: "#bd5145",
};
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SITE = { latitude: 37.7895, longitude: -122.4012, radius: 100 };
const TABS = [
  { id: "Home", icon: "view-dashboard-outline" },
  { id: "Projects", icon: "hard-hat" },
  { id: "Attendance", icon: "map-marker-check-outline" },
  { id: "Alerts", icon: "bell-outline" },
  { id: "Profile", icon: "account-outline" },
];
async function apiRequest(path, body, token, method = "POST") {
  if (!API_URL)
    throw new Error(
      "The project API is not configured. Nothing has been submitted.",
    );
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function distanceMetres(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = radians(to.latitude - from.latitude);
  const lonDelta = radians(to.longitude - from.longitude);
  const value =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(lonDelta / 2) ** 2;
  return Math.round(
    6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)),
  );
}

function App() {
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
  const [checkoutDescription, setCheckoutDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [restoringSession, setRestoringSession] = useState(true);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loginError, setLoginError] = useState("");
  const cameraRef = useRef(null);

  const notify = (title, message) =>
    Alert.alert(title, message, [{ text: "OK" }]);

  const saveAttendance = (record) => {
    setAttendance(record);
    setAttendanceRecords(current => [record, ...current.filter(item => item._id !== record._id)]);
  };

  useEffect(() => {
    SecureStore.getItemAsync("buildflow-token").then(async (savedToken) => {
      if (savedToken) {
        try {
          const result = await apiRequest(
            "/api/auth/me",
            undefined,
            savedToken,
            "GET",
          );
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
    Promise.all([
      apiRequest("/api/projects?page=1&limit=100", undefined, token, "GET"),
      apiRequest("/api/attendance/me?page=1&limit=100", undefined, token, "GET"),
      apiRequest("/api/progress?page=1&limit=25", undefined, token, "GET"),
      apiRequest("/api/notifications?page=1&limit=25", undefined, token, "GET"),
    ])
      .then(([projectResult, attendanceResult, progressResult, notificationResult]) => {
        if (!active) return;
        const formatted = (projectResult.projects || []).map((project) => ({
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
          assigned:
            String(
              project.assignedWorker?._id || project.assignedWorker || "",
            ) === user?.id,
        }));
        setProjects(formatted);
        setCurrentProject(
          formatted.find((project) => project.assigned) ||
            formatted.find((project) => project.status === "In Progress") ||
            null,
        );
        const todayKey = new Date().toISOString().slice(0, 10);
        const attendanceRows = attendanceResult.attendance || [];
        setAttendanceRecords(attendanceRows);
        setAttendance(attendanceRows.find(record => ["active", "on_break"].includes(record.status)) ||
          attendanceRows.find(record => record.dayKey === todayKey) || null);
        setProgressUpdates(progressResult.updates || []);
        setNotifications(notificationResult.notifications || []);
      })
      .catch((error) => notify("Workspace unavailable", error.message))
      .finally(() => {
        if (active) setRestoringSession(false);
      });
    return () => {
      active = false;
    };
  }, [token, user?.id]);

  const handleLogin = async (email, password) => {
    setLoginError("");
    try {
      const result = await apiRequest(
        "/api/auth/login",
        { email, password },
        null,
      );
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
    await SecureStore.deleteItemAsync("buildflow-token");
    setToken(null);
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
    setAttendance(null);
    setAttendanceRecords([]);
    setProgressUpdates([]);
    setNotifications([]);
  };

  const uploadImage = async (uri) => {
    if (!API_URL || !token)
      throw new Error(
        "Sign in and configure the project API before uploading photos.",
      );
    const form = new FormData();
    form.append("file", {
      uri,
      name: `site-${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Photo upload failed.");
    return result.url;
  };

  const checkLocation = async (intent = "checkin") => {
    if (!currentProject)
      return notify(
        "No active assignment",
        "A verified project assignment is required before check-in.",
      );
    setGpsState("checking");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setGpsState("permission-denied");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const site = currentProject?.location || SITE;
      if (
        position.coords.accuracy == null ||
        position.coords.accuracy > (site.radiusMetres || site.radius || 100)
      ) {
        setLocation({ ...position.coords, distance: null });
        setGpsState("poor-accuracy");
        return;
      }
      const distance = distanceMetres(position.coords, site);
      const fix = { ...position.coords, distance };
      setLocation(fix);
      if (distance > (site.radiusMetres || site.radius || 100)) {
        setGpsState("outside");
        return;
      }
      setGpsState("within");
      const permissionResult = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
      if (!permissionResult.granted) {
        setGpsState("camera-denied");
        return;
      }
      setFlow(intent === "checkout" ? "camera-checkout" : "camera");
    } catch (error) {
      setGpsState("error");
      notify(
        "Location unavailable",
        error.message || "We could not get a GPS fix. Try again outdoors.",
      );
    }
  };

  const captureSelfie = async () => {
    if (!cameraRef.current) return;
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false,
      });
      setSelfie(picture.uri);
      setFlow(flow === "camera-checkout" ? "confirm-checkout" : "confirm-checkin");
    } catch (error) {
      notify(
        "Camera unavailable",
        error.message || "Please retry the selfie capture.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitCheckIn = async () => {
    if (
      !location ||
      !selfie ||
      location.distance > (currentProject?.location?.radiusMetres || 100)
    ) return;
    setBusy(true);
    try {
      const selfieUrl = await uploadImage(selfie);
      const result = await apiRequest(
        "/api/attendance/check-in",
        {
          projectId:
            currentProject?._id ||
            currentProject?.id ||
            currentProject?.projectId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          selfieUrl,
        },
        token,
      );
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
    if (!location || !selfie || checkoutDescription.trim().length < 10 || photos.length === 0) {
      return notify("Check-out details needed", "Add a work summary and at least one completed-work photo before submitting.");
    }
    setBusy(true);
    try {
      const [selfieUrl, ...photoUrls] = await Promise.all([selfie, ...photos].map(uploadImage));
      const result = await apiRequest("/api/attendance/check-out", {
        projectId: currentProject?._id || currentProject?.id || currentProject?.projectId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        selfieUrl,
        workDescription: checkoutDescription.trim(),
        photoUrls,
      }, token);
      saveAttendance(result.attendance);
      setCheckoutDescription("");
      setPhotos([]);
      setSelfie(null);
      setFlow("");
      setTab("Home");
      notify("Check-out recorded", "Your verified shift and work photos were submitted.");
    } catch (error) {
      notify("Check-out not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };

  const acceptProject = async (project) => {
    setBusy(true);
    try {
      const result = await apiRequest(
        `/api/projects/${project.id}/accept`,
        {},
        token,
      );
      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
      setCurrentProject(result.project);
      setProjectDetail(null);
      notify(
        "Project accepted",
        "The server confirmed your exclusive assignment.",
      );
    } catch (error) {
      notify(
        error.status === 409
          ? "Already assigned"
          : "Acceptance not submitted",
        error.message,
      );
    } finally {
      setBusy(false);
    }
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return notify(
        "Photo access needed",
        "Allow photo library access in device settings to attach work images.",
      );
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled)
      setPhotos((current) => [
        ...current,
        ...result.assets.map((asset) => asset.uri),
      ]);
  };

  const submitProgress = async () => {
    if (progressText.trim().length < 10)
      return notify(
        "Add a work summary",
        "Describe the work completed in at least a few words.",
      );
    setBusy(true);
    try {
      const photoUrls = await Promise.all(photos.map(uploadImage));
      const result = await apiRequest(
        "/api/progress",
        {
          projectId: currentProject?._id || currentProject?.id,
          description: progressText.trim(),
          progress: Number(progressPercent),
          remarks,
          photos: photoUrls,
        },
        token,
      );
      if (result.update) setProgressUpdates(current => [result.update, ...current]);
      setProgressText("");
      setRemarks("");
      setPhotos([]);
      notify(
        "Progress submitted",
        "Your update was sent to the project manager.",
      );
    } catch (error) {
      notify("Progress not submitted", error.message);
    } finally {
      setBusy(false);
    }
  };

  if (restoringSession)
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <MaterialCommunityIcons name="hard-hat" size={28} color={C.orange} />
          <Text style={styles.cardTitle}>Loading your field workspace…</Text>
        </View>
      </SafeAreaView>
    );
  if (!token || !user)
    return <LoginScreen onLogin={handleLogin} error={loginError} />;

  if (flow === "camera" || flow === "camera-checkout") {
    return (
      <SafeAreaView style={styles.cameraScreen}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.cameraTop}>
            <Pressable onPress={() => setFlow("")} style={styles.cameraClose}>
              <MaterialCommunityIcons name="close" size={24} color={C.white} />
            </Pressable>
            <Text style={styles.cameraTitle}>{flow === "camera-checkout" ? "Check-out selfie" : "Attendance selfie"}</Text>
            <Text style={styles.cameraCaption}>Keep your face in frame</Text>
          </View>
          <View style={styles.faceFrame} />
          <View style={styles.cameraBottom}>
            <View style={styles.gpsCameraPill}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={15}
                color="#96deb7"
              />
              <Text>
                {location?.distance} m from site · ±
                {Math.round(location?.accuracy || 0)} m
              </Text>
            </View>
            <Pressable
              disabled={busy || !project}
              onPress={captureSelfie}
              style={styles.captureButton}
            >
              <View />
            </Pressable>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  if (flow === "confirm-checkin") {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable
            onPress={() => setFlow("camera")}
            style={styles.backButton}
          >
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
          {selfie && (
            <Image source={{ uri: selfie }} style={styles.selfiePreview} />
          )}
          <View style={styles.confirmCard}>
            <ConfirmRow
              icon="office-building-outline"
              label="Project"
              value={currentProject?.name || "Assigned project"}
            />
            <ConfirmRow
              icon="map-marker-check-outline"
              label="GPS distance"
              value={`${location?.distance} m · inside ${currentProject?.location?.radiusMetres || 100} m radius`}
            />
            <ConfirmRow
              icon="crosshairs-gps"
              label="GPS accuracy"
              value={`±${Math.round(location?.accuracy || 0)} m`}
            />
            <ConfirmRow
              icon="clock-outline"
              label="Device time"
              value={new Date().toLocaleString()}
            />
          </View>
          <Pressable
            disabled={busy}
            onPress={submitCheckIn}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {busy ? "Submitting…" : "Confirm and check in"}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={19}
              color={C.white}
            />
          </Pressable>
          <Text style={styles.securityNote}>
            The server will re-verify your GPS location before recording
            attendance.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (flow === "confirm-checkout") {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable onPress={() => setFlow("camera-checkout")} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>Check out</Text>
        </View>
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <Text style={styles.eyebrow}>END OF SHIFT</Text>
          <Text style={styles.screenTitle}>Summarize today’s work</Text>
          {selfie && <Image source={{ uri: selfie }} style={styles.selfiePreview} />}
          <ConfirmRow icon="map-marker-check-outline" label="GPS distance" value={`${location?.distance} m · verified`} />
          <TextInput value={checkoutDescription} onChangeText={setCheckoutDescription} multiline placeholder="Describe the work completed today…" style={[styles.textField, styles.multiline, { marginTop: 12 }]} />
          <Pressable onPress={pickPhotos} style={styles.addPhoto}>
            <MaterialCommunityIcons name="image-plus-outline" size={22} color={C.orange} />
            <Text style={styles.addPhotoText}>Add completed-work photos ({photos.length})</Text>
          </Pressable>
          <View style={styles.photoRow}>{photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.photoThumb} />)}</View>
          <Pressable disabled={busy} onPress={submitCheckOut} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{busy ? "Uploading and submitting…" : "Confirm check-out"}</Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.white} />
          </Pressable>
          <Text style={styles.securityNote}>Location, selfie, work description, and at least one photo are required.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (projectDetail)
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.confirmHeader}>
          <Pressable
            onPress={() => setProjectDetail(null)}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <Text style={styles.confirmTitle}>Project details</Text>
        </View>
        <ScrollView contentContainerStyle={styles.pageContent}>
          <View style={styles.detailHero}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={26}
              color={C.orange}
            />
            <Text style={styles.detailTitle}>{projectDetail.name}</Text>
            <Text style={styles.bodyCopy}>{projectDetail.description}</Text>
          </View>
          <InfoSection title="SITE">
            <InfoRow
              icon="map-marker-outline"
              text={`${projectDetail.address || projectDetail.location?.address || "Site location"} · ${projectDetail.distance || "Distance checked on site"}`}
            />
            <InfoRow icon="calendar-range-outline" text={projectDetail.dates} />
            <InfoRow icon="hard-hat" text={projectDetail.trade} />
          </InfoSection>
          <InfoSection title="PROJECT MANAGER">
            <InfoRow icon="account-outline" text="Daniel Kim · Site manager" />
          </InfoSection>
          <Pressable
            disabled={busy}
            onPress={() => acceptProject(projectDetail)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {busy ? "Checking availability…" : "Accept project"}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={19}
              color={C.white}
            />
          </Pressable>
          <Text style={styles.securityNote}>
            Acceptance is exclusive. The server confirms the assignment before
            it appears in your projects.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );

  const showGpsState = () => {
    const messages = {
      "permission-denied": [
        "Location permission denied",
        "Enable location access in device settings to continue.",
      ],
      outside: [
        "Outside attendance radius",
        `You are ${location?.distance || "more than 100"} m from the site. Check-in is blocked beyond 100 m.`,
      ],
      "camera-denied": [
        "Camera permission denied",
        "Enable camera access in device settings to complete the required selfie verification.",
      ],
      "poor-accuracy": [
        "GPS fix unavailable",
        "Move outdoors and request a new location fix.",
      ],
      error: [
        "Location unavailable",
        "Try again when your device can access GPS.",
      ],
    };
    if (messages[gpsState]) notify(...messages[gpsState]);
  };

  const startBreak = async () => {
    setBusy(true);
    try {
      const result = await apiRequest(
        "/api/attendance/break/start",
        {
          projectId:
            currentProject?._id ||
            currentProject?.id ||
            currentProject?.projectId,
        },
        token,
      );
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
      const result = await apiRequest(
        "/api/attendance/break/resume",
        {
          projectId:
            currentProject?._id ||
            currentProject?.id ||
            currentProject?.projectId,
        },
        token,
      );
      saveAttendance(result.attendance);
    } catch (error) {
      notify("Could not resume work", error.message);
    } finally {
      setBusy(false);
    }
  };
  const content =
    tab === "Home" ? (
      <HomeScreen
        user={user}
        project={currentProject}
        attendance={attendance}
        progressUpdates={progressUpdates}
        weeklyHours={attendanceRecords.reduce((total, record) => {
          const checkIn = new Date(record.checkedInAt);
          const monday = new Date();
          monday.setHours(0, 0, 0, 0);
          monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
          if (Number.isNaN(checkIn.getTime()) || checkIn < monday) return total;
          const checkOut = record.checkedOutAt ? new Date(record.checkedOutAt) : new Date();
          return total + Math.max(0, (checkOut - checkIn) / 3600000);
        }, 0).toFixed(1)}
        pendingUpdates={progressUpdates.filter(update => update.reviewStatus === "Pending").length}
        onCheckIn={() => checkLocation("checkin")}
        onCheckOut={() => checkLocation("checkout")}
        onBreak={startBreak}
        onResume={resumeWork}
        busy={busy}
        gpsState={gpsState}
        onProgress={() => setTab("Progress")}
      />
    ) : tab === "Projects" ? (
      <ProjectsScreen
        projects={projects.filter(
          (project) => !project.assigned && project.status === "Open",
        )}
        currentProject={currentProject}
        onDetails={setProjectDetail}
        onProgress={() => setTab("Progress")}
      />
    ) : tab === "Attendance" ? (
      <AttendanceScreen
        onVerify={checkLocation}
        state={gpsState}
        location={location}
        onStateInfo={showGpsState}
        project={currentProject}
      />
    ) : tab === "Progress" ? (
      <ProgressScreen
        text={progressText}
        setText={setProgressText}
        remarks={remarks}
        setRemarks={setRemarks}
        percent={progressPercent}
        setPercent={setProgressPercent}
        photos={photos}
        onPick={pickPhotos}
        onSubmit={submitProgress}
        busy={busy}
        project={currentProject}
      />
    ) : tab === "Alerts" ? (
      <NotificationsScreen
        notifications={notifications}
        onMarkRead={async (notification) => {
          try {
            await apiRequest(`/api/notifications/${notification._id}/read`, undefined, token, "PATCH");
            setNotifications(current => current.map(item => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
          } catch (error) {
            notify("Could not update notification", error.message);
          }
        }}
      />
    ) : (
      <ProfileScreen user={user} project={currentProject} onLogout={handleLogout} />
    );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons
            name="office-building"
            size={19}
            color={C.white}
          />
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageContent}
      >
        {content}
      </ScrollView>
      <View style={styles.bottomTabs}>
        {TABS.map(({ id, icon }) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            style={styles.tabButton}
          >
            <View style={[styles.tabIcon, tab === id && styles.tabIconActive]}>
              <MaterialCommunityIcons
                name={icon}
                size={21}
                color={tab === id ? C.orange : C.muted}
              />
            </View>
            <Text
              style={[styles.tabLabel, tab === id && styles.tabLabelActive]}
            >
              {id}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (forgotPassword) {
      Alert.alert("Password reset", "Contact your administrator to reset your account password.");
      return;
    }
    setSubmitting(true);
    await onLogin(email.trim(), password);
    setSubmitting(false);
  };
  return (
    <SafeAreaView style={styles.loginScreen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginWrap}>
        <View style={styles.loginBrand}><View style={styles.brandMark}><MaterialCommunityIcons name="office-building" size={22} color={C.white} /></View><Text style={styles.loginBrandName}>BuildFlow</Text><Text style={styles.loginBrandCaption}>FIELD WORKSPACE</Text></View>
        <View style={styles.loginPanel}>
          <Text style={styles.eyebrow}>WORKER ACCESS</Text>
          <Text style={styles.loginTitle}>{forgotPassword ? "Reset your password" : "Welcome back"}</Text>
          <Text style={styles.bodyCopy}>{forgotPassword ? "Enter your account email and contact your team administrator." : "Sign in to view your assignments and site updates."}</Text>
          <Text style={styles.loginLabel}>EMAIL ADDRESS</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@company.com" style={styles.loginInput} />
          {!forgotPassword && <><Text style={styles.loginLabel}>PASSWORD</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Enter your password" style={styles.loginInput} /></>}
          {!!error && <Text style={styles.loginError}>{error}</Text>}
          {!API_URL && <Text style={styles.apiNotice}>Set EXPO_PUBLIC_API_URL to connect to your BuildFlow API.</Text>}
          <Pressable disabled={submitting} onPress={submit} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{submitting ? "Signing in…" : forgotPassword ? "Continue" : "Sign in"}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={C.white}/></Pressable>
          <Pressable onPress={() => setForgotPassword(value => !value)} style={styles.forgotAction}><Text style={styles.orangeText}>{forgotPassword ? "Back to sign in" : "Forgot password?"}</Text></Pressable>
        </View>
        <Text style={styles.loginFooter}>Secure access for authorized field team members.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BreakTimer({ startedAt, endedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const endTime = endedAt ? new Date(endedAt).getTime() : now;
  const elapsedSeconds = Math.max(0, Math.floor((endTime - new Date(startedAt).getTime()) / 1000));
  const remainingSeconds = Math.max(0, 3600 - elapsedSeconds);
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <View style={styles.breakTimer}><View><Text style={styles.breakCaption}>BREAK ELAPSED</Text><Text style={styles.breakValue}>{format(Math.min(elapsedSeconds, 3600))}</Text></View><View><Text style={styles.breakCaption}>REMAINING</Text><Text style={styles.breakRemaining}>{format(remainingSeconds)}</Text></View><Text style={styles.breakLimit}>60 min max</Text></View>;
}

function HomeScreen({ user, project, attendance, progressUpdates = [], weeklyHours, pendingUpdates, onCheckIn, onCheckOut, gpsState, onBreak, onResume, busy, onProgress }) {
  const isCheckedIn = attendance?.status === "active" || attendance?.status === "on_break";
  const isOnBreak = attendance?.status === "on_break";
  const shiftComplete = attendance?.status === "completed";
  const breakComplete = Boolean(attendance?.breakUsed && !isOnBreak);
  const firstName = user?.name?.split(" ")[0] || "Worker";
  const primaryAction = !attendance ? onCheckIn : isOnBreak ? onResume : onBreak;
  const latestUpdate = progressUpdates[0];
  const breakRemainingMinutes = isOnBreak && attendance?.breakStartedAt
    ? Math.max(0, Math.ceil((3600000 - (Date.now() - new Date(attendance.breakStartedAt).getTime())) / 60000))
    : "—";
  return (
    <>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.eyebrow}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          <Text style={styles.bodyCopy}>
            Your site plan and shift at a glance.
          </Text>
        </View>
        <View style={styles.initialAvatar}>
          <Text style={styles.initialAvatarText}>{user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.projectHero}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85",
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>TODAY'S ASSIGNMENT</Text>
          <Text style={styles.heroTitle}>{project?.name || "No project assigned"}</Text>
          <Text style={styles.heroSubtitle}>{project?.description || "Your next assignment will appear here."}</Text>
          <View style={styles.heroLocation}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color="#f2a16c"
            />
            <Text style={styles.heroLocationText}>{project?.address || "Project site location"}</Text>
          </View>
          <View style={styles.heroMeta}>
            <View>
              <Text>SITE MANAGER</Text>
              <Text style={styles.heroMetaValue}>{project?.managerName || "Project manager"}</Text>
            </View>
            <View>
              <Text>PROJECT PROGRESS</Text>
              <Text style={styles.heroMetaValue}>{project?.progress || 0}%</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.shiftCard}>
        <View style={styles.shiftHead}>
          <View>
            <Text style={styles.cardTitle}>Your shift</Text>
            <Text style={styles.mutedText}>{shiftComplete ? "Your shift has been completed" : isOnBreak ? "Break in progress" : isCheckedIn ? "Your verified shift is active" : "Attendance not verified"}</Text>
          </View>
          <Badge label={shiftComplete ? "COMPLETE" : isOnBreak ? "ON BREAK" : isCheckedIn ? "ON SHIFT" : "NOT CHECKED IN"} tone={shiftComplete || isCheckedIn ? "green" : "amber"} />
        </View>
        <View style={styles.shiftFacts}>
          <InfoRow icon="clock-outline" text={`${attendance?.checkedInAt ? new Date(attendance.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not checked in"} – ${attendance?.checkedOutAt ? new Date(attendance.checkedOutAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not checked out"}`} />
          <InfoRow icon="map-marker-radius-outline" text={`${project?.location?.radiusMetres || 100} m site radius`} />
        </View>
        {attendance?.breakUsed && attendance?.breakStartedAt && <BreakTimer startedAt={attendance.breakStartedAt} endedAt={attendance.breakEndedAt} />}
        <Pressable disabled={busy || !project || shiftComplete || (breakComplete && !isOnBreak)} onPress={primaryAction} style={styles.primaryButton}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={18}
            color={C.white}
          />
          <Text style={styles.primaryButtonText}>
            {busy ? "Updating shift…" : gpsState === "checking"
              ? "Finding your location…"
              : shiftComplete ? "Shift complete" : !attendance ? "Verify & check in" : isOnBreak ? "Resume work" : breakComplete ? "Break completed" : "Start break"}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={C.white}
          />
        </Pressable>
        {isCheckedIn && !isOnBreak && <Pressable disabled={busy} onPress={onCheckOut} style={styles.checkOutButton}><MaterialCommunityIcons name="logout-variant" size={17} color={C.orange}/><Text style={styles.checkOutText}>Check out with selfie & work photos</Text></Pressable>}
        <View style={styles.securityNote}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={15}
            color={C.green}
          />
          <Text>
            GPS and selfie verification are required. No manual override.
          </Text>
        </View>
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Today's work</Text>
        <Pressable onPress={onProgress}>
          <Text style={styles.orangeText}>
            Update work <MaterialCommunityIcons name="arrow-right" size={13} />
          </Text>
        </Pressable>
      </View>
      <View style={styles.taskCard}>
        <View style={styles.taskRow}>
          <View style={styles.taskIcon}>
            <MaterialCommunityIcons
              name="layers-triple-outline"
              size={20}
              color={C.orange}
            />
          </View>
          <View style={styles.taskCopy}>
            <Text style={styles.taskTitle}>{project?.name ? "Today's assigned work" : "No work assigned yet"}</Text>
            <Text style={styles.mutedText}>Daily progress · Due today</Text>
          </View>
        </View>
        <View style={styles.progressCaption}>
          <Text>Today's progress</Text>
          <Text>{project?.progress || 0}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(project?.progress) || 0))}%` }]} />
        </View>
        <Pressable onPress={onProgress} style={styles.linkAction}>
          <MaterialCommunityIcons
            name="camera-outline"
            size={16}
            color={C.orange}
          />
          <Text>Add update or work photos</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={C.orange}
          />
        </Pressable>
      </View>
      <View style={styles.statsGrid}>
        <Stat
          icon="clock-check-outline"
          value={`${weeklyHours}h`}
          label="This week"
          tone="green"
        />
        <Stat
          icon="image-multiple-outline"
          value={String(pendingUpdates)}
          label="Updates pending"
          tone="orange"
        />
        <Stat
          icon="timer-sand"
          value={typeof breakRemainingMinutes === "number" ? `${breakRemainingMinutes}m` : "—"}
          label="Break remaining"
          tone="amber"
        />
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Recent update</Text>
        <Text style={styles.mutedText}>{latestUpdate?.createdAt ? new Date(latestUpdate.createdAt).toLocaleString() : "No submissions yet"}</Text>
      </View>
      <View style={styles.activityCard}>
        <View style={styles.activityMark}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={18}
            color={C.green}
          />
        </View>
        <View style={styles.taskCopy}>
          <Text style={styles.taskTitle}>{latestUpdate?.description || "No progress updates submitted"}</Text>
          <Text style={styles.mutedText}>
            {project?.name || "Assigned project"}{latestUpdate?.reviewStatus ? ` · ${latestUpdate.reviewStatus}` : ""}
          </Text>
        </View>
      </View>
    </>
  );
}

function ProjectsScreen({ projects = [], currentProject, onDetails, onProgress }) {
  return (
    <>
      <PageHeader
        title="My projects"
        subtitle="Your assignment and nearby work."
      />
      <View style={styles.sectionLabel}>CURRENT ASSIGNMENT</View>
      {currentProject ? <View style={styles.assignmentCard}>
        <View style={styles.assignmentIcon}>
          <MaterialCommunityIcons
            name="office-building-outline"
            size={21}
            color={C.orange}
          />
        </View>
        <Text style={styles.taskTitle}>{currentProject.name}</Text>
        <Text style={styles.mutedText}>{currentProject.status || "Assigned"}</Text>
        <InfoRow icon="map-marker-outline" text={currentProject.address || "Project location"} />
        <InfoRow icon="calendar-range-outline" text={currentProject.dates || "Schedule available in project details"} />
        <View style={styles.inlineActions}>
          <Pressable onPress={onProgress}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={15}
              color={C.orange}
            />
            <Text>Work updates</Text>
          </Pressable>
          <Pressable onPress={onProgress}>
            <MaterialCommunityIcons
              name="camera-outline"
              size={15}
              color={C.orange}
            />
            <Text>Photos</Text>
          </Pressable>
        </View>
      </View> : <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No current assignment</Text><Text style={styles.mutedText}>Browse available work below.</Text></View>}
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Available nearby</Text>
        <Text style={styles.sectionLabel}>{projects.length} OPEN</Text>
      </View>
      {projects.map((project) => (
        <Pressable
          key={project.id}
          style={styles.opportunityCard}
          onPress={() => onDetails(project)}
        >
          <View style={styles.opportunityTop}>
            <View style={styles.assignmentIcon}>
              <MaterialCommunityIcons name="crane" size={20} color={C.orange} />
            </View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{project.name}</Text>
              <Text style={styles.mutedText}>{project.trade}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={C.muted}
            />
          </View>
          <InfoRow
            icon="map-marker-outline"
            text={`${project.address || "Site location"} · ${project.distance}`}
          />
          <InfoRow icon="calendar-outline" text={project.dates} />
          <Text style={styles.projectDescription}>{project.description}</Text>
          <Text style={styles.orangeText}>
            View details and accept{" "}
            <MaterialCommunityIcons name="arrow-right" size={14} />
          </Text>
        </Pressable>
      ))}
      {projects.length === 0 && <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No available projects</Text><Text style={styles.mutedText}>New eligible work will appear here.</Text></View>}
    </>
  );
}

function AttendanceScreen({ onVerify, state, location, onStateInfo, project }) {
  const status =
    state === "within"
      ? "Inside allowed radius"
      : state === "outside"
        ? "Outside allowed radius"
        : state === "poor-accuracy"
          ? "GPS accuracy too low"
        : state === "camera-denied"
          ? "Camera permission needed"
          : state === "checking"
            ? "Getting GPS fix…"
            : state === "permission-denied"
              ? "Location permission denied"
              : "Location not verified";
  const tone =
    state === "within"
      ? "green"
      : state === "outside" ||
          state === "camera-denied" ||
          state === "permission-denied"
        ? "red"
        : "amber";
  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="GPS-verified site check-in and shift record."
      />
      <View style={styles.mapPanel}>
        <View style={styles.mapBlocks}>
          <View />
          <View />
          <View />
          <View />
          <View />
        </View>
        <View style={styles.mapRadius} />
        <View style={styles.mapPin}>
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={C.orange}
          />
        </View>
        <View style={styles.mapLabel}>
          <Text style={styles.taskTitle}>{project?.name || "Assigned site"}</Text>
          <Text style={styles.mutedText}>{project?.address || "Project location"}</Text>
        </View>
        <View style={styles.mapAccuracy}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={15}
            color={C.green}
          />
          <Text>
            {location
              ? `GPS ±${Math.round(location.accuracy)} m`
              : "GPS accuracy unavailable"}
          </Text>
        </View>
      </View>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <View
            style={[
              styles.stateIcon,
              {
                backgroundColor:
                  tone === "green"
                    ? C.greenLight
                    : tone === "red"
                      ? "#fbedeb"
                      : C.amberLight,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                state === "within"
                  ? "map-marker-check"
                  : state === "outside"
                    ? "map-marker-alert"
                    : "crosshairs-gps"
              }
              size={19}
              color={
                tone === "green" ? C.green : tone === "red" ? C.red : C.amber
              }
            />
          </View>
          <View style={styles.taskCopy}>
            <Text style={styles.taskTitle}>{status}</Text>
            <Text style={styles.mutedText}>
              {location
                ? `${location.distance} m from site · ${Math.round(location.accuracy)} m accuracy`
                : "Request a live location fix to continue."}
            </Text>
          </View>
        </View>
        <InfoRow
          icon="shield-check-outline"
          text={`Check-in allowed only within ${project?.location?.radiusMetres || 100} m of the project.`}
        />
        <InfoRow
          icon="camera-outline"
          text="Selfie capture is required to record attendance."
        />
        {state === "outside" && (
          <Text style={styles.errorCopy}>
            You are {location?.distance} m from the site. Move within the
            boundary and retry.
          </Text>
        )}
        {state === "poor-accuracy" && (
          <Text style={styles.errorCopy}>Move outdoors and retry. The location accuracy must be within the site radius.</Text>
        )}
        {state === "permission-denied" && (
          <Text style={styles.errorCopy}>
            Enable location access in device settings, then retry.
          </Text>
        )}
        {state === "camera-denied" && (
          <Text style={styles.errorCopy}>
            Enable camera access in device settings to continue.
          </Text>
        )}
        <Pressable onPress={onVerify} style={styles.primaryButton}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={18}
            color={C.white}
          />
          <Text style={styles.primaryButtonText}>
            {state === "checking"
              ? "Getting GPS fix…"
              : "Verify location & continue"}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={C.white}
          />
        </Pressable>
        <Text style={styles.securityNote}>
          No attendance is recorded until the server verifies your location and
          selfie.
        </Text>
        <View style={styles.todayRecord}>
          <Text style={styles.cardTitle}>Today's record</Text>
          <Text style={styles.mutedText}>
            No check-in recorded for this shift.
          </Text>
        </View>
        {state === "outside" && (
          <Pressable onPress={onStateInfo} style={styles.secondaryAction}>
            <Text style={styles.errorCopy}>Why is check-in blocked?</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

function ProgressScreen({
  project,
  text,
  setText,
  remarks,
  setRemarks,
  percent,
  setPercent,
  photos,
  onPick,
  onSubmit,
  busy,
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PageHeader
        title="Daily progress"
        subtitle="Record completed work for your site manager."
      />
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>PROJECT</Text>
        <Text style={styles.taskTitle}>{project?.name || "No assigned project"}</Text>
        <Text style={[styles.formLabel, { marginTop: 17 }]}>WORK DATE</Text>
        <Text style={styles.fieldStatic}>
          {new Date().toLocaleDateString()}
        </Text>
        <Text style={styles.formLabel}>WORK DESCRIPTION</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Describe the work completed today…"
          placeholderTextColor="#a3aeac"
          style={[styles.textField, styles.multiline]}
        />
        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>PROGRESS %</Text>
            <TextInput
              value={percent}
              onChangeText={(value) => setPercent(value.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.textField}
            />
          </View>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>REMARKS</Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Optional"
              style={styles.textField}
            />
          </View>
        </View>
        <Text style={styles.formLabel}>WORK PHOTOS</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={styles.photoThumb}
            />
          ))}
          <Pressable onPress={onPick} style={styles.addPhoto}>
            <MaterialCommunityIcons
              name="image-plus-outline"
              size={22}
              color={C.orange}
            />
            <Text>Add photos</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={busy}
          onPress={onSubmit}
          style={styles.primaryButton}
        >
          <MaterialCommunityIcons
            name="send-outline"
            size={17}
            color={C.white}
          />
          <Text style={styles.primaryButtonText}>
            {busy ? "Submitting…" : "Submit progress update"}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={17}
            color={C.white}
          />
        </Pressable>
        <Text style={styles.securityNote}>
          Photos are uploaded before the progress record is saved to the project API.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function NotificationsScreen({ notifications = [], onMarkRead }) {
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Project, attendance, and crew updates."
      />
      <View style={styles.notificationList}>
        {notifications.map((notification) => {
          const unread = !notification.readAt;
          const icon = notification.category === "attendance" ? "calendar-clock-outline"
            : notification.category === "finance" ? "cash-check"
              : notification.category === "progress" ? "clipboard-check-outline"
                : "bell-outline";
          const detail = [notification.project?.name, notification.message, notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""].filter(Boolean).join(" · ");
          return (
          <Pressable key={notification._id} onPress={() => unread && onMarkRead?.(notification)} style={styles.notificationItem}>
            <View
              style={[
                styles.notificationIcon,
                unread && styles.notificationUnread,
              ]}
            >
              <MaterialCommunityIcons
                name={icon}
                size={19}
                color={unread ? C.orange : C.muted}
              />
            </View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{notification.title}</Text>
              <Text style={styles.mutedText}>{detail}</Text>
            </View>
            {unread && <View style={styles.unreadDot} />}
          </Pressable>
          );
        })}
        {notifications.length === 0 && <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No notifications</Text><Text style={styles.mutedText}>Updates for your assigned work will appear here.</Text></View>}
      </View>
    </>
  );
}

function ProfileScreen({ user, project, onLogout }) {
  return (
    <>
      <PageHeader
        title="Profile & settings"
        subtitle="Account details and field-work preferences."
      />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || "Worker"}</Text>
        <Text style={styles.mutedText}>Worker account</Text>
        <View style={styles.profileDivider} />
        <InfoRow icon="email-outline" text={user?.email || "Worker account"} />
        <InfoRow icon="hard-hat" text={project ? `Worker · ${project.name}` : "Worker · No active assignment"} />
        <InfoRow
          icon="shield-check-outline"
          text="Location used for attendance verification"
        />
      </View>
      <View style={styles.preferenceCard}>
        <InfoRow icon="bell-cog-outline" text="Notification preferences" />
        <InfoRow icon="help-circle-outline" text="Help and support" />
        <Pressable onPress={onLogout} style={styles.logoutButton}><MaterialCommunityIcons name="logout" size={17} color={C.red}/><Text style={styles.logoutText}>Sign out</Text></Pressable>
      </View>
    </>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.bodyCopy}>{subtitle}</Text>
    </View>
  );
}
function Badge({ label, tone = "neutral" }) {
  return (
    <View
      style={[
        styles.badge,
        tone === "green" && styles.badgeGreen,
        tone === "amber" && styles.badgeAmber,
        tone === "red" && styles.badgeRed,
      ]}
    >
      <View
        style={[
          styles.badgeDot,
          tone === "green" && styles.dotGreen,
          tone === "amber" && styles.dotAmber,
          tone === "red" && styles.dotRed,
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          tone === "green" && styles.textGreen,
          tone === "amber" && styles.textAmber,
          tone === "red" && styles.textRed,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={C.muted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}
function ConfirmRow({ icon, label, value }) {
  return (
    <View style={styles.confirmRow}>
      <MaterialCommunityIcons name={icon} size={17} color={C.muted} />
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}
function InfoSection({ title, children }) {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.formLabel}>{title}</Text>
      {children}
    </View>
  );
}
function Stat({ icon, value, label, tone }) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          tone === "green" && styles.statGreen,
          tone === "orange" && styles.statOrange,
          tone === "amber" && styles.statAmber,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={
            tone === "green" ? C.green : tone === "orange" ? C.orange : C.amber
          }
        />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loginScreen: { flex: 1, backgroundColor: C.canvas },
  loginWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 30 },
  loginBrand: { alignItems: "center", marginBottom: 23 },
  loginBrandName: { marginTop: 9, color: C.ink, fontSize: 18, fontWeight: "800" },
  loginBrandCaption: { marginTop: 2, color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  loginPanel: { padding: 17, borderWidth: 1, borderColor: C.line, borderRadius: 11, backgroundColor: C.white },
  loginTitle: { marginTop: 6, color: C.ink, fontSize: 22, fontWeight: "800" },
  loginLabel: { marginTop: 18, marginBottom: 6, color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  loginInput: { height: 43, paddingHorizontal: 11, borderWidth: 1, borderColor: C.line, borderRadius: 6, color: C.ink, backgroundColor: C.white, fontSize: 10 },
  loginError: { marginTop: 10, color: C.red, fontSize: 9 },
  apiNotice: { marginTop: 10, padding: 9, borderRadius: 5, color: C.amber, backgroundColor: C.amberLight, fontSize: 8, lineHeight: 13 },
  forgotAction: { alignSelf: "center", paddingVertical: 12 },
  loginFooter: { alignSelf: "center", marginTop: 17, color: C.muted, fontSize: 8 },
  screen: { flex: 1, backgroundColor: C.canvas },
  pageContent: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 28 },
  topBar: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { marginLeft: 9, flex: 1 },
  brandName: { fontSize: 15, fontWeight: "800", color: C.ink },
  brandLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: C.muted,
    marginTop: 1,
  },
  topBell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.orange,
    borderWidth: 1,
    borderColor: C.white,
  },
  bottomTabs: {
    height: 66,
    flexDirection: "row",
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 3,
    paddingBottom: Platform.OS === "ios" ? 7 : 2,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIcon: {
    width: 34,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: { backgroundColor: C.orangeLight },
  tabLabel: { fontSize: 8, color: C.muted, fontWeight: "600" },
  tabLabelActive: { color: C.orange, fontWeight: "800" },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: C.orange,
  },
  greeting: { fontSize: 21, fontWeight: "800", color: C.ink, marginTop: 5 },
  bodyCopy: { fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 16 },
  initialAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  initialAvatarText: { color: C.white },
  projectHero: {
    height: 252,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: C.navy,
    marginBottom: 11,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "#102a35c7" },
  heroCopy: { flex: 1, justifyContent: "flex-end", padding: 16 },
  heroEyebrow: {
    color: "#f6b17e",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: C.white, marginTop: 7 },
  heroSubtitle: { color: "#d1dddf", fontSize: 11, marginTop: 3 },
  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  heroLocationText: { color: "#ecf0ef", fontSize: 9 },
  heroMeta: {
    flexDirection: "row",
    gap: 40,
    paddingTop: 11,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: "#ffffff38",
  },
  heroMetaValue: {
    color: C.white,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  shiftCard: {
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  shiftHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  mutedText: { fontSize: 9, color: C.muted, marginTop: 3 },
  shiftFacts: {
    gap: 9,
    paddingVertical: 12,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  checkOutButton: { height: 40, marginTop: 8, borderWidth: 1, borderColor: "#efc6a8", borderRadius: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  checkOutText: { color: C.orange, fontSize: 9, fontWeight: "800" },
  breakTimer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, marginBottom: 4, borderRadius: 7, backgroundColor: C.amberLight },
  breakCaption: { color: C.amber, fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  breakValue: { marginTop: 3, color: C.ink, fontSize: 14, fontWeight: "800" },
  breakRemaining: { marginTop: 3, color: C.amber, fontSize: 14, fontWeight: "800" },
  breakLimit: { color: C.muted, fontSize: 7 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  infoText: { flex: 1, fontSize: 9, color: "#647376", lineHeight: 14 },
  primaryButton: {
    height: 45,
    borderRadius: 8,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 9,
  },
  primaryButtonText: {
    flex: 1,
    marginLeft: 8,
    color: C.white,
    fontSize: 11,
    fontWeight: "800",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    color: C.muted,
    fontSize: 8,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 9,
  },
  orangeText: { fontSize: 9, color: C.orange, fontWeight: "800" },
  taskCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.orangeLight,
  },
  taskCopy: { flex: 1 },
  taskTitle: { fontSize: 10, fontWeight: "800", color: "#334348" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#eff2f1",
  },
  badgeGreen: { backgroundColor: C.greenLight },
  badgeAmber: { backgroundColor: C.amberLight },
  badgeRed: { backgroundColor: "#fbedeb" },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#83908f",
  },
  dotGreen: { backgroundColor: C.green },
  dotAmber: { backgroundColor: C.amber },
  dotRed: { backgroundColor: C.red },
  badgeText: { fontSize: 7, fontWeight: "800", color: "#647174" },
  textGreen: { color: C.green },
  textAmber: { color: C.amber },
  textRed: { color: C.red },
  progressCaption: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 5,
  },
  progressCaptionText: { fontSize: 8, color: C.muted },
  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "#edf1ee",
    overflow: "hidden",
  },
  progressFill: {
    width: "62%",
    height: "100%",
    borderRadius: 5,
    backgroundColor: C.green,
  },
  linkAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    marginTop: 11,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  linkActionText: { flex: 1, fontSize: 9, color: C.orange, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 7, marginTop: 9 },
  statCard: {
    flex: 1,
    minHeight: 81,
    padding: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  statIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statGreen: { backgroundColor: C.greenLight },
  statOrange: { backgroundColor: C.orangeLight },
  statAmber: { backgroundColor: C.amberLight },
  statValue: { fontSize: 15, fontWeight: "800", color: C.ink },
  statLabel: { fontSize: 7, color: C.muted, marginTop: 3 },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  activityMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.greenLight,
  },
  pageHeader: { marginBottom: 17 },
  screenTitle: { fontSize: 22, fontWeight: "800", color: C.ink },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: C.muted,
    marginBottom: 8,
  },
  assignmentCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  assignmentIcon: {
    width: 37,
    height: 37,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.orangeLight,
    marginBottom: 9,
  },
  inlineActions: {
    flexDirection: "row",
    gap: 17,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  inlineAction: { flexDirection: "row", alignItems: "center", gap: 5 },
  inlineActionText: { fontSize: 9, color: C.orange, fontWeight: "700" },
  opportunityCard: {
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  opportunityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 3,
  },
  projectDescription: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 14,
    marginTop: 8,
  },
  mapPanel: {
    height: 220,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dce7e0",
    borderRadius: 10,
    backgroundColor: "#e8efea",
    justifyContent: "center",
    alignItems: "center",
  },
  mapBlocks: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    transform: [{ rotate: "-12deg" }],
  },
  mapBlocksBlock: {},
  mapRadius: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#e8752480",
    backgroundColor: "#e8752418",
  },
  mapPin: {
    width: 41,
    height: 41,
    borderRadius: 22,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#efc6a9",
  },
  mapLabel: {
    position: "absolute",
    top: 13,
    left: 13,
    padding: 8,
    borderRadius: 6,
    backgroundColor: C.white,
  },
  mapAccuracy: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 7,
    borderRadius: 6,
    backgroundColor: C.white,
  },
  mapAccuracyText: { fontSize: 8, color: C.muted },
  verificationCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 8,
  },
  stateIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  errorCopy: { fontSize: 9, color: C.red, marginTop: 9, lineHeight: 14 },
  todayRecord: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  secondaryAction: { alignSelf: "flex-start", marginTop: 8 },
  formCard: {
    padding: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  formLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: C.muted,
    marginBottom: 6,
  },
  fieldStatic: { fontSize: 10, color: C.ink, marginBottom: 14 },
  textField: {
    minHeight: 39,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    color: C.ink,
    fontSize: 10,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 82, paddingTop: 9, textAlignVertical: "top" },
  formRow: { flexDirection: "row", gap: 9, marginTop: 13 },
  formHalf: { flex: 1 },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 5,
  },
  photoThumb: { width: 61, height: 61, borderRadius: 6 },
  addPhoto: {
    width: 84,
    height: 61,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e6b58f",
    borderRadius: 6,
    backgroundColor: "#fffaf6",
  },
  addPhotoText: { fontSize: 7, color: C.orange, fontWeight: "700" },
  notificationList: { gap: 8 },
  notificationItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  notificationIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f3f1",
  },
  notificationUnread: { backgroundColor: C.orangeLight },
  profileCard: {
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  profileAvatar: {
    width: 57,
    height: 57,
    borderRadius: 30,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { fontSize: 15, fontWeight: "800", color: C.white },
  profileName: { fontSize: 14, fontWeight: "800", color: C.ink, marginTop: 9 },
  profileDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: C.line,
    marginVertical: 13,
  },
  preferenceCard: {
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  logoutButton: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderColor: C.line, marginTop: 9 },
  logoutText: { color: C.red, fontSize: 9, fontWeight: "700" },
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1, justifyContent: "space-between" },
  cameraTop: { alignItems: "center", paddingTop: 16 },
  cameraClose: {
    position: "absolute",
    top: 10,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff26",
  },
  cameraTitle: { fontSize: 15, fontWeight: "800", color: C.white },
  cameraCaption: { fontSize: 10, color: "#d8e0e0", marginTop: 3 },
  faceFrame: {
    alignSelf: "center",
    width: 230,
    height: 300,
    borderWidth: 2,
    borderColor: "#ffffffa6",
    borderRadius: 120,
  },
  cameraBottom: { alignItems: "center", paddingBottom: 32 },
  gpsCameraPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: "#10252dbb",
  },
  gpsCameraPillText: { fontSize: 9, color: C.white },
  captureButton: {
    width: 68,
    height: 68,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 27,
    backgroundColor: C.white,
  },
  confirmHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: { fontSize: 13, fontWeight: "800", color: C.ink },
  confirmContent: { padding: 16 },
  selfiePreview: {
    width: 130,
    height: 150,
    alignSelf: "center",
    borderRadius: 9,
    marginVertical: 13,
    backgroundColor: "#e6eae8",
  },
  confirmCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
    marginVertical: 12,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 37,
    borderBottomWidth: 1,
    borderColor: "#edf0ee",
  },
  confirmLabel: { width: 82, fontSize: 8, color: C.muted },
  confirmValue: { flex: 1, fontSize: 8, fontWeight: "700", color: C.ink },
  securityNoteText: { fontSize: 8, color: C.muted, lineHeight: 12 },
  detailHero: {
    padding: 15,
    marginBottom: 13,
    borderRadius: 9,
    backgroundColor: C.navy,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.white,
    marginTop: 10,
  },
  detailBody: { fontSize: 10, color: "#d3dedf", lineHeight: 15, marginTop: 6 },
  infoSection: {
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
});
