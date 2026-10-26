import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { Badge, InfoRow, BreakTimer, Stat } from "../components/UI.jsx";
export function HomeScreen({
  user,
  project,
  attendance,
  progressUpdates = [],
  weeklyHours,
  pendingUpdates,
  onCheckIn,
  onCheckOut,
  gpsState,
  onBreak,
  onResume,
  busy,
  onProgress
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const isCheckedIn = attendance?.status === "active" || attendance?.status === "on_break";
  const isOnBreak = attendance?.status === "on_break";
  const shiftComplete = attendance?.status === "completed";
  const breakComplete = Boolean(attendance?.breakUsed && !isOnBreak);
  const firstName = user?.name?.split(" ")[0] || "Worker";
  const primaryAction = !attendance ? onCheckIn : isOnBreak ? onResume : onBreak;
  const latestUpdate = progressUpdates[0];
  const breakRemainingMinutes = isOnBreak && attendance?.breakStartedAt ? Math.max(0, Math.ceil((3600000 - (now - new Date(attendance.breakStartedAt).getTime())) / 60000)) : "—";
  return <>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.eyebrow}>{new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
          }).toUpperCase()}</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          <Text style={styles.bodyCopy}>
            Your site plan and shift at a glance.
          </Text>
        </View>
        <View style={styles.initialAvatar}>
          <Text style={styles.initialAvatarText}>{user?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
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
          <InfoRow icon="clock-outline" text={`${attendance?.checkedInAt ? new Date(attendance.checkedInAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        }) : "Not checked in"} – ${attendance?.checkedOutAt ? new Date(attendance.checkedOutAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        }) : "Not checked out"}`} />
          <InfoRow icon="map-marker-radius-outline" text={`${project?.location?.radiusMetres || 100} m site radius`} />
        </View>
        {attendance?.breakUsed && attendance?.breakStartedAt && <BreakTimer startedAt={attendance.breakStartedAt} endedAt={attendance.breakEndedAt} />}
        <Pressable disabled={busy || !project || shiftComplete || breakComplete && !isOnBreak} onPress={primaryAction} style={styles.primaryButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={C.white} />
          <Text style={styles.primaryButtonText}>
            {busy ? "Updating shift…" : gpsState === "checking" ? "Finding your location…" : shiftComplete ? "Shift complete" : !attendance ? "Check-In" : isOnBreak ? "Resume work" : breakComplete ? "Break completed" : "Start break"}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
        </Pressable>
        {isCheckedIn && <Pressable disabled={busy} onPress={onCheckOut} style={styles.checkOutButton}><MaterialCommunityIcons name="logout-variant" size={17} color={C.orange} /><Text style={styles.checkOutText}>Check-Out</Text></Pressable>}
        <View style={styles.securityNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={15} color={C.green} />
          <Text>
            GPS and selfie verification are required. No manual override.
          </Text>
        </View>
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Today&apos;s work</Text>
        <Pressable onPress={onProgress}>
          <Text style={styles.orangeText}>
            Update work <MaterialCommunityIcons name="arrow-right" size={13} />
          </Text>
        </Pressable>
      </View>
      <View style={styles.taskCard}>
        <View style={styles.taskRow}>
          <View style={styles.taskIcon}>
            <MaterialCommunityIcons name="layers-triple-outline" size={20} color={C.orange} />
          </View>
          <View style={styles.taskCopy}>
            <Text style={styles.taskTitle}>{project?.name ? "Today's assigned work" : "No work assigned yet"}</Text>
            <Text style={styles.mutedText}>Daily progress · Due today</Text>
          </View>
        </View>
        <View style={styles.progressCaption}>
          <Text>Today&apos;s progress</Text>
          <Text>{project?.progress || 0}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {
          width: `${Math.max(0, Math.min(100, Number(project?.progress) || 0))}%`
        }]} />
        </View>
        <Pressable onPress={onProgress} style={styles.linkAction}>
          <MaterialCommunityIcons name="camera-outline" size={16} color={C.orange} />
          <Text>Add update or work photos</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={C.orange} />
        </Pressable>
      </View>
      <View style={styles.statsGrid}>
        <Stat icon="clock-check-outline" value={`${weeklyHours}h`} label="This week" tone="green" />
        <Stat icon="image-multiple-outline" value={String(pendingUpdates)} label="Updates pending" tone="orange" />
        <Stat icon="timer-sand" value={typeof breakRemainingMinutes === "number" ? `${breakRemainingMinutes}m` : "—"} label="Break remaining" tone="amber" />
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Recent update</Text>
        <Text style={styles.mutedText}>{latestUpdate?.createdAt ? new Date(latestUpdate.createdAt).toLocaleString() : "No submissions yet"}</Text>
      </View>
      <View style={styles.activityCard}>
        <View style={styles.activityMark}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={C.green} />
        </View>
        <View style={styles.taskCopy}>
          <Text style={styles.taskTitle}>{latestUpdate?.description || "No progress updates submitted"}</Text>
          <Text style={styles.mutedText}>
            {project?.name || "Assigned project"}{latestUpdate?.reviewStatus ? ` · ${latestUpdate.reviewStatus}` : ""}
          </Text>
        </View>
      </View>
    </>;
}
