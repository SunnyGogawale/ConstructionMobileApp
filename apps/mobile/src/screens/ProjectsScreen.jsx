import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { PageHeader, InfoRow } from "../components/UI.jsx";
export function ProjectsScreen({
  projects = [],
  currentProject,
  subtasks = [],
  updatingSubtask,
  onUpdateSubtask,
  onDetails,
  onProgress
}) {
  return <>
      <PageHeader title="My projects" subtitle="Your assignment and nearby work." />
      <View style={styles.sectionLabel}>CURRENT ASSIGNMENT</View>
      {currentProject ? <View style={styles.assignmentCard}>
        <View style={styles.assignmentIcon}>
          <MaterialCommunityIcons name="office-building-outline" size={21} color={C.orange} />
        </View>
        <Text style={styles.taskTitle}>{currentProject.name}</Text>
        <Text style={styles.mutedText}>{currentProject.status || "Assigned"}</Text>
        <InfoRow icon="map-marker-outline" text={currentProject.address || "Project location"} />
        <InfoRow icon="calendar-range-outline" text={currentProject.dates || "Schedule available in project details"} />
        <View style={styles.inlineActions}>
          <Pressable onPress={onProgress}>
            <MaterialCommunityIcons name="chart-box-outline" size={15} color={C.orange} />
            <Text>Work updates</Text>
          </Pressable>
          <Pressable onPress={onProgress}>
            <MaterialCommunityIcons name="camera-outline" size={15} color={C.orange} />
            <Text>Photos</Text>
          </Pressable>
        </View>
        <View style={styles.subtaskSection}>
          <Text style={styles.subtaskSectionTitle}>Assigned subtasks</Text>
          {subtasks.length ? subtasks.map(subtask => <View key={subtask._id} style={styles.subtaskItem}>
              <View style={styles.subtaskItemCopy}>
                <Text style={styles.subtaskItemTitle}>{subtask.title}</Text>
                <Text style={styles.mutedText}>{subtask.description || "No description"} · {new Date(subtask.startDate).toLocaleDateString()} – {new Date(subtask.dueDate).toLocaleDateString()}</Text>
              </View>
              <View style={styles.subtaskStatusActions}>
                {["Pending", "In Progress", "Completed"].map(status => <Pressable key={status} accessibilityRole="button" accessibilityState={{
              selected: subtask.status === status,
              disabled: updatingSubtask === subtask._id
            }} disabled={Boolean(updatingSubtask)} onPress={() => onUpdateSubtask(subtask, status)} style={[styles.subtaskStatusButton, subtask.status === status && styles.subtaskStatusSelected]}>
                    <Text style={[styles.subtaskStatusText, subtask.status === status && styles.subtaskStatusTextSelected]}>{status}</Text>
                  </Pressable>)}
              </View>
            </View>) : <Text style={styles.mutedText}>No subtasks assigned yet.</Text>}
        </View>
      </View> : <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No current assignment</Text><Text style={styles.mutedText}>Browse available work below.</Text></View>}
      <View style={styles.sectionHeading}>
        <Text style={styles.cardTitle}>Available nearby</Text>
        <Text style={styles.sectionLabel}>{projects.length} OPEN</Text>
      </View>
      {projects.map(project => <Pressable key={project.id} style={styles.opportunityCard} onPress={() => onDetails(project)}>
          <View style={styles.opportunityTop}>
            <View style={styles.assignmentIcon}>
              <MaterialCommunityIcons name="crane" size={20} color={C.orange} />
            </View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{project.name}</Text>
              <Text style={styles.mutedText}>{project.trade}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.muted} />
          </View>
          <InfoRow icon="map-marker-outline" text={`${project.address || "Site location"} · ${project.distance}`} />
          <InfoRow icon="calendar-outline" text={project.dates} />
          <Text style={styles.projectDescription}>{project.description}</Text>
          <Text style={styles.orangeText}>
            View details and accept{" "}
            <MaterialCommunityIcons name="arrow-right" size={14} />
          </Text>
        </Pressable>)}
      {projects.length === 0 && <View style={styles.assignmentCard}><Text style={styles.taskTitle}>No available projects</Text><Text style={styles.mutedText}>New eligible work will appear here.</Text></View>}
    </>;
}
