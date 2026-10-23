import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { PageHeader, InfoRow } from "../components/UI.jsx";
export function AttendanceScreen({
  onVerify,
  state,
  location,
  onStateInfo,
  project
}) {
  const status = state === "within" ? "Inside allowed radius" : state === "outside" ? "Outside allowed radius" : state === "poor-accuracy" ? "GPS accuracy too low" : state === "camera-denied" ? "Camera permission needed" : state === "checking" ? "Getting GPS fix…" : state === "permission-denied" ? "Location permission denied" : "Location not verified";
  const tone = state === "within" ? "green" : state === "outside" || state === "camera-denied" || state === "permission-denied" ? "red" : "amber";
  return <>
      <PageHeader title="Attendance" subtitle="GPS-verified site check-in and shift record." />
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
          <MaterialCommunityIcons name="map-marker" size={24} color={C.orange} />
        </View>
        <View style={styles.mapLabel}>
          <Text style={styles.taskTitle}>{project?.name || "Assigned site"}</Text>
          <Text style={styles.mutedText}>{project?.address || "Project location"}</Text>
        </View>
        <View style={styles.mapAccuracy}>
          <MaterialCommunityIcons name="crosshairs-gps" size={15} color={C.green} />
          <Text>
            {location ? `GPS ±${Math.round(location.accuracy)} m` : "GPS accuracy unavailable"}
          </Text>
        </View>
      </View>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <View style={[styles.stateIcon, {
          backgroundColor: tone === "green" ? C.greenLight : tone === "red" ? "#fbedeb" : C.amberLight
        }]}>
            <MaterialCommunityIcons name={state === "within" ? "map-marker-check" : state === "outside" ? "map-marker-alert" : "crosshairs-gps"} size={19} color={tone === "green" ? C.green : tone === "red" ? C.red : C.amber} />
          </View>
          <View style={styles.taskCopy}>
            <Text style={styles.taskTitle}>{status}</Text>
            <Text style={styles.mutedText}>
              {location ? `${location.distance} m from site · ${Math.round(location.accuracy)} m accuracy` : "Request a live location fix to continue."}
            </Text>
          </View>
        </View>
        <InfoRow icon="shield-check-outline" text={`Check-in allowed only within ${project?.location?.radiusMetres || 100} m of the project.`} />
        <InfoRow icon="camera-outline" text="Selfie capture is required to record attendance." />
        {state === "outside" && <Text style={styles.errorCopy}>
            You are {location?.distance} m from the site. Move within the
            boundary and retry.
          </Text>}
        {state === "poor-accuracy" && <Text style={styles.errorCopy}>Move outdoors and retry. The location accuracy must be within the site radius.</Text>}
        {state === "permission-denied" && <Text style={styles.errorCopy}>
            Enable location access in device settings, then retry.
          </Text>}
        {state === "camera-denied" && <Text style={styles.errorCopy}>
            Enable camera access in device settings to continue.
          </Text>}
        <Pressable onPress={onVerify} style={styles.primaryButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={C.white} />
          <Text style={styles.primaryButtonText}>
            {state === "checking" ? "Getting GPS fix…" : "Verify location & continue"}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
        </Pressable>
        <Text style={styles.securityNote}>
          No attendance is recorded until the server verifies your location and
          selfie.
        </Text>
        <View style={styles.todayRecord}>
          <Text style={styles.cardTitle}>Today&apos;s record</Text>
          <Text style={styles.mutedText}>
            No check-in recorded for this shift.
          </Text>
        </View>
        {state === "outside" && <Pressable onPress={onStateInfo} style={styles.secondaryAction}>
            <Text style={styles.errorCopy}>Why is check-in blocked?</Text>
          </Pressable>}
      </View>
    </>;
}
