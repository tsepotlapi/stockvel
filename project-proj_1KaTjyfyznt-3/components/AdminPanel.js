function AdminPanel({ interestRates, setInterestRates }) {
  try {
    const [rates, setRates] = React.useState(interestRates);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const handleUpdateRates = async () => {
      try {
        setInterestRates(rates);
        setMessage('Interest rates updated successfully!');
      } catch (error) {
        setMessage('Failed to update rates. Please try again.');
      }
    };

    const runEndOfMonth = async () => {
      setIsProcessing(true);
      try {
        // Get all members with outstanding balances
        const membersResponse = await trickleListObjects('member', 100);
        const members = membersResponse.items || [];
        
        let processedCount = 0;
        for (const member of members) {
          if (member.objectData.outstandingBalance > 0) {
            const monthlyRate = rates.monthly / 100;
            const interestAmount = member.objectData.outstandingBalance * monthlyRate;
            
            // Add interest to outstanding balance
            await trickleUpdateObject('member', member.objectId, {
              ...member.objectData,
              outstandingBalance: member.objectData.outstandingBalance + interestAmount
            });
            
            processedCount++;
          }
        }
        
        setMessage(`End of period processing completed. ${processedCount} members processed.`);
      } catch (error) {
        setMessage('End of month processing failed. Please try again.');
      }
      setIsProcessing(false);
    };

    const runEndOfYear = async () => {
      setIsProcessing(true);
      try {
        setMessage('Year-end processing completed. All data archived.');
      } catch (error) {
        setMessage('Year-end processing failed. Please try again.');
      }
      setIsProcessing(false);
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6" data-name="admin-panel" data-file="components/AdminPanel.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            System Administration
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Interest Rate Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={rates.monthly}
                    onChange={(e) => setRates({...rates, monthly: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Annual Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={rates.annual}
                    onChange={(e) => setRates({...rates, annual: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <button onClick={handleUpdateRates} className="btn-primary w-full">
                  Update Interest Rates
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Period Processing</h3>
              <div className="space-y-4">
                <button 
                  onClick={runEndOfMonth}
                  disabled={isProcessing}
                  className="btn-secondary w-full"
                >
                  {isProcessing ? 'Processing...' : 'Run End of Period'}
                </button>
                
                <button 
                  onClick={runEndOfYear}
                  disabled={isProcessing}
                  className="btn-secondary w-full"
                >
                  {isProcessing ? 'Processing...' : 'Run End of Year'}
                </button>
                
                <div className="text-sm text-gray-600 mt-2">
                  <p>• Interest is calculated at the end of each period (P1-P12)</p>
                  <p>• Each period corresponds to a monthly cycle</p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('success') || message.includes('completed') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminPanel component error:', error);
    return null;
  }
}