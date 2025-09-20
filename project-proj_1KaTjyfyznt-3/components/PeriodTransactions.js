function PeriodTransactions() {
  try {
    const [selectedPeriod, setSelectedPeriod] = React.useState('December');
    const [transactionData, setTransactionData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const periods = [
      'December', 'January', 'February', 'March', 'April', 'May',
      'June', 'July', 'August', 'September', 'October', 'November'
    ];

    const members = [
      'Edelyne', 'Ella', 'Esther', 'Florence', 'Isabel', 'Linda', 'Margaret',
      'Nancy', 'Netsai', 'Olivia', 'Patience', 'Rutendo', 'Tabeth', 'Tendai', 'Thelma', 'Vina'
    ];

    // Sample transaction data for each period
    const periodTransactions = {
      December: [
        { borrower: 'Edelyne', lender: 'Edelyne', amount: 1000, type: 'borrowing' },
        { borrower: 'Esther', lender: 'Esther', amount: 2000, type: 'borrowing' },
        { borrower: 'Isabel', lender: 'Isabel', amount: 2000, type: 'borrowing' },
        { borrower: 'Linda', lender: 'Linda', amount: 2000, type: 'borrowing' },
        { borrower: 'Nancy', lender: 'Nancy', amount: 3000, type: 'borrowing' },
        { borrower: 'Olivia', lender: 'Olivia', amount: 1000, type: 'borrowing' },
        { borrower: 'Rutendo', lender: 'Rutendo', amount: 2000, type: 'borrowing' },
        { borrower: 'Tabeth', lender: 'Tabeth', amount: 4000, type: 'borrowing' },
        { borrower: 'Tendai', lender: 'Tendai', amount: 4000, type: 'borrowing' },
        { borrower: 'Thelma', lender: 'Thelma', amount: 2000, type: 'borrowing' },
        { borrower: 'Vina', lender: 'Bank', amount: 1000, type: 'borrowing' },
        { borrower: 'Bank', lender: 'Edelyne', amount: 3000, type: 'lending' },
        { borrower: 'Bank', lender: 'Ella', amount: 2000, type: 'lending' },
        { borrower: 'Bank', lender: 'Florence', amount: 4000, type: 'lending' },
        { borrower: 'Bank', lender: 'Margaret', amount: 4000, type: 'lending' },
        { borrower: 'Bank', lender: 'Netsai', amount: 3000, type: 'lending' },
        { borrower: 'Bank', lender: 'Patience', amount: 3000, type: 'lending' }
      ],
      January: [
        { borrower: 'Edelyne', lender: 'Edelyne', amount: 4000, type: 'borrowing' },
        { borrower: 'Esther', lender: 'Esther', amount: 2000, type: 'borrowing' },
        { borrower: 'Isabel', lender: 'Isabel', amount: 2000, type: 'borrowing' },
        { borrower: 'Linda', lender: 'Linda', amount: 2000, type: 'borrowing' },
        { borrower: 'Linda', lender: 'Bank', amount: 20000, type: 'borrowing' },
        { borrower: 'Margaret', lender: 'Margaret', amount: 4000, type: 'borrowing' },
        { borrower: 'Patience', lender: 'Patience', amount: 3000, type: 'borrowing' },
        { borrower: 'Patience', lender: 'Bank', amount: 17000, type: 'borrowing' },
        { borrower: 'Rutendo', lender: 'Rutendo', amount: 2000, type: 'borrowing' },
        { borrower: 'Tabeth', lender: 'Tabeth', amount: 4000, type: 'borrowing' },
        { borrower: 'Tendai', lender: 'Tendai', amount: 4000, type: 'borrowing' },
        { borrower: 'Thelma', lender: 'Thelma', amount: 2000, type: 'borrowing' },
        { borrower: 'Vina', lender: 'Bank', amount: 1000, type: 'borrowing' },
        { borrower: 'Nancy', lender: 'Bank', amount: 1000, type: 'repayment' },
        { borrower: 'Olivia', lender: 'Bank', amount: 1000, type: 'repayment' }
      ],
      February: [
        { borrower: 'Edelyne', lender: 'Edelyne', amount: 4000, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Ella', amount: 2000, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Isabel', amount: 5470, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Linda', amount: 3200, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Nancy', amount: 5530, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Netsai', amount: 3000, type: 'borrowing' },
        { borrower: 'Ella', lender: 'Olivia', amount: 1000, type: 'borrowing' },
        { borrower: 'Esther', lender: 'Esther', amount: 2000, type: 'borrowing' },
        { borrower: 'Esther', lender: 'Linda', amount: 20000, type: 'borrowing' },
        { borrower: 'Florence', lender: 'Florence', amount: 4000, type: 'borrowing' },
        { borrower: 'Margaret', lender: 'Margaret', amount: 4000, type: 'borrowing' },
        { borrower: 'Patience', lender: 'Patience', amount: 3000, type: 'borrowing' },
        { borrower: 'Rutendo', lender: 'Rutendo', amount: 2000, type: 'borrowing' },
        { borrower: 'Tabeth', lender: 'Tabeth', amount: 4000, type: 'borrowing' },
        { borrower: 'Tendai', lender: 'Tendai', amount: 4000, type: 'borrowing' },
        { borrower: 'Thelma', lender: 'Thelma', amount: 2000, type: 'borrowing' },
        { borrower: 'Vina', lender: 'Bank', amount: 1000, type: 'borrowing' },
        { borrower: 'Isabel', lender: 'Bank', amount: 2470, type: 'repayment' },
        { borrower: 'Linda', lender: 'Bank', amount: 21200, type: 'repayment' },
        { borrower: 'Nancy', lender: 'Bank', amount: 2530, type: 'repayment' }
      ]
    };

    React.useEffect(() => {
      loadPeriodData();
    }, [selectedPeriod]);

    const loadPeriodData = () => {
      setLoading(true);
      try {
        const data = periodTransactions[selectedPeriod] || [];
        setTransactionData(data);
      } catch (error) {
        console.error('Failed to load period transactions:', error);
      }
      setLoading(false);
    };

    const getTotalBorrowed = () => {
      return transactionData
        .filter(t => t.type === 'borrowing')
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getTotalRepaid = () => {
      return transactionData
        .filter(t => t.type === 'repayment')
        .reduce((sum, t) => sum + t.amount, 0);
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="period-transactions" data-file="components/PeriodTransactions.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Period Transactions Report
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Period</label>
              <select
                className="input-field"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map(period => (
                  <option key={period} value={period}>{period} 2025</option>
                ))}
              </select>
            </div>
            
            <div className="card">
              <div className="text-xl font-bold" style={{color: 'var(--primary-color)'}}>
                R{getTotalBorrowed().toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Borrowed</div>
            </div>
            
            <div className="card">
              <div className="text-xl font-bold" style={{color: 'var(--accent-color)'}}>
                R{getTotalRepaid().toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Repaid</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="icon-loader animate-spin text-3xl mx-auto mb-4" style={{color: 'var(--primary-color)'}}></div>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border" style={{borderColor: 'var(--border-color)'}}>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color)'}}>Type</th>
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color)'}}>Borrower</th>
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color)'}}>Lender/Source</th>
                    <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionData.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-3" style={{borderColor: 'var(--border-color)'}}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'borrowing' 
                            ? 'bg-blue-100 text-blue-800' 
                            : transaction.type === 'repayment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.type === 'borrowing' ? 'Borrowing' : 
                           transaction.type === 'repayment' ? 'Repayment' : 'Lending'}
                        </span>
                      </td>
                      <td className="border p-3" style={{borderColor: 'var(--border-color)'}}>{transaction.borrower}</td>
                      <td className="border p-3" style={{borderColor: 'var(--border-color)'}}>{transaction.lender}</td>
                      <td className="border p-3 text-right font-medium" style={{borderColor: 'var(--border-color)'}}>
                        R{transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="3" className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>
                      Net Activity:
                    </td>
                    <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>
                      R{(getTotalBorrowed() - getTotalRepaid()).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('PeriodTransactions component error:', error);
    return null;
  }
}