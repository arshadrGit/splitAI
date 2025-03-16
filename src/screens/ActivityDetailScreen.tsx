import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

const ActivityDetailScreen = ({ route, navigation }: Props) => {
  const { activityId } = route.params;
  const { theme } = useTheme();
  const { activities } = useSelector((state: RootState) => state.activity);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Find the activity by ID
  const activity = activities.find(a => a.id === activityId);
  
  if (!activity) {
    return (
      <SafeAreaWrapper>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Header
            title="Activity Details"
            leftIcon="arrow-left"
            onLeftPress={() => navigation.goBack()}
          />
          <View style={styles.notFoundContainer}>
            <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
            <ThemeText variant="title" style={styles.notFoundText}>
              Activity not found
            </ThemeText>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  const isPayment = activity.type === 'payment';
  const isExpense = activity.type === 'expense';
  const isPositive = activity.balance > 0;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string, isGroupActivity: boolean) => {
    switch (type) {
      case 'payment':
        return 'cash';
      case 'expense':
        return isGroupActivity ? 'account-group' : 'cart-outline';
      default:
        return 'currency-usd';
    }
  };

  const navigateToRelatedScreen = () => {
    if (activity.groupId) {
      navigation.navigate('GroupDetail', { 
        groupId: activity.groupId,
        groupName: activity.groupName || 'Group'
      });
    } else if (activity.paidBy !== user?.id && activity.paidBy !== 'You') {
      // Navigate to friend detail if the payer is not the current user
      const friendId = activity.paidBy;
      const friendName = activity.paidBy;
      navigation.navigate('FriendDetail', { friendId, friendName });
    } else if (activity.paidTo && activity.paidTo !== user?.id && activity.paidTo !== 'You') {
      // Navigate to friend detail if the payee is not the current user
      const friendId = activity.paidTo;
      const friendName = activity.paidTo;
      navigation.navigate('FriendDetail', { friendId, friendName });
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Activity Details"
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
        />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconHeaderContainer}>
            <View style={[styles.largeIconContainer, { 
              backgroundColor: isPayment ? theme.colors.success : 
                              isExpense ? theme.colors.primary : 
                              theme.colors.secondary 
            }]}>
              <Icon 
                name={getActivityIcon(activity.type, activity.isGroupActivity)} 
                size={40} 
                color="#FFFFFF" 
              />
            </View>
            <ThemeText variant="title" style={styles.activityTitle}>
              {activity.description}
            </ThemeText>
            <ThemeText variant="subtitle" style={[styles.amountLarge, { 
              color: isPositive ? theme.colors.success : theme.colors.error 
            }]}>
              {isPositive ? '+' : '-'}${Math.abs(activity.balance).toFixed(2)}
            </ThemeText>
            <ThemeText style={styles.dateTime}>
              {formatDate(activity.createdAt)} at {formatTime(activity.createdAt)}
            </ThemeText>
          </View>

          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <ThemeText style={styles.detailLabel}>Type</ThemeText>
              <ThemeText style={styles.detailValue}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </ThemeText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemeText style={styles.detailLabel}>Total Amount</ThemeText>
              <ThemeText style={styles.detailValue}>
                ${activity.amount.toFixed(2)}
              </ThemeText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemeText style={styles.detailLabel}>Paid By</ThemeText>
              <ThemeText style={styles.detailValue}>{activity.paidBy}</ThemeText>
            </View>
            
            {activity.paidTo && (
              <View style={styles.detailRow}>
                <ThemeText style={styles.detailLabel}>Paid To</ThemeText>
                <ThemeText style={styles.detailValue}>{activity.paidTo}</ThemeText>
              </View>
            )}
            
            {activity.groupName && (
              <View style={styles.detailRow}>
                <ThemeText style={styles.detailLabel}>Group</ThemeText>
                <ThemeText style={styles.detailValue}>{activity.groupName}</ThemeText>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <ThemeText style={styles.detailLabel}>Your Balance</ThemeText>
              <ThemeText style={[styles.detailValue, { 
                color: isPositive ? theme.colors.success : theme.colors.error 
              }]}>
                {isPositive ? '+' : '-'}${Math.abs(activity.balance).toFixed(2)}
              </ThemeText>
            </View>
          </Card>

          {(activity.groupId || activity.paidBy !== user?.id || 
           (activity.paidTo && activity.paidTo !== user?.id)) && (
            <TouchableOpacity
              style={[styles.relatedButton, { backgroundColor: theme.colors.primary }]}
              onPress={navigateToRelatedScreen}
            >
              <Icon 
                name={activity.groupId ? 'account-group' : 'account'} 
                size={20} 
                color="#FFFFFF" 
              />
              <ThemeText style={styles.relatedButtonText}>
                {activity.groupId 
                  ? `View Group: ${activity.groupName}` 
                  : activity.paidBy !== user?.id && activity.paidBy !== 'You'
                    ? `View Friend: ${activity.paidBy}`
                    : `View Friend: ${activity.paidTo || activity.paidBy}`
                }
              </ThemeText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    marginTop: 16,
    textAlign: 'center',
  },
  iconHeaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  amountLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateTime: {
    opacity: 0.7,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontWeight: '600',
  },
  detailValue: {
    textAlign: 'right',
  },
  relatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 8,
  },
  relatedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ActivityDetailScreen; 