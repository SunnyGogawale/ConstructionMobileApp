import { Platform, StyleSheet } from "react-native";
import { C } from "./theme.js";
export const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  loginScreen: {
    flex: 1,
    backgroundColor: C.canvas
  },
  loginWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30
  },
  loginBrand: {
    alignItems: "center",
    marginBottom: 23
  },
  loginBrandName: {
    marginTop: 9,
    color: C.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  loginBrandCaption: {
    marginTop: 2,
    color: C.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1
  },
  loginPanel: {
    padding: 17,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 11,
    backgroundColor: C.white
  },
  loginTitle: {
    marginTop: 6,
    color: C.ink,
    fontSize: 22,
    fontWeight: "800"
  },
  loginLabel: {
    marginTop: 18,
    marginBottom: 6,
    color: C.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  loginInput: {
    height: 43,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    color: C.ink,
    backgroundColor: C.white,
    fontSize: 10
  },
  loginError: {
    marginTop: 10,
    color: C.red,
    fontSize: 9
  },
  apiNotice: {
    marginTop: 10,
    padding: 9,
    borderRadius: 5,
    color: C.amber,
    backgroundColor: C.amberLight,
    fontSize: 8,
    lineHeight: 13
  },
  forgotAction: {
    alignSelf: "center",
    paddingVertical: 12
  },
  loginFooter: {
    alignSelf: "center",
    marginTop: 17,
    color: C.muted,
    fontSize: 8
  },
  screen: {
    flex: 1,
    backgroundColor: C.canvas
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 28
  },
  topBar: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center"
  },
  brandText: {
    marginLeft: 9,
    flex: 1
  },
  brandName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.ink
  },
  brandLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: C.muted,
    marginTop: 1
  },
  topBell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
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
    borderColor: C.white
  },
  bottomTabs: {
    height: 66,
    flexDirection: "row",
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 3,
    paddingBottom: Platform.OS === "ios" ? 7 : 2
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  tabIcon: {
    width: 34,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  tabIconActive: {
    backgroundColor: C.orangeLight
  },
  tabLabel: {
    fontSize: 8,
    color: C.muted,
    fontWeight: "600"
  },
  tabLabelActive: {
    color: C.orange,
    fontWeight: "800"
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: C.orange
  },
  greeting: {
    fontSize: 21,
    fontWeight: "800",
    color: C.ink,
    marginTop: 5
  },
  bodyCopy: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
    lineHeight: 16
  },
  initialAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center"
  },
  initialAvatarText: {
    color: C.white
  },
  projectHero: {
    height: 252,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: C.navy,
    marginBottom: 11
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#102a35c7"
  },
  heroCopy: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16
  },
  heroEyebrow: {
    color: "#f6b17e",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.white,
    marginTop: 7
  },
  heroSubtitle: {
    color: "#d1dddf",
    fontSize: 11,
    marginTop: 3
  },
  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10
  },
  heroLocationText: {
    color: "#ecf0ef",
    fontSize: 9
  },
  heroMeta: {
    flexDirection: "row",
    gap: 40,
    paddingTop: 11,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: "#ffffff38"
  },
  heroMetaValue: {
    color: C.white,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4
  },
  shiftCard: {
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white
  },
  shiftHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink
  },
  mutedText: {
    fontSize: 9,
    color: C.muted,
    marginTop: 3
  },
  shiftFacts: {
    gap: 9,
    paddingVertical: 12,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line
  },
  checkOutButton: {
    height: 40,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#efc6a8",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  checkOutText: {
    color: C.orange,
    fontSize: 9,
    fontWeight: "800"
  },
  breakTimer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 4,
    borderRadius: 7,
    backgroundColor: C.amberLight
  },
  breakCaption: {
    color: C.amber,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  breakValue: {
    marginTop: 3,
    color: C.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  breakRemaining: {
    marginTop: 3,
    color: C.amber,
    fontSize: 14,
    fontWeight: "800"
  },
  breakLimit: {
    color: C.muted,
    fontSize: 7
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  infoText: {
    flex: 1,
    fontSize: 9,
    color: "#647376",
    lineHeight: 14
  },
  primaryButton: {
    height: 45,
    borderRadius: 8,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 9
  },
  primaryButtonText: {
    flex: 1,
    marginLeft: 8,
    color: C.white,
    fontSize: 11,
    fontWeight: "800"
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    color: C.muted,
    fontSize: 8
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 9
  },
  orangeText: {
    fontSize: 9,
    color: C.orange,
    fontWeight: "800"
  },
  taskCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.orangeLight
  },
  taskCopy: {
    flex: 1
  },
  taskTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334348"
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#eff2f1"
  },
  badgeGreen: {
    backgroundColor: C.greenLight
  },
  badgeAmber: {
    backgroundColor: C.amberLight
  },
  badgeRed: {
    backgroundColor: "#fbedeb"
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#83908f"
  },
  dotGreen: {
    backgroundColor: C.green
  },
  dotAmber: {
    backgroundColor: C.amber
  },
  dotRed: {
    backgroundColor: C.red
  },
  badgeText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#647174"
  },
  textGreen: {
    color: C.green
  },
  textAmber: {
    color: C.amber
  },
  textRed: {
    color: C.red
  },
  progressCaption: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 5
  },
  progressCaptionText: {
    fontSize: 8,
    color: C.muted
  },
  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "#edf1ee",
    overflow: "hidden"
  },
  progressFill: {
    width: "62%",
    height: "100%",
    borderRadius: 5,
    backgroundColor: C.green
  },
  linkAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    marginTop: 11,
    borderTopWidth: 1,
    borderColor: C.line
  },
  linkActionText: {
    flex: 1,
    fontSize: 9,
    color: C.orange,
    fontWeight: "700"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 7,
    marginTop: 9
  },
  statCard: {
    flex: 1,
    minHeight: 81,
    padding: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white
  },
  statIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  statGreen: {
    backgroundColor: C.greenLight
  },
  statOrange: {
    backgroundColor: C.orangeLight
  },
  statAmber: {
    backgroundColor: C.amberLight
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: C.ink
  },
  statLabel: {
    fontSize: 7,
    color: C.muted,
    marginTop: 3
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white
  },
  activityMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.greenLight
  },
  pageHeader: {
    marginBottom: 17
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: C.muted,
    marginBottom: 8
  },
  assignmentCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  subtaskSection: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: C.line
  },
  subtaskSectionTitle: {
    marginBottom: 8,
    color: C.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  subtaskItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: C.line
  },
  subtaskItemCopy: {
    marginBottom: 8
  },
  subtaskItemTitle: {
    color: C.ink,
    fontSize: 10,
    fontWeight: "700"
  },
  subtaskStatusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  subtaskStatusButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 5
  },
  subtaskStatusSelected: {
    borderColor: C.green,
    backgroundColor: C.greenLight
  },
  subtaskStatusText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: "700"
  },
  subtaskStatusTextSelected: {
    color: C.green
  },
  assignmentIcon: {
    width: 37,
    height: 37,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.orangeLight,
    marginBottom: 9
  },
  inlineActions: {
    flexDirection: "row",
    gap: 17,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: C.line
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  inlineActionText: {
    fontSize: 9,
    color: C.orange,
    fontWeight: "700"
  },
  opportunityCard: {
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  opportunityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 3
  },
  projectDescription: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 14,
    marginTop: 8
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
    alignItems: "center"
  },
  mapBlocks: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    transform: [{
      rotate: "-12deg"
    }]
  },
  mapBlocksBlock: {},
  mapRadius: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#e8752480",
    backgroundColor: "#e8752418"
  },
  mapPin: {
    width: 41,
    height: 41,
    borderRadius: 22,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#efc6a9"
  },
  mapLabel: {
    position: "absolute",
    top: 13,
    left: 13,
    padding: 8,
    borderRadius: 6,
    backgroundColor: C.white
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
    backgroundColor: C.white
  },
  mapAccuracyText: {
    fontSize: 8,
    color: C.muted
  },
  verificationCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 8
  },
  stateIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  errorCopy: {
    fontSize: 9,
    color: C.red,
    marginTop: 9,
    lineHeight: 14
  },
  todayRecord: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.line
  },
  secondaryAction: {
    alignSelf: "flex-start",
    marginTop: 8
  },
  formCard: {
    padding: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white
  },
  formLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: C.muted,
    marginBottom: 6
  },
  fieldStatic: {
    fontSize: 10,
    color: C.ink,
    marginBottom: 14
  },
  textField: {
    minHeight: 39,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    color: C.ink,
    fontSize: 10,
    backgroundColor: "#fff"
  },
  multiline: {
    minHeight: 82,
    paddingTop: 9,
    textAlignVertical: "top"
  },
  formRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13
  },
  formHalf: {
    flex: 1
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 5
  },
  photoThumb: {
    width: 61,
    height: 61,
    borderRadius: 6
  },
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
    backgroundColor: "#fffaf6"
  },
  addPhotoText: {
    fontSize: 7,
    color: C.orange,
    fontWeight: "700"
  },
  notificationList: {
    gap: 8
  },
  notificationItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white
  },
  notificationIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f3f1"
  },
  notificationUnread: {
    backgroundColor: C.orangeLight
  },
  profileCard: {
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  profileAvatar: {
    width: 57,
    height: 57,
    borderRadius: 30,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.white
  },
  profileName: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
    marginTop: 9
  },
  profileDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: C.line,
    marginVertical: 13
  },
  preferenceCard: {
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.white
  },
  logoutButton: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderColor: C.line,
    marginTop: 9
  },
  logoutText: {
    color: C.red,
    fontSize: 9,
    fontWeight: "700"
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000"
  },
  camera: {
    flex: 1,
    justifyContent: "space-between"
  },
  cameraTop: {
    alignItems: "center",
    paddingTop: 16
  },
  cameraClose: {
    position: "absolute",
    top: 10,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff26"
  },
  cameraTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.white
  },
  cameraCaption: {
    fontSize: 10,
    color: "#d8e0e0",
    marginTop: 3
  },
  faceFrame: {
    alignSelf: "center",
    width: 230,
    height: 300,
    borderWidth: 2,
    borderColor: "#ffffffa6",
    borderRadius: 120
  },
  cameraBottom: {
    alignItems: "center",
    paddingBottom: 32
  },
  gpsCameraPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: "#10252dbb"
  },
  gpsCameraPillText: {
    fontSize: 9,
    color: C.white
  },
  captureButton: {
    width: 68,
    height: 68,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center"
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 27,
    backgroundColor: C.white
  },
  confirmHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.ink
  },
  confirmContent: {
    padding: 16
  },
  selfiePreview: {
    width: 130,
    height: 150,
    alignSelf: "center",
    borderRadius: 9,
    marginVertical: 13,
    backgroundColor: "#e6eae8"
  },
  confirmCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
    marginVertical: 12
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 37,
    borderBottomWidth: 1,
    borderColor: "#edf0ee"
  },
  confirmLabel: {
    width: 82,
    fontSize: 8,
    color: C.muted
  },
  confirmValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: "700",
    color: C.ink
  },
  securityNoteText: {
    fontSize: 8,
    color: C.muted,
    lineHeight: 12
  },
  detailHero: {
    padding: 15,
    marginBottom: 13,
    borderRadius: 9,
    backgroundColor: C.navy
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.white,
    marginTop: 10
  },
  detailBody: {
    fontSize: 10,
    color: "#d3dedf",
    lineHeight: 15,
    marginTop: 6
  },
  infoSection: {
    padding: 13,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white
  }
});
