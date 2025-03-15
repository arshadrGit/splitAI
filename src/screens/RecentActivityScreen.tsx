import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Keyboard
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchActivities(user.id));
    }
  }, [dispatch, user]);

  // Filter activities based on search query
  const filteredActivities = activities.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const description = item.description?.toLowerCase() || '';
    const groupName = item.groupName?.toLowerCase() || '';
    const paidBy = item.paidBy?.toLowerCase() || '';
    const paidTo = item.paidTo?.toLowerCase() || '';
    
    return (
      description.includes(query) || 
      groupName.includes(query) || 
      paidBy.includes(query) || 
      paidTo.includes(query)
    );
  });

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
                    `${item.paidBy} paid ${item.paidTo}` : 
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

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
      <Icon name="magnify" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, { color: theme.colors.text }]}
        placeholder="Search activities..."
        placeholderTextColor={theme.colors.placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="close-circle" size={20} color={theme.colors.placeholder} />
        </TouchableOpacity>
      )}
    </View>
  );

  const handleRefresh = useCallback(() => {
    if (user) {
      dispatch(fetchActivities(user.id));
    }
  }, [dispatch, user]);

  if (loading && activities.length === 0) {
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
        rightIcon={showSearch ? "close" : "magnify"}
        onRightPress={() => {
          setShowSearch(!showSearch);
          if (showSearch) {
            setSearchQuery('');
          }
        }}
        secondaryRightIcon="refresh"
        onSecondaryRightPress={handleRefresh}
      />
      
      {showSearch && renderSearchBar()}
      
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyState}>
          {searchQuery ? (
            <>
              <Icon 
                name="file-search-outline" 
                size={64} 
                color={theme.colors.placeholder}
              />
              <ThemeText variant="title" style={styles.emptyTitle}>No Results Found</ThemeText>
              <ThemeText style={styles.emptyText}>Try a different search term</ThemeText>
            </>
          ) : (
            <>
              <Icon 
                name="history" 
                size={64} 
                color={theme.colors.placeholder}
              />
              <ThemeText variant="title" style={styles.emptyTitle}>No Recent Activity</ThemeText>
              <ThemeText style={styles.emptyText}>Your recent transactions will appear here</ThemeText>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={handleRefresh}
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
    // padding: 16,
  },
  activityCard: {
    // marginBottom: 12,
    marginHorizontal:0,
    marginBottom: 2,
    padding: 0,
    paddingVertical:10,
    paddingHorizontal:32,
    borderRadius: 0,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
});

export default RecentActivityScreen; 