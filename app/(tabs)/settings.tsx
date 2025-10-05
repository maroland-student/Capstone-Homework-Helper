import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

export default function SettingsScreen() {
  // this is initial state, you can load these from async storage or a backend later
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // link logout stuff here later
          console.log('User logged out');
        }}
      ]
    );
  };

  const SettingsItem = ({ 
    // the props for each settings item
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    showArrow = true 
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: borderColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemContent}>
        <View style={styles.settingsItemText}>
          <ThemedText style={styles.settingsItemTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingsItemSubtitle}>{subtitle}</ThemedText>
          )}
        </View>
        <View style={styles.settingsItemRight}>
          {rightElement}
          {showArrow && onPress && (
            <ThemedText style={styles.arrow}>›</ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {}
        <SectionHeader title="Profile" />
        <SettingsItem
        // profile section
        // this can be expanded with user info later with backend integration with auth permissions
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => console.log('Edit Profile pressed')}
        />
        <SettingsItem
        // this can link to a change password screen later through notif with email from database
          title="Change Password"
          subtitle="Update your account security"
          onPress={() => console.log('Change Password pressed')}
        />
        
        {}
        <SectionHeader title="App Preferences" />
        <SettingsItem
        // app preferences section
        // this can link to backend to save user preferences later to send notif based off true toggle
          title="Notifications"
          subtitle="Push notifications and alerts"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
        <SettingsItem
          title="Dark Mode"
          subtitle="Switch between light and dark themes"
          rightElement={
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkModeEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          }
          showArrow={false}
        />

        {}
        <SectionHeader title="Privacy & Security" />
        <SettingsItem
        // privacy and security section
        // this can link to location services permissions later with backend integration
        // unsure if we need location services for this app, however it is a common setting
        // unsure if we need location services for this app, however it is a common setting
        // we can remove this if not needed
          title="Location Services"
          subtitle="Allow app to access your location"
          rightElement={
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={locationEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
        <SettingsItem
        // common setting to link to privacy policy page later
        // this can open a webview or external link to the policy
          title="Privacy Policy"
          subtitle="View our privacy policy"
          onPress={() => console.log('Privacy Policy pressed')}
        />
        <SettingsItem
        // again common setting to link to terms of service page later
        // this can open a webview or external link to the policy
          title="Terms of Service"
          subtitle="View terms and conditions"
          onPress={() => console.log('Terms of Service pressed')}
        />

        {}
        <SectionHeader title="Support" />
        <SettingsItem
        // support section
        // again common support settings to link to help pages or contact support
        // these can open webviews or external links to the support pages
          title="Help & FAQ"
          subtitle="Get help and answers"
          onPress={() => console.log('Help & FAQ pressed')}
        />
        <SettingsItem
        // this can link to an email support or contact form later
          title="Contact Us"
          subtitle="Get in touch with support"
          onPress={() => console.log('Contact Us pressed')}
        />
        <SettingsItem
        // this can link to a bug report form or email later
          title="Report a Bug"
          subtitle="Report issues or bugs"
          onPress={() => console.log('Report a Bug pressed')}
        />

        {}
        <SectionHeader title="About" />
        <SettingsItem
        // about section
        // about can include app version, rate us, and other info
        // rate us can link to app store or play store later
        // other info can be added as needed, or just a link to website, app store blurb to company
          title="App Version"
          subtitle="1.0.0"
          rightElement={null}
          showArrow={false}
        />
        <SettingsItem
        // this can link to app store rating page later
          title="Rate the App"
          subtitle="Rate us on the app store"
          onPress={() => {
            // Handle app store rating
            console.log('Rate app pressed');
          }}
        />

        {}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
          // account section
          // logout button to sign out user, this can be linked to auth backend later
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // basic styles for the settings screen
  // can be customized further as needed
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 24,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  settingsItem: {
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    opacity: 0.4,
    marginLeft: 8,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 40,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
