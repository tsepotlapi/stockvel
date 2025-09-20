function TokensForm({ members }) {
  try {
    const [selectedMember, setSelectedMember] = React.useState('');
    const [tokenData, setTokenData] = React.useState({
      shares: 0,
      transactionType: 'purchase',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedMember || !tokenData.shares) {
        setMessage('Please select a member and enter share quantity');
        return;
      }

      setIsSubmitting(true);
      try {
        await trickleCreateObject('token_transaction', {
          memberId: selectedMember,
          shares: parseInt(tokenData.shares),
          transactionType: tokenData.transactionType,
          amount: parseFloat(tokenData.amount),
          date: tokenData.date,
          timestamp: new Date().toISOString()
        });

        // Update member's share count
        const member = members.find(m => m.objectId === selectedMember);
        if (member) {
          const newShares = tokenData.transactionType === 'purchase' 
            ? member.objectData.shares + parseInt(tokenData.shares)
            : member.objectData.shares - parseInt(tokenData.shares);
          
          await trickleUpdateObject('member', selectedMember, {
            ...member.objectData,
            shares: Math.max(0, newShares)
          });
        }

        setMessage('Token transaction recorded successfully!');
        setTokenData({
          shares: 0,
          transactionType: 'purchase',
          amount: 0,
          date: new Date().toISOString().split('T')[0]
        });
        setSelectedMember('');
      } catch (error) {
        setMessage('Failed to record transaction. Please try again.');
      }
      setIsSubmitting(false);
    };

    return (
      <div className="max-w-2xl mx-auto" data-name="tokens-form" data-file="components/TokensForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Shares Management</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Select Member *
              </label>
              <select
                className="input-field"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
              >
                <option value="">Choose a member...</option>
                {members.map(member => (
                  <option key={member.objectId} value={member.objectId}>
                    {member.objectData.name} (Current Shares: {member.objectData.shares || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Transaction Type
                </label>
                <select
                  className="input-field"
                  value={tokenData.transactionType}
                  onChange={(e) => setTokenData({...tokenData, transactionType: e.target.value})}
                >
                  <option value="purchase">Purchase Shares</option>
                  <option value="sale">Sell Shares</option>
                  <option value="transfer">Transfer Shares</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Number of Shares *
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={tokenData.shares}
                  onChange={(e) => setTokenData({...tokenData, shares: parseInt(e.target.value) || 0})}
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Amount (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={tokenData.amount}
                  onChange={(e) => setTokenData({...tokenData, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Transaction Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={tokenData.date}
                  onChange={(e) => setTokenData({...tokenData, date: e.target.value})}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Processing...' : 'Record Transaction'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TokensForm component error:', error);
    return null;
  }
}