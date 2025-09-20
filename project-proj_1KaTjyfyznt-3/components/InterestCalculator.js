function InterestCalculator({ members, interestRates }) {
  try {
    const [calculations, setCalculations] = React.useState([]);
    const [isCalculating, setIsCalculating] = React.useState(false);
    const [selectedPeriod, setSelectedPeriod] = React.useState({
      period: 'P' + (new Date().getMonth() + 1),
      year: new Date().getFullYear()
    });

    const calculateInterest = async () => {
      setIsCalculating(true);
      try {
        const results = [];
        
        for (const member of members) {
          if (member.objectData.outstandingBalance > 0) {
            const monthlyRate = interestRates.monthly / 100;
            const interestAmount = member.objectData.outstandingBalance * monthlyRate;
            
            results.push({
              memberId: member.objectId,
              memberName: member.objectData.name,
              outstandingBalance: member.objectData.outstandingBalance,
              interestRate: interestRates.monthly,
              interestAmount: interestAmount,
              newBalance: member.objectData.outstandingBalance + interestAmount
            });
            
            // Record interest calculation
            await trickleCreateObject('interest_calculation', {
              memberId: member.objectId,
              principalAmount: member.objectData.outstandingBalance,
              interestRate: interestRates.monthly,
              interestAmount: interestAmount,
              period: selectedPeriod.period,
              year: selectedPeriod.year,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        setCalculations(results);
      } catch (error) {
        console.error('Interest calculation error:', error);
      }
      setIsCalculating(false);
    };

    return (
      <div className="max-w-4xl mx-auto" data-name="interest-calculator" data-file="components/InterestCalculator.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Interest Calculator
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Period
              </label>
              <select
                className="input-field"
                value={selectedPeriod.period}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, period: e.target.value})}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={`P${i + 1}`} value={`P${i + 1}`}>
                    P{i + 1} ({new Date(0, i).toLocaleString('default', { month: 'long' })})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Year
              </label>
              <input
                type="number"
                min="2020"
                max="2030"
                className="input-field"
                value={selectedPeriod.year}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, year: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={calculateInterest}
                disabled={isCalculating}
                className="btn-primary w-full"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Interest'}
              </button>
            </div>
          </div>

          {calculations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border" style={{borderColor: 'var(--border-color)'}}>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color)'}}>Member</th>
                    <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Outstanding Balance</th>
                    <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Interest Rate</th>
                    <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Interest Amount</th>
                    <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>New Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calc, index) => (
                    <tr key={index}>
                      <td className="border p-3" style={{borderColor: 'var(--border-color)'}}>{calc.memberName}</td>
                      <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>R{calc.outstandingBalance.toFixed(2)}</td>
                      <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>{calc.interestRate}%</td>
                      <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>R{calc.interestAmount.toFixed(2)}</td>
                      <td className="border p-3 text-right font-bold" style={{borderColor: 'var(--border-color)'}}>R{calc.newBalance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('InterestCalculator component error:', error);
    return null;
  }
}