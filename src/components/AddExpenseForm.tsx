import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { addExpense } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from './ThemeText';
import { CustomButton } from './CustomButton';
import { Card } from './Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SplitType, Split, Friend } from '../types';

interface Props {
  groupId?: string;
  participants: string[];
  friends?: Friend[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddExpenseForm: React.FC<Props> = ({
  groupId,
  participants,
  friends = [],
  onSuccess,
  onCancel
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [showPaidByModal, setShowPaidByModal] = useState(false);
  const [selectedPaidBy, setSelectedPaidBy] = useState(user?.id || '');

  const splitTypes: { type: SplitType; label: string; icon: string }[] = [
    { type: 'EQUAL', label: 'Split Equally', icon: 'equal' },
    { type: 'EXACT', label: 'Split by Amount', icon: 'currency-usd' },
    { type: 'PERCENTAGE', label: 'Split by Percentage', icon: 'percent' },
  ];

  // Get display name for a user ID
  const getDisplayName = (userId: string) => {
    if (userId === user?.id) return 'You';
    
    // Check in friends list
    const friend = friends.find(f => f.friendId === userId || f.id === userId);
    if (friend?.displayName) return friend.displayName;
    
    // If not found, just return the ID
    return userId;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedPaidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    try {
      setLoading(true);
      
      let splits: Split[];
      if (splitType === 'EQUAL') {
        const splitAmount = numAmount / participants.length;
        splits = participants.map(userId => ({
          userId,
          amount: splitAmount,
        }));
      } else {
        // Validate custom splits
        const totalSplit = Object.values(customSplits).reduce((sum, value) => sum + value, 0);
        if (splitType === 'PERCENTAGE' && Math.abs(totalSplit - 100) > 0.01) {
          Alert.alert('Error', 'Percentages must add up to 100%');
          return;
        } else if (splitType === 'EXACT' && Math.abs(totalSplit - numAmount) > 0.01) {
          Alert.alert('Error', 'Split amounts must add up to the total');
          return;
        }

        splits = participants.map(userId => ({
          userId,
          amount: splitType === 'PERCENTAGE' 
            ? (numAmount * (customSplits[userId] || 0)) / 100
            : (customSplits[userId] || 0),
        }));
      }

      // Debug log to verify groupId
      console.log('Adding expense with groupId:', groupId);

      await dispatch(addExpense({
        description,
        amount: numAmount,
        paidBy: selectedPaidBy,
        groupId: groupId || null,
        splitType,
        participants,
        splits,
      })).unwrap();

      onSuccess?.();
      setDescription('');
      setAmount('');
      setSplitType('EQUAL');
      setCustomSplits({});
      setSelectedPaidBy(user?.id || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const renderSplitTypeSelector = () => (
    <View style={styles.splitTypeContainer}>
      {splitTypes.map(({ type, label, icon }) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.splitTypeButton,
            { backgroundColor: theme.colors.card },
            splitType === type && { borderColor: theme.colors.primary }
          ]}
          onPress={() => setSplitType(type)}
        >
          <Icon name={icon} size={24} color={splitType === type ? theme.colors.primary : theme.colors.text} />
          <ThemeText style={[styles.splitTypeLabel, splitType === type && { color: theme.colors.primary }]}>
            {label}
          </ThemeText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCustomSplits = () => (
    <View style={styles.customSplitsContainer}>
      <ThemeText variant="title" style={styles.sectionTitle}>
        {splitType === 'EXACT' ? 'Enter Amounts' : 'Enter Percentages'}
      </ThemeText>
      {participants.map(userId => (
        <View key={userId} style={styles.splitRow}>
          <ThemeText style={styles.participantName}>
            {getDisplayName(userId)}
          </ThemeText>
          <TextInput
            style={[styles.splitInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            keyboardType="decimal-pad"
            value={customSplits[userId]?.toString() || ''}
            onChangeText={(value) => {
              const numValue = parseFloat(value || '0');
              setCustomSplits(prev => ({
                ...prev,
                [userId]: numValue
              }));
            }}
            placeholder={splitType === 'EXACT' ? '0.00' : '0%'}
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
      ))}
    </View>
  );

  // Determine who to show in the "Who paid?" modal
  const getPaidByOptions = () => {
    if (groupId) {
      // If in a group, show group members
      return participants;
    } else if (friends.length > 0) {
      // If no group but has friends, show user + friends
      return [user?.id || '', ...friends.map(f => f.friendId)].filter(Boolean);
    } else {
      // Fallback to just participants
      return participants;
    }
  };

  const renderPaidByModal = () => (
    <Modal
      visible={showPaidByModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPaidByModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowPaidByModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <ThemeText variant="title" style={styles.modalTitle}>Who paid?</ThemeText>
          <FlatList
            data={getPaidByOptions()}
            keyExtractor={item => item}
            renderItem={({ item: userId }) => (
              <TouchableOpacity
                style={[
                  styles.paidByOption,
                  selectedPaidBy === userId && { backgroundColor: theme.colors.primary + '20' }
                ]}
                onPress={() => {
                  setSelectedPaidBy(userId);
                  setShowPaidByModal(false);
                }}
              >
                <View style={styles.paidByInfo}>
                  <Icon 
                    name="account" 
                    size={24} 
                    color={selectedPaidBy === userId ? theme.colors.primary : theme.colors.text} 
                  />
                  <ThemeText style={[
                    styles.paidByName,
                    selectedPaidBy === userId && { color: theme.colors.primary }
                  ]}>
                    {getDisplayName(userId)}
                  </ThemeText>
                </View>
                {selectedPaidBy === userId && (
                  <Icon name="check" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <ThemeText variant="title" style={styles.label}>Description</ThemeText>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this for?"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemeText variant="title" style={styles.label}>Amount</ThemeText>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemeText variant="title" style={styles.label}>Paid by</ThemeText>
          <TouchableOpacity
            style={[styles.paidBySelector, { borderColor: theme.colors.border }]}
            onPress={() => setShowPaidByModal(true)}
          >
            <View style={styles.paidByContent}>
              <Icon name="account" size={24} color={theme.colors.text} />
              <ThemeText style={styles.paidByText}>
                {getDisplayName(selectedPaidBy) || 'Select who paid'}
              </ThemeText>
            </View>
            <Icon name="chevron-down" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <ThemeText variant="title" style={styles.label}>Split Type</ThemeText>
          {renderSplitTypeSelector()}
        </View>

        {splitType !== 'EQUAL' && renderCustomSplits()}

        <View style={styles.buttonContainer}>
          {onCancel && (
            <CustomButton
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          )}
          <CustomButton
            title="Add Expense"
            onPress={handleSubmit}
            loading={loading}
            style={{
              flex: 1,
              ...(onCancel && { marginLeft: 8 })
            }}
          />
        </View>
        
        {/* Add extra padding at the bottom for modal context */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      {renderPaidByModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  splitTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  splitTypeButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  splitTypeLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  customSplitsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    flex: 1,
    marginRight: 16,
  },
  splitInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  paidBySelector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByText: {
    marginLeft: 12,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  paidByOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paidByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByName: {
    marginLeft: 12,
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});

export default AddExpenseForm; 