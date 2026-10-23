import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { PageHeader } from "../components/UI.jsx";
export function ProgressScreen({
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
  busy
}) {
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <PageHeader title="Daily progress" subtitle="Record completed work for your site manager." />
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>PROJECT</Text>
        <Text style={styles.taskTitle}>{project?.name || "No assigned project"}</Text>
        <Text style={[styles.formLabel, {
        marginTop: 17
      }]}>WORK DATE</Text>
        <Text style={styles.fieldStatic}>
          {new Date().toLocaleDateString()}
        </Text>
        <Text style={styles.formLabel}>WORK DESCRIPTION</Text>
        <TextInput value={text} onChangeText={setText} multiline placeholder="Describe the work completed today…" placeholderTextColor="#a3aeac" style={[styles.textField, styles.multiline]} />
        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>PROGRESS %</Text>
            <TextInput value={percent} onChangeText={value => setPercent(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={3} style={styles.textField} />
          </View>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>REMARKS</Text>
            <TextInput value={remarks} onChangeText={setRemarks} placeholder="Optional" style={styles.textField} />
          </View>
        </View>
        <Text style={styles.formLabel}>WORK PHOTOS</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{
          uri
        }} style={styles.photoThumb} />)}
          <Pressable onPress={onPick} style={styles.addPhoto}>
            <MaterialCommunityIcons name="image-plus-outline" size={22} color={C.orange} />
            <Text>Add photos</Text>
          </Pressable>
        </View>
        <Pressable disabled={busy} onPress={onSubmit} style={styles.primaryButton}>
          <MaterialCommunityIcons name="send-outline" size={17} color={C.white} />
          <Text style={styles.primaryButtonText}>
            {busy ? "Submitting…" : "Submit progress update"}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={17} color={C.white} />
        </Pressable>
        <Text style={styles.securityNote}>
          Photos are uploaded before the progress record is saved to the project API.
        </Text>
      </View>
    </KeyboardAvoidingView>;
}
