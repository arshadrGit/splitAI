import React from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AboutScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const appVersion = '1.0.0'; // This should be dynamically fetched from your app config

  const socialLinks = [
    {
      title: 'Website',
      icon: 'web',
      url: 'https://splitease.com'
    },
    {
      title: 'Twitter',
      icon: 'twitter',
      url: 'https://twitter.com/splitease'
    },
    {
      title: 'GitHub',
      icon: 'github',
      url: 'https://github.com/splitease'
    }
  ];

  const renderSocialLink = ({ title, icon, url }: any) => (
    <TouchableOpacity
      key={title}
      style={styles.socialButton}
      onPress={() => Linking.openURL(url)}
    >
      <View style={[styles.socialIcon, { backgroundColor: theme.colors.primary }]}>
        <Icon name={icon} size={24} color="#FFFFFF" />
      </View>
      <ThemeText style={styles.socialText}>{title}</ThemeText>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="About"
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemeText variant="title" style={styles.appName}>
            SplitEase
          </ThemeText>
          <ThemeText style={styles.version}>
            Version {appVersion}
          </ThemeText>
        </View>

        <Card style={styles.section}>
          <ThemeText variant="title" style={styles.sectionTitle}>
            About SplitEase
          </ThemeText>
          <ThemeText style={styles.description}>
            SplitEase is a modern expense sharing app designed to make splitting bills and managing shared expenses effortless. Whether you're traveling with friends, living with roommates, or organizing group events, SplitEase helps you keep track of who owes what and simplifies the settlement process.
          </ThemeText>
        </Card>

        <Card style={styles.section}>
          <ThemeText variant="title" style={styles.sectionTitle}>
            Features
          </ThemeText>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Icon name="account-group" size={24} color={theme.colors.primary} />
              <ThemeText style={styles.featureText}>
                Create and manage expense groups
              </ThemeText>
            </View>
            <View style={styles.featureItem}>
              <Icon name="calculator" size={24} color={theme.colors.primary} />
              <ThemeText style={styles.featureText}>
                Smart balance calculation
              </ThemeText>
            </View>
            <View style={styles.featureItem}>
              <Icon name="cash-multiple" size={24} color={theme.colors.primary} />
              <ThemeText style={styles.featureText}>
                Easy expense splitting
              </ThemeText>
            </View>
            <View style={styles.featureItem}>
              <Icon name="history" size={24} color={theme.colors.primary} />
              <ThemeText style={styles.featureText}>
                Transaction history tracking
              </ThemeText>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemeText variant="title" style={styles.sectionTitle}>
            Connect With Us
          </ThemeText>
          <View style={styles.socialLinks}>
            {socialLinks.map(renderSocialLink)}
          </View>
        </Card>

        <ThemeText style={styles.copyright}>
          © 2024 SplitEase. All rights reserved.
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    lineHeight: 22,
    opacity: 0.8,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  socialButton: {
    alignItems: 'center',
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialText: {
    fontSize: 12,
  },
  copyright: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
});

export default AboutScreen; 