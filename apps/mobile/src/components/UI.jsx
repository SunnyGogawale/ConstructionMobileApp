import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
export function BreakTimer({
  startedAt,
  endedAt
}) {
  const [now, setNow] = useState(Date.now);
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
export function PageHeader({
  title,
  subtitle
}) {
  return <View style={styles.pageHeader}>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.bodyCopy}>{subtitle}</Text>
    </View>;
}
export function Badge({
  label,
  tone = "neutral"
}) {
  return <View style={[styles.badge, tone === "green" && styles.badgeGreen, tone === "amber" && styles.badgeAmber, tone === "red" && styles.badgeRed]}>
      <View style={[styles.badgeDot, tone === "green" && styles.dotGreen, tone === "amber" && styles.dotAmber, tone === "red" && styles.dotRed]} />
      <Text style={[styles.badgeText, tone === "green" && styles.textGreen, tone === "amber" && styles.textAmber, tone === "red" && styles.textRed]}>
        {label}
      </Text>
    </View>;
}
export function InfoRow({
  icon,
  text
}) {
  return <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={C.muted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>;
}
export function ConfirmRow({
  icon,
  label,
  value
}) {
  return <View style={styles.confirmRow}>
      <MaterialCommunityIcons name={icon} size={17} color={C.muted} />
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>;
}
export function InfoSection({
  title,
  children
}) {
  return <View style={styles.infoSection}>
      <Text style={styles.formLabel}>{title}</Text>
      {children}
    </View>;
}
export function Stat({
  icon,
  value,
  label,
  tone
}) {
  return <View style={styles.statCard}>
      <View style={[styles.statIcon, tone === "green" && styles.statGreen, tone === "orange" && styles.statOrange, tone === "amber" && styles.statAmber]}>
        <MaterialCommunityIcons name={icon} size={17} color={tone === "green" ? C.green : tone === "orange" ? C.orange : C.amber} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>;
}
