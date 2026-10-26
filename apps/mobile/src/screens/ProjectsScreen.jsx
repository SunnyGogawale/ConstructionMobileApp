import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { InfoRow, PageHeader } from "../components/UI.jsx";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
}

export function ProjectsScreen({
  tasks = [],
  updatingSubtask,
  onTaskAction
}) {
  return <>
    <PageHeader title="My assigned tasks" subtitle="Only subtasks assigned to your account." />
    <View style={styles.sectionHeading}>
      <Text style={styles.cardTitle}>Assigned tasks</Text>
      <Text style={styles.sectionLabel}>{tasks.length} TASKS</Text>
    </View>
    {tasks.map(task => <View key={task._id} style={styles.opportunityCard}>
      <View style={styles.opportunityTop}>
        <View style={styles.assignmentIcon}>
          <MaterialCommunityIcons name="office-building-outline" size={20} color={C.orange} />
        </View>
        <View style={styles.taskCopy}>
          <Text style={styles.mutedText}>{task.projectName}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>
      </View>
      <Text style={styles.projectDescription}>{task.description || "No task description provided."}</Text>
      <InfoRow icon="calendar-plus-outline" text={`Assigned: ${formatDate(task.createdAt || task.startDate)}`} />
      <InfoRow icon="progress-check" text={`Status: ${task.status}`} />
      <InfoRow icon="calendar-clock-outline" text={`Due: ${formatDate(task.dueDate)}`} />
      {task.status === "In Progress" && <Pressable
        accessibilityRole="button"
        disabled={Boolean(updatingSubtask)}
        onPress={() => onTaskAction(task, "Completed")}
        style={[styles.primaryButton, Boolean(updatingSubtask) && { opacity: 0.6 }]}
      >
        <Text style={styles.primaryButtonText}>
          {updatingSubtask === task._id ? "Submitting…" : "Complete task"}
        </Text>
        <MaterialCommunityIcons name="check" size={19} color={C.white} />
      </Pressable>}
    </View>)}
    {tasks.length === 0 && <View style={styles.assignmentCard}>
      <Text style={styles.taskTitle}>No assigned tasks</Text>
      <Text style={styles.mutedText}>Tasks assigned to your account will appear here.</Text>
    </View>}
  </>;
}
