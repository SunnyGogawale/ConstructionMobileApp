import React, {useState} from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

function AddNewProjectScreen({onBack}) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleReset = () => {
    setProjectName('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setAddress('');
    setDescription('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">

        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Create New Campaign</Text>
          <Text style={styles.pageSubtitle}>Fill in construction specifications</Text>
        </View>

        {/* Project Name */}
        <Text style={styles.fieldLabel}>Project Name</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Skyline Annex Project"
            placeholderTextColor="#b0bcd4"
            autoCapitalize="words"
          />
        </View>

        {/* Client Name */}
        <Text style={styles.fieldLabel}>Client Name</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Enter client name"
            placeholderTextColor="#b0bcd4"
            autoCapitalize="words"
          />
        </View>

        {/* Client Phone + Client Email (side by side) */}
        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Client Phone</Text>
            <View style={styles.inputShell}>
              <TextInput
                style={styles.textInput}
                value={clientPhone}
                onChangeText={setClientPhone}
                placeholder="Phone number"
                placeholderTextColor="#b0bcd4"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Client Email</Text>
            <View style={styles.inputShell}>
              <TextInput
                style={styles.textInput}
                value={clientEmail}
                onChangeText={setClientEmail}
                placeholder="Email address"
                placeholderTextColor="#b0bcd4"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Project Address */}
        <Text style={styles.fieldLabel}>Project Address</Text>
        <View style={styles.inputShell}>
          {/* // <FontAwesome6 name="location-dot" style={styles.addressIcon} /> */}
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="742 Pine St, San Francisco"
            placeholderTextColor="#b0bcd4"
            autoCapitalize="words"
          />
        </View>

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <View style={[styles.inputShell, styles.textAreaShell]}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Excavation and foundation mapping for multi-family auxiliary building."
            placeholderTextColor="#b0bcd4"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Start Date + End Date (side by side) */}
        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <View style={styles.inputShell}>
              {/* // <FontAwesome6 name="calendar" style={styles.calendarIcon} /> */}
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-11-01"
                placeholderTextColor="#b0bcd4"
              />
            </View>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>End Date</Text>
            <View style={styles.inputShell}>
              {/* // <FontAwesome6 name="calendar" style={styles.calendarIcon} /> */}
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="Select date"
                placeholderTextColor="#b0bcd4"
              />
            </View>
          </View>
        </View>

        {/* Pick Location on Map */}
        <Pressable accessibilityRole="button" style={styles.mapBtn}>
          {/* // <FontAwesome6 name="map" style={styles.mapIcon} /> */}
          <Text style={styles.mapBtnText}>Pick Location on Map</Text>
        </Pressable>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <Pressable accessibilityRole="button" style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Project</Text>
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  pageHeader: {
    marginBottom: 10,
  },
  pageTitle: {
    color: '#142038',
    fontSize: fs(22),
    fontWeight: '800',
    lineHeight: fs(28),
  },
  pageSubtitle: {
    marginTop: 3,
    color: '#6b7fa3',
    fontSize: fs(13),
    lineHeight: fs(18),
  },
  fieldLabel: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 10,
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
  textAreaShell: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    color: '#142038',
    fontSize: fs(14),
    paddingVertical: 0,
  },
  textArea: {
    height: 76,
  },
  addressIcon: {
    color: '#2d6cdf',
    fontSize: fs(15),
    marginRight: 8,
  },
  calendarIcon: {
    color: '#6b7fa3',
    fontSize: fs(14),
    marginRight: 8,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8d5ec',
    backgroundColor: '#ffffff',
  },
  mapIcon: {
    color: '#2d6cdf',
    fontSize: fs(15),
  },
  mapBtnText: {
    color: '#2d6cdf',
    fontSize: fs(14),
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#e8ecf4',
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

export default AddNewProjectScreen;
