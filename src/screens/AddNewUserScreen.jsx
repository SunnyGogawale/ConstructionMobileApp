import React, {useState} from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const ROLES = ['Project Manager', 'Worker', 'Admin'];

function AddNewUserScreen({onBack}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [activate, setActivate] = useState(true);

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('');
    setRoleOpen(false);
    setActivate(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backBtn}>
          {/* // <FontAwesome6 name="chevron-left" style={styles.backIcon} /> */}
          <Text style={styles.backLabel}>Directory</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Add New User</Text>

        <Pressable accessibilityRole="button" onPress={handleReset}>
          <Text style={styles.resetLabel}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">

        {/* Avatar upload */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {/* // <FontAwesome6 name="camera" style={styles.cameraIcon} /> */}
          </View>
          <Text style={styles.uploadLabel}>Upload Profile Photo</Text>
        </View>

        {/* Full Operational Name */}
        <Text style={styles.fieldLabel}>Full Operational Name</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Alice Vance"
            placeholderTextColor="#b0bcd4"
            autoCapitalize="words"
          />
        </View>

        {/* Corporate Email */}
        <Text style={styles.fieldLabel}>Corporate Email</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="alice@buildflow.com"
            placeholderTextColor="#b0bcd4"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Primary Phone Field */}
        <Text style={styles.fieldLabel}>Primary Phone Field</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 434-2190"
            placeholderTextColor="#b0bcd4"
            keyboardType="phone-pad"
          />
        </View>

        {/* Assigned Access Role */}
        <Text style={styles.fieldLabel}>Assigned Access Role</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.inputShell}
          onPress={() => setRoleOpen(o => !o)}>
          <Text style={[styles.textInput, !role && styles.placeholder]}>
            {role || 'Project Manager'}
          </Text>
          {/* // <FontAwesome6 name="chevron-down" style={styles.dropdownIcon} /> */}
        </Pressable>

        {roleOpen && (
          <View style={styles.dropdown}>
            {ROLES.map(r => (
              <Pressable
                key={r}
                accessibilityRole="button"
                onPress={() => {
                  setRole(r);
                  setRoleOpen(false);
                }}
                style={[
                  styles.dropdownItem,
                  role === r && styles.dropdownItemActive,
                ]}>
                <Text
                  style={[
                    styles.dropdownItemText,
                    role === r && styles.dropdownItemTextActive,
                  ]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Activate Account toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleTitle}>Activate Account</Text>
            <Text style={styles.toggleSubtitle}>Enable immediate system auth</Text>
          </View>
          <Switch
            value={activate}
            onValueChange={setActivate}
            trackColor={{false: '#d0daf0', true: '#2d6cdf'}}
            thumbColor="#ffffff"
          />
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save User</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4ecf7',
    backgroundColor: '#f7f9ff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    color: '#2d6cdf',
    fontSize: fs(13),
  },
  backLabel: {
    color: '#2d6cdf',
    fontSize: fs(14),
    fontWeight: '600',
  },
  headerTitle: {
    color: '#142038',
    fontSize: fs(17),
    fontWeight: '800',
  },
  resetLabel: {
    color: '#8394b1',
    fontSize: fs(14),
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef1f7',
    borderWidth: 1.5,
    borderColor: '#d0daf0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cameraIcon: {
    color: '#8394b1',
    fontSize: fs(26),
  },
  uploadLabel: {
    color: '#2d6cdf',
    fontSize: fs(13),
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 16,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    color: '#142038',
    fontSize: fs(14),
    paddingVertical: 0,
  },
  placeholder: {
    color: '#b0bcd4',
  },
  dropdownIcon: {
    color: '#6b7fa3',
    fontSize: fs(13),
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f7',
  },
  dropdownItemActive: {
    backgroundColor: '#eef3ff',
  },
  dropdownItemText: {
    color: '#3d5275',
    fontSize: fs(14),
  },
  dropdownItemTextActive: {
    color: '#2d6cdf',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  toggleTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    color: '#142038',
    fontSize: fs(14),
    fontWeight: '700',
    lineHeight: fs(18),
  },
  toggleSubtitle: {
    color: '#6b7fa3',
    fontSize: fs(12),
    lineHeight: fs(16),
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d0daf0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#3d5275',
    fontSize: fs(15),
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2d6cdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: fs(15),
    fontWeight: '700',
  },
});

export default AddNewUserScreen;
