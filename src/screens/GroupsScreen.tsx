import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroups, createGroup } from '../redux/groupsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';

export const GroupsScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { groups, loading: groupsLoading } = useSelector((state: RootState) => state.groups);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchGroups(user.id));
    }
  }, [dispatch, user]);

  const handleCreateGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await dispatch(createGroup({
        name: groupName,
        members: [user.id],
        createdBy: user.id,
        createdAt: new Date(),
        totalExpenses: 0,
      })).unwrap();
      setGroupName('');
      Alert.alert('Success', 'Group created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const renderGroupItem = ({ item }: { item: any }) => {
    return (
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <ThemeText variant="title">{item.name}</ThemeText>
          <ThemeText variant="caption">
            {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
          </ThemeText>
        </View>
        <View style={styles.groupDetails}>
          <ThemeText>Total expenses: ${item.totalExpenses.toFixed(2)}</ThemeText>
          <ThemeText variant="caption">
            Created {new Date(item.createdAt.toDate()).toLocaleDateString()}
          </ThemeText>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.createGroupCard}>
        <ThemeText variant="title" style={styles.sectionTitle}>Create New Group</ThemeText>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
          placeholder="Group Name"
          placeholderTextColor={theme.colors.text}
          value={groupName}
          onChangeText={setGroupName}
        />
        <CustomButton
          title="Create Group"
          onPress={handleCreateGroup}
          loading={loading}
          style={styles.button}
        />
      </Card>

      <ThemeText variant="title" style={styles.groupsTitle}>Your Groups</ThemeText>

      {groupsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemeText>You haven't created any groups yet</ThemeText>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  createGroupCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  button: {
    alignSelf: 'flex-end',
  },
  groupsTitle: {
    marginBottom: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default GroupsScreen; 