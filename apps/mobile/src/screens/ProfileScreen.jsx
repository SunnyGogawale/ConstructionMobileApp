import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { PageHeader, InfoRow } from "../components/UI.jsx";
export function ProfileScreen({
  user,
  project,
  onLogout
}) {
  return <>
      <PageHeader title="Profile & settings" subtitle="Account details and field-work preferences." />
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{user?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || "Worker"}</Text>
        <Text style={styles.mutedText}>Worker account</Text>
        <View style={styles.profileDivider} />
        <InfoRow icon="email-outline" text={user?.email || "Worker account"} />
        <InfoRow icon="hard-hat" text={project ? `Worker · ${project.name}` : "Worker · No active assignment"} />
        <InfoRow icon="shield-check-outline" text="Location used for attendance verification" />
      </View>
      <View style={styles.preferenceCard}>
        <InfoRow icon="bell-cog-outline" text="Notification preferences" />
        <InfoRow icon="help-circle-outline" text="Help and support" />
        <Pressable onPress={onLogout} style={styles.logoutButton}><MaterialCommunityIcons name="logout" size={17} color={C.red} /><Text style={styles.logoutText}>Sign out</Text></Pressable>
      </View>
    </>;
}
