// Database operations utility functions for Titans Financial Society

const dbOperations = {
  // Member operations
  async createMember(memberData) {
    try {
      return await trickleCreateObject('member', {
        ...memberData,
        dateJoined: new Date().toISOString(),
        status: 'active',
        totalContributions: 0,
        totalBorrowings: 0,
        totalRepayments: 0,
        outstandingBalance: 0
      });
    } catch (error) {
      console.error('Failed to create member:', error);
      throw error;
    }
  },

  async updateMemberBalance(memberId, amount, operation = 'add') {
    try {
      const member = await trickleGetObject('member', memberId);
      const currentBalance = member.objectData.outstandingBalance || 0;
      const newBalance = operation === 'add' 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);
      
      return await trickleUpdateObject('member', memberId, {
        ...member.objectData,
        outstandingBalance: newBalance
      });
    } catch (error) {
      console.error('Failed to update member balance:', error);
      throw error;
    }
  },

  // Transaction operations
  async recordContribution(memberId, amount, period, year, notes = '') {
    try {
      return await trickleCreateObject('contribution', {
        memberId,
        amount,
        period,
        year,
        notes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to record contribution:', error);
      throw error;
    }
  },

  async recordBorrowing(memberId, amount, interestRate, purpose = '') {
    try {
      return await trickleCreateObject('borrowing', {
        memberId,
        amount,
        interestRate,
        purpose,
        status: 'active',
        outstandingAmount: amount,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to record borrowing:', error);
      throw error;
    }
  },

  // Reporting operations
  async generateMemberSummary(memberId) {
    try {
      const member = await trickleGetObject('member', memberId);
      const contributions = await trickleListObjects(`contribution:${memberId}`, 100);
      const borrowings = await trickleListObjects(`borrowing:${memberId}`, 100);
      const repayments = await trickleListObjects(`repayment:${memberId}`, 100);
      
      return {
        member: member.objectData,
        contributions: contributions.items || [],
        borrowings: borrowings.items || [],
        repayments: repayments.items || []
      };
    } catch (error) {
      console.error('Failed to generate member summary:', error);
      throw error;
    }
  }
};

// Make dbOperations available globally
window.dbOperations = dbOperations;