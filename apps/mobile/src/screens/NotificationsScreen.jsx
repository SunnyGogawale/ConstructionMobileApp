import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { PageHeader } from "../components/UI.jsx";
export function NotificationsScreen({
  notifications = [],
  onMarkRead
}) {
  return <>
      <PageHeader title="Notifications" subtitle="Project, attendance, and crew updates." />
      <View style={styles.notificationList}>
        {notifications.map(notification => {
        const unread = !notification.readAt;
        const icon = notification.category === "attendance" ? "calendar-clock-outline" : notification.category === "finance" ? "cash-check" : notification.category === "progress" ? "clipboard-check-outline" : "bell-outline";
        const detail = [notification.project?.name, notification.message, notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""].filter(Boolean).join(" · ");
        return <Pressable key={notification._id} onPress={() => unread && onMarkRead?.(notification)} style={styles.notificationItem}>
            <View style={[styles.notificationIcon, unread && styles.notificationUnread]}>
              <MaterialCommunityIcons name={icon} size={19} color={unread ? C.orange : C.muted} />
            </View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{notification.title}</Text>
              <Text style={styles.mutedText}>{detail}</Text>
            </View>
            {unread && <View style={styles.unreadDot} />}
          </Pressable>;
      })}
        {notifications.length === 0 && <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No notifications</Text><Text style={styles.mutedText}>Updates for your assigned work will appear here.</Text></View>}
      </View>
    </>;
}
