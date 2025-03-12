import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchActivities } from '../redux/activitySlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RecentActivityScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { activities, loading } = useSelector((state: RootState) => state.activity);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchActivities(user.id));
    }
  }, [dispatch, user]);

  const renderActivityItem = ({ item }: { item: any }) => {
    const isPayment = item.type === 'payment';
    
    return (
      <Card style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityLeft}>
            <View style={[styles.iconContainer, { 
              backgroundColor: isPayment ? theme.colors.success : theme.colors.primary 
            }]}>
              <Icon 
                name={isPayment ? "cash" : "cart-outline"} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
            <View>
              <ThemeText variant="title" style={styles.activityTitle}>
                {item.description}
              </ThemeText>
              <ThemeText variant="caption">
                {isPayment ? 'You paid ' : 'You added expense for '} 
                {item.paidTo}
              </ThemeText>
            </View>
          </View>
          <View>
            <ThemeText variant="title" style={{ 
              color: isPayment ? theme.colors.success : theme.colors.primary 
            }}>
              ${item.amount.toFixed(2)}
            </ThemeText>
            <ThemeText variant="caption" style={styles.date}>
              {new Date(item.createdAt.toDate()).toLocaleDateString()}
            </ThemeText>
          </View>
        </View>
      </Card>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Recent Activity" 
        rightIcon="refresh" 
        onRightPress={() => user && dispatch(fetchActivities(user.id))}
      />
      
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Image 
            source={require('../assets/images/empty-activity.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
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
    </View>
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
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTitle: {
    fontWeight: '600',
  },
  date: {
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecentActivityScreen; 