import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchActivities } from '../redux/activitySlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RecentActivityScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { activities, loading } = useSelector((state: RootState) => state.activity);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchActivities(user.id));
    }
  }, [dispatch, user]);

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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderActivityItem = ({ item }: { item: any }) => {
    const isPayment = item.type === 'payment';
    const isExpense = item.type === 'expense';
    const isPositive = item.balance > 0;
    
    return (
      <TouchableOpacity 
        onPress={() => {
          if (item.groupId) {
            navigation.navigate('GroupDetails', { groupId: item.groupId });
          }
        }}
      >
        <Card style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityLeft}>
              <View style={[styles.iconContainer, { 
                backgroundColor: isPayment ? theme.colors.success : 
                                isExpense ? theme.colors.primary : 
                                theme.colors.secondary 
              }]}>
                <Icon 
                  name={getActivityIcon(item.type, item.isGroupActivity)} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.activityInfo}>
                <ThemeText variant="title" style={styles.activityTitle}>
                  {item.description}
                </ThemeText>
                {item.groupName && (
                  <ThemeText variant="caption" style={styles.groupName}>
                    in {item.groupName}
                  </ThemeText>
                )}
                <ThemeText variant="caption" style={styles.activityDetails}>
                  {isPayment ? 
                    `You paid ${item.paidTo}` : 
                    item.paidBy === user?.id ? 
                      'You paid for everyone' : 
                      `${item.paidBy} paid`}
                </ThemeText>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <ThemeText variant="title" style={[styles.amount, { 
                color: isPositive ? theme.colors.success : theme.colors.error 
              }]}>
                {isPositive ? '+' : '-'}${Math.abs(item.balance).toFixed(2)}
              </ThemeText>
              <ThemeText variant="caption" style={styles.date}>
                {formatDate(item.createdAt)}
              </ThemeText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Recent Activity" 
        rightIcon="refresh" 
        onRightPress={() => user && dispatch(fetchActivities(user.id))}
      />
      
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon 
            name="history" 
            size={64} 
            color={theme.colors.placeholder}
          />
          <ThemeText variant="title" style={styles.emptyTitle}>No Recent Activity</ThemeText>
          <ThemeText style={styles.emptyText}>Your recent transactions will appear here</ThemeText>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 12,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  groupName: {
    opacity: 0.7,
    marginBottom: 2,
  },
  activityDetails: {
    opacity: 0.7,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
  },
  date: {
    marginTop: 4,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default RecentActivityScreen; 