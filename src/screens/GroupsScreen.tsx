import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroups, createGroup } from '../redux/groupsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const GroupsScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { groups, loading: groupsLoading } = useSelector((state: RootState) => state.groups);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchGroups(user.id));
    }
  }, [dispatch, user]);

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Group name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateName(groupName)) {
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
      setShowAddGroup(false);
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
        <TouchableOpacity style={styles.groupContent}>
          <View style={styles.groupHeader}>
            <View style={styles.groupLeft}>
              <View style={[styles.groupIconContainer, { backgroundColor: theme.colors.secondary }]}>
                <Icon name="account-group" size={24} color="#FFFFFF" />
              </View>
              <View>
                <ThemeText variant="title" style={styles.groupName}>
                  {item.name}
                </ThemeText>
                <ThemeText variant="caption">
                  {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
                </ThemeText>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.text} />
          </View>
          
          <View style={styles.groupFooter}>
            <ThemeText style={styles.expenseText}>
              Total expenses: <ThemeText style={{ fontWeight: 'bold' }}>${item.totalExpenses.toFixed(2)}</ThemeText>
            </ThemeText>
            <ThemeText variant="caption">
              Created {new Date(item.createdAt.toDate()).toLocaleDateString()}
            </ThemeText>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Groups" 
        rightIcon={showAddGroup ? "close" : "plus-circle"} 
        onRightPress={() => setShowAddGroup(!showAddGroup)}
      />
      
      {showAddGroup && (
        <Card style={styles.createGroupCard}>
          <ThemeText variant="title" style={styles.sectionTitle}>Create New Group</ThemeText>
          <View style={styles.inputContainer}>
            <Icon name="account-group" size={20} color={theme.colors.text} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                borderColor: nameError ? theme.colors.error : theme.colors.border,
              }]}
              placeholder="Group Name"
              placeholderTextColor={theme.colors.placeholder}
              value={groupName}
              onChangeText={(text) => {
                setGroupName(text);
                if (nameError) validateName(text);
              }}
              onBlur={() => validateName(groupName)}
            />
          </View>
          {nameError ? <ThemeText style={styles.errorText}>{nameError}</ThemeText> : null}
          
          <CustomButton
            title="Create Group"
            onPress={handleCreateGroup}
            loading={loading}
            style={styles.button}
            icon={<Icon name="check" size={20} color="#FFFFFF" />}
          />
        </Card>
      )}

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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image 
                source={require('../assets/images/empty-activity.png')} 
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <ThemeText variant="title" style={styles.emptyTitle}>No Groups Yet</ThemeText>
              <ThemeText style={styles.emptyText}>Create groups to split expenses with friends</ThemeText>
              <CustomButton
                title="Create a Group"
                onPress={() => setShowAddGroup(true)}
                style={styles.createGroupButton}
                icon={<Icon name="plus-circle" size={20} color="#FFFFFF" />}
              />
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
  },
  createGroupCard: {
    margin: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 30,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  groupCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  groupContent: {
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupName: {
    fontWeight: 'bold',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  expenseText: {
    fontSize: 14,
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
    marginTop: 100,
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
  createGroupButton: {
    marginTop: 10,
  },
});

export default GroupsScreen; 