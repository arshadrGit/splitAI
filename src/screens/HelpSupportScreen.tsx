import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FAQ {
  question: string;
  answer: string;
}

export const HelpSupportScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      question: 'How do I create a group?',
      answer: 'To create a group, tap the "+" button on the Groups screen. Enter a group name and add members by their email addresses.'
    },
    {
      question: 'How do I add an expense?',
      answer: 'In a group, tap the "+" button to add an expense. Enter the amount, description, and select how to split the expense among group members.'
    },
    {
      question: 'How do I settle up with someone?',
      answer: 'Go to the group and tap "Settle Up". You\'ll see a list of balances and can select who to settle with. Record the payment once completed.'
    },
    {
      question: 'Can I edit or delete an expense?',
      answer: 'Yes, you can delete an expense by swiping left on it. Editing expenses is coming in a future update.'
    },
    {
      question: 'How are the balances calculated?',
      answer: 'Balances are calculated based on expenses and payments within each group. The app shows you who owes whom and suggests the simplest way to settle debts.'
    },
  ];

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email',
      icon: 'email',
      onPress: () => Linking.openURL('mailto:support@splitease.com')
    },
    {
      title: 'Documentation',
      description: 'Read our user guide',
      icon: 'book-open-variant',
      onPress: () => Linking.openURL('https://docs.splitease.com')
    },
    {
      title: 'Report a Bug',
      description: 'Help us improve',
      icon: 'bug',
      onPress: () => Linking.openURL('mailto:bugs@splitease.com')
    }
  ];

  const renderFaq = (faq: FAQ, index: number) => (
    <Card key={index} style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
      >
        <View style={styles.faqTitle}>
          <Icon 
            name="help-circle" 
            size={24} 
            color={theme.colors.primary}
            style={styles.faqIcon}
          />
          <ThemeText variant="title" style={styles.question}>
            {faq.question}
          </ThemeText>
        </View>
        <Icon 
          name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color={theme.colors.text}
        />
      </TouchableOpacity>
      {expandedFaq === index && (
        <ThemeText style={styles.answer}>
          {faq.answer}
        </ThemeText>
      )}
    </Card>
  );

  const renderSupportOption = ({ title, description, icon, onPress }: any) => (
    <TouchableOpacity key={title} onPress={onPress}>
      <Card style={styles.supportCard}>
        <View style={styles.supportContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
            <Icon name={icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.supportInfo}>
            <ThemeText variant="title" style={styles.supportTitle}>
              {title}
            </ThemeText>
            <ThemeText variant="caption" style={styles.supportDescription}>
              {description}
            </ThemeText>
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Help & Support"
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <ThemeText variant="title" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemeText>
        {faqs.map((faq, index) => renderFaq(faq, index))}

        <ThemeText variant="title" style={[styles.sectionTitle, styles.supportTitle]}>
          Need More Help?
        </ThemeText>
        {supportOptions.map(renderSupportOption)}
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
    marginBottom: 16,
  },
  supportTitle: {
    marginTop: 32,
  },
  faqCard: {
    marginBottom: 12,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  faqIcon: {
    marginRight: 12,
  },
  question: {
    flex: 1,
  },
  answer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    lineHeight: 20,
    opacity: 0.8,
  },
  supportCard: {
    marginBottom: 12,
    padding: 16,
  },
  supportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportInfo: {
    flex: 1,
    marginRight: 16,
  },
  supportDescription: {
    opacity: 0.7,
    marginTop: 2,
  },
});

export default HelpSupportScreen; 