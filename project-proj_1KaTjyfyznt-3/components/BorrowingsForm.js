function BorrowingsForm({ members }) {
  try {
    const [selectedMember, setSelectedMember] = React.useState('');
    const [selectedMemberData, setSelectedMemberData] = React.useState(null);
    const [memberBorrowings, setMemberBorrowings] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);
    const currentYear = new Date().getFullYear();
    const [borrowingData, setBorrowingData] = React.useState({
      amount: 0,
      period: 'P' + (new Date().getMonth() + 1),
      year: currentYear,
      moneySource: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const periods = [
      { id: 'P1', name: 'P1 (January)' },
      { id: 'P2', name: 'P2 (February)' },
      { id: 'P3', name: 'P3 (March)' },
      { id: 'P4', name: 'P4 (April)' },
      { id: 'P5', name: 'P5 (May)' },
      { id: 'P6', name: 'P6 (June)' },
      { id: 'P7', name: 'P7 (July)' },
      { id: 'P8', name: 'P8 (August)' },
      { id: 'P9', name: 'P9 (September)' },
      { id: 'P10', name: 'P10 (October)' },
      { id: 'P11', name: 'P11 (November)' },
      { id: 'P12', name: 'P12 (December)' }
    ];

    // Handle member selection
    const handleMemberSelect = (memberId) => {
      setSelectedMember(memberId);
      const member = members.find(m => m.objectId === memberId);
      setSelectedMemberData(member?.objectData || null);
    };

    // Fetch borrowings when member changes
    React.useEffect(() => {
      const fetchMemberBorrowings = async () => {
        if (!selectedMember) {
          setMemberBorrowings({});
          return;
        }

        setIsLoading(true);
        try {
          const borrowingsResponse = await trickleListObjects('borrowing', 1000);
          const borrowings = (borrowingsResponse.items || []).filter(b => 
            b.objectData.memberId === selectedMember
          );
          
          const borrowingsByPeriod = {};
          borrowings.forEach(borr => {
            const borrowDate = new Date(borr.objectData.date || borr.objectData.timestamp);
            const year = borrowDate.getFullYear();
            const period = 'P' + (borrowDate.getMonth() + 1);
            if (!borrowingsByPeriod[year]) {
              borrowingsByPeriod[year] = {};
            }
            if (!borrowingsByPeriod[year][period]) {
              borrowingsByPeriod[year][period] = { amount: 0, count: 0 };
            }
            borrowingsByPeriod[year][period].amount += parseFloat(borr.objectData.amount) || 0;
            borrowingsByPeriod[year][period].count += 1;
          });
          
          setMemberBorrowings(borrowingsByPeriod);
        } catch (error) {
          console.error('Error fetching borrowings:', error);
          setMessage('Failed to load member borrowings');
        }
        setIsLoading(false);
      };

      fetchMemberBorrowings();
    }, [selectedMember, currentYear]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const amountNum = Number(borrowingData.amount);

      if (!selectedMember || Number.isNaN(amountNum) || amountNum <= 0) {
        setMessage('Please select a member and enter a valid borrowing amount');
        return;
      }

      if (!borrowingData.moneySource) {
        setMessage('Please select the money source');
        return;
      }

      setIsSubmitting(true);
      try {
        await trickleCreateObject('borrowing', {
          memberId: selectedMember,
          amount: parseFloat(borrowingData.amount),
          period: borrowingData.period,
          year: borrowingData.year,
          moneySource: borrowingData.moneySource,
          date: new Date().toISOString().split('T')[0],
          status: 'active',
          outstandingAmount: parseFloat(borrowingData.amount),
          timestamp: new Date().toISOString()
        });

        const member = members.find(m => m.objectId === selectedMember);
        if (member) {
          await trickleUpdateObject('member', selectedMember, {
            ...member.objectData,
            totalBorrowings: (member.objectData.totalBorrowings || 0) + parseFloat(borrowingData.amount),
            outstandingBalance: (member.objectData.outstandingBalance || 0) + parseFloat(borrowingData.amount)
          });
        }

        setMessage('Borrowing recorded successfully!');
        
        // Update local state
        const updatedBorrowings = { ...memberBorrowings };
        if (!updatedBorrowings[borrowingData.year]) {
          updatedBorrowings[borrowingData.year] = {};
        }
        if (!updatedBorrowings[borrowingData.year][borrowingData.period]) {
          updatedBorrowings[borrowingData.year][borrowingData.period] = { amount: 0, count: 0 };
        }
        updatedBorrowings[borrowingData.year][borrowingData.period].amount += parseFloat(borrowingData.amount);
        updatedBorrowings[borrowingData.year][borrowingData.period].count += 1;
        setMemberBorrowings(updatedBorrowings);

        // Update selected member data
        if (selectedMemberData) {
          setSelectedMemberData({
            ...selectedMemberData,
            totalBorrowings: (selectedMemberData.totalBorrowings || 0) + parseFloat(borrowingData.amount),
            outstandingBalance: (selectedMemberData.outstandingBalance || 0) + parseFloat(borrowingData.amount)
          });
        }

        // Reset form
        setBorrowingData({
          amount: 0,
          period: 'P' + (new Date().getMonth() + 1),
          year: currentYear,
          moneySource: '',
        });
      } catch (error) {
        console.error('Error recording borrowing:', error);
        setMessage('Failed to record borrowing. Please try again.');
      }
      setIsSubmitting(false);
    };

    const renderBorrowingGrid = () => {
      if (!selectedMember) return null;

      const currentYearBorrowings = memberBorrowings[currentYear] || {};

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--primary-color)'}}>
            Borrowing History - {currentYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrowed Amount (R)
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map(period => {
                  const borrowing = currentYearBorrowings[period.id];
                  const hasBorrowing = borrowing?.amount !== undefined && 
                                    borrowing?.amount !== null && 
                                    !Number.isNaN(Number(borrowing?.amount));
                  const borrowed = hasBorrowing ? Number(borrowing.amount) : 0;
                  const count = hasBorrowing ? borrowing.count : 0;

                  return (
                    <tr key={period.id} className={period.id === borrowingData.period ? 'bg-blue-50' : 'bg-white'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period.name}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm ${
                        hasBorrowing ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}>
                        {hasBorrowing ? borrowed.toFixed(2) : '-'}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm ${
                        hasBorrowing ? 'text-gray-700 font-medium' : 'text-gray-500'
                      }`}>
                        {hasBorrowing ? count : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isLoading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Loading borrowings...
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="max-w-4xl mx-auto" data-name="borrowings-form" data-file="components/BorrowingsForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Member Borrowings
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Select Member *
              </label>
              <select
                className="input-field"
                value={selectedMember}
                onChange={(e) => handleMemberSelect(e.target.value)}
                required
              >
                <option value="">Choose a member...</option>
                {members.map(member => (
                  <option key={member.objectId} value={member.objectId}>
                    {member.objectData.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMemberData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Borrowings</p>
                    <p className="font-medium">R{(selectedMemberData.totalBorrowings || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className="font-medium text-red-600">R{(selectedMemberData.outstandingBalance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Repayments</p>
                    <p className="font-medium">R{(selectedMemberData.totalRepayments || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Amount (R) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  className="input-field"
                  value={borrowingData.amount === 0 ? 0 : borrowingData.amount || '' }

                  onChange={(e) => {
                    const value = e.target.value;
                    setBorrowingData({
                      ...borrowingData,
                      amount: value === '' ? '' : parseInt(value) || 0
                    });
                  }}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Money Source *
                </label>
                <select
                  className="input-field"
                  value={borrowingData.moneySource}
                  onChange={(e) => setBorrowingData({...borrowingData, moneySource: e.target.value})}
                  required
                >
                  <option value="">Choose money source...</option>
                  <option value="Bank">Bank</option>
                  {members.map(member => (
                    <option key={member.objectId} value={member.objectData.name}>
                      {member.objectData.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Period
                </label>
                <select
                  className="input-field"
                  value={borrowingData.period}
                  onChange={(e) => setBorrowingData({...borrowingData, period: e.target.value})}
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>{period.name}</option>
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
                  value={borrowingData.year}
                  onChange={(e) => setBorrowingData({...borrowingData, year: parseInt(e.target.value)})}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Recording...' : 'Record Borrowing'}
            </button>
          </form>

          {renderBorrowingGrid()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('BorrowingsForm component error:', error);
    return null;
  }
}
