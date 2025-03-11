import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchActivities } from '../redux/activitySlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';

export const RecentActivityScreen = () => {
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
    return (
      <Card style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <ThemeText variant="title">{item.description}</ThemeText>
          <ThemeText variant="caption">
            ${item.amount.toFixed(2)}
          </ThemeText>
        </View>
        <View style={styles.activityDetails}>
          <ThemeText>
            {item.type === 'payment' ? 'You paid ' : 'You added expense '}
            {item.paidTo}
          </ThemeText>
          <ThemeText variant="caption">
            {new Date(item.createdAt.toDate()).toLocaleDateString()}
          </ThemeText>
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
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemeText variant="title">No Recent Activity</ThemeText>
          <ThemeText>Your recent transactions will appear here</ThemeText>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    marginBottom: 8,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default RecentActivityScreen; 