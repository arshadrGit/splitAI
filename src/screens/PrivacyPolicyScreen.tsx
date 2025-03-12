import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Header } from '../components/Header';

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Privacy Policy"
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <ThemeText variant="title" style={styles.sectionTitle}>
          Introduction
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          Welcome to SplitEase's Privacy Policy. This policy explains how we collect, use, and protect your personal information when you use our app.
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          Information We Collect
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          • Personal Information: Email, name, and profile picture{'\n'}
          • Usage Data: App interactions and features used{'\n'}
          • Financial Information: Expense records and group payment information
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          How We Use Your Information
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          • To provide and maintain our service{'\n'}
          • To notify you about changes to our app{'\n'}
          • To allow you to participate in interactive features{'\n'}
          • To provide customer support{'\n'}
          • To gather analysis or valuable information to improve our service
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          Data Security
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          We implement appropriate security measures to protect your personal information. Your data is stored securely and is only accessible to authorized users.
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          Third-Party Services
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          We may employ third-party companies and individuals to facilitate our service, provide service-related services, or assist us in analyzing how our service is used.
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          Changes to This Policy
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </ThemeText>

        <ThemeText variant="title" style={styles.sectionTitle}>
          Contact Us
        </ThemeText>
        <ThemeText style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at support@splitease.com
        </ThemeText>

        <ThemeText style={[styles.lastUpdated, { color: theme.colors.placeholder }]}>
          Last Updated: March 2024
        </ThemeText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.8,
  },
  lastUpdated: {
    marginTop: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen; 