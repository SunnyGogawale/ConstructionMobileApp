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
  projects = [],
  attendance,
  updatingSubtask,
  onTaskAction,
  onProjectCheckIn,
  onProjectCheckOut,
  onProjectProgress
}) {
  const activeProjectId = attendance?.project?._id || attendance?.project;
  return <>
    <PageHeader title="My assigned tasks" subtitle="Only subtasks assigned to your account." />
    <View style={styles.sectionHeading}>
      <Text style={styles.cardTitle}>Project work sessions</Text>
      <Text style={styles.sectionLabel}>{projects.length} PROJECTS</Text>
    </View>
    {projects.map(project => {
      const isActiveProject = ["active", "on_break"].includes(attendance?.status) && String(activeProjectId) === String(project.id);
      return <View key={`session-${project.id}`} style={styles.opportunityCard}>
        <View style={styles.opportunityTop}>
          <View style={styles.assignmentIcon}>
            <MaterialCommunityIcons name="clock-check-outline" size={19} color={C.green} />
          </View>
          <View style={styles.taskCopy}>
            <Text style={styles.taskTitle}>{project.name}</Text>
            <Text style={styles.mutedText}>{isActiveProject ? `Session ${attendance.status} · ${new Date(attendance.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Verified project work session"}</Text>
          </View>
        </View>
        {isActiveProject ? <View style={{ gap: 8, marginTop: 8 }}>
          <Pressable onPress={() => onProjectProgress(project)} style={[styles.secondaryAction, { paddingVertical: 8 }]}>
            <Text style={styles.inlineActionText}>Daily Progress</Text>
          </Pressable>
          <Pressable onPress={() => onProjectCheckOut(project)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Check-Out</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
          </Pressable>
        </View> : ["active", "on_break"].includes(attendance?.status) ? <Text style={styles.mutedText}>Check out of your current project before starting this session.</Text> : <Pressable onPress={() => onProjectCheckIn(project)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Check-In</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
        </Pressable>}
      </View>;
    })}
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
      {task.status !== "Completed" && <Pressable
        accessibilityRole="button"
        disabled={Boolean(updatingSubtask)}
        onPress={() => onTaskAction(task, task.status === "Pending" ? "In Progress" : "Completed")}
        style={[styles.primaryButton, Boolean(updatingSubtask) && { opacity: 0.6 }]}
      >
        <Text style={styles.primaryButtonText}>
          {updatingSubtask === task._id ? "Submitting…" : task.status === "Pending" ? "Start task" : "Complete task"}
        </Text>
        <MaterialCommunityIcons name={task.status === "Pending" ? "play" : "check"} size={19} color={C.white} />
      </Pressable>}
    </View>)}
    {tasks.length === 0 && <View style={styles.assignmentCard}>
      <Text style={styles.taskTitle}>No assigned tasks</Text>
      <Text style={styles.mutedText}>Tasks assigned to your account will appear here.</Text>
    </View>}
  </>;
}
