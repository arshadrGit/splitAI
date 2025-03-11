import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput,
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { calculateBalances, recordPayment } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SettleUpScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { friends } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      loadBalances();
    }
  }, [dispatch, groupId]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const result = await dispatch(calculateBalances(groupId)).unwrap();
      setBalances(result);
      calculateSettlements(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  const calculateSettlements = (balanceData) => {
    // Create a list of users with their balances
    const users = Object.keys(balanceData).map(userId => ({
      id: userId,
      balance: balanceData[userId]
    }));

    // Sort by balance (negative first, then positive)
    users.sort((a, b) => a.balance - b.balance);

    const settlements = [];
    let i = 0; // index for negative balances (users who are owed money)
    let j = users.length - 1; // index for positive balances (users who owe money)

    while (i < j) {
      const debtor = users[i]; // user with negative balance (is owed money)
      const creditor = users[j]; // user with positive balance (owes money)

      if (Math.abs(debtor.balance) < 0.01 || Math.abs(creditor.balance) < 0.01) {
        // Skip users with zero balance
        if (Math.abs(debtor.balance) < 0.01) i++;
        if (Math.abs(creditor.balance) < 0.01) j--;
        continue;
      }

      // Calculate the amount to settle
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      // Add the settlement
      settlements.push({
        from: creditor.id, // user who owes money
        to: debtor.id, // user who is owed money
        amount: amount.toFixed(2)
      });

      // Update balances
      debtor.balance += amount;
      creditor.balance -= amount;

      // Move to next user if balance is settled
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j--;
    }

    setSettlements(settlements);
  };

  const getUserName = (userId) => {
    if (userId === user?.id) return 'You';
    
    const friend = friends.find(f => 
      f.userId === userId || f.friendId === userId
    );
    
    return friend ? (friend.displayName || friend.email) : 'Unknown User';
  };

  const handleSettlePayment = (settlement) => {
    setSelectedSettlement(settlement);
    setAmount(settlement.amount);
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedSettlement) return;
    
    try {
      setLoading(true);
      await dispatch(recordPayment({
        groupId,
        fromUserId: selectedSettlement.from,
        toUserId: selectedSettlement.to,
        amount: parseFloat(amount),
        date: new Date(),
        createdBy: user.id
      })).unwrap();
      
      setShowPaymentModal(false);
      loadBalances(); // Refresh balances
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const renderSettlementItem = ({ item }) => {
    const isUserInvolved = item.from === user?.id || item.to === user?.id;
    const fromName = getUserName(item.from);
    const toName = getUserName(item.to);
    
    return (
      <Card style={[
        styles.settlementCard, 
        isUserInvolved && { borderLeftWidth: 3, borderLeftColor: theme.colors.primary }
      ]}>
        <View style={styles.settlementInfo}>
          <View style={styles.settlementDetails}>
            <ThemeText variant="title" style={styles.settlementTitle}>
              {fromName} owes {toName}
            </ThemeText>
            <ThemeText variant="subtitle" style={styles.settlementAmount}>
              ${parseFloat(item.amount).toFixed(2)}
            </ThemeText>
          </View>
          
          {isUserInvolved && (
            <CustomButton
              title="Settle"
              onPress={() => handleSettlePayment(item)}
              style={styles.settleButton}
              icon={<Icon name="cash" size={16} color="#FFFFFF" />}
            />
          )}
        </View>
      </Card>
    );
  };

  if (loading || groupLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.balanceCard}>
        <ThemeText variant="title" style={styles.balanceTitle}>
          Your Balance
        </ThemeText>
        {user && balances[user.id] !== undefined ? (
          <ThemeText variant="header" style={[
            styles.balanceAmount,
            { color: balances[user.id] < 0 ? theme.colors.success : balances[user.id] > 0 ? theme.colors.error : theme.colors.text }
          ]}>
            {balances[user.id] < 0 ? 'You are owed ' : balances[user.id] > 0 ? 'You owe ' : ''}
            ${Math.abs(balances[user.id] || 0).toFixed(2)}
          </ThemeText>
        ) : (
          <ThemeText>No balance information</ThemeText>
        )}
      </Card>
      
      <View style={styles.settlementContainer}>
        <ThemeText variant="title" style={styles.sectionTitle}>
          Settlements
        </ThemeText>
        
        {settlements.length > 0 ? (
          <FlatList
            data={settlements}
            renderItem={renderSettlementItem}
            keyExtractor={(item, index) => `settlement-${index}`}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <ThemeText style={styles.emptyText}>
              No settlements needed. Everyone is square!
            </ThemeText>
          </Card>
        )}
      </View>
      
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemeText variant="title">Record Payment</ThemeText>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedSettlement && (
              <ScrollView>
                <ThemeText style={styles.paymentDescription}>
                  {getUserName(selectedSettlement.from)} is paying {getUserName(selectedSettlement.to)}
                </ThemeText>
                
                <View style={styles.formGroup}>
                  <ThemeText style={styles.label}>Amount</ThemeText>
                  <View style={styles.amountInputContainer}>
                    <ThemeText style={styles.currencySymbol}>$</ThemeText>
                    <TextInput
                      style={[
                        styles.amountInput,
                        { 
                          color: theme.colors.text,
                          borderColor: theme.colors.border
                        }
                      ]}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </View>
                </View>
                
                <CustomButton
                  title="Record Payment"
                  onPress={handleRecordPayment}
                  loading={loading}
                  style={styles.recordButton}
                  icon={<Icon name="check" size={20} color="#FFFFFF" />}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  balanceTitle: {
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settlementContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  settlementCard: {
    marginBottom: 12,
  },
  settlementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementDetails: {
    flex: 1,
  },
  settlementTitle: {
    marginBottom: 4,
  },
  settlementAmount: {
    fontWeight: 'bold',
  },
  settleButton: {
    minWidth: 80,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentDescription: {
    marginBottom: 20,
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
  },
  recordButton: {
    marginTop: 10,
  },
});

export default SettleUpScreen; 