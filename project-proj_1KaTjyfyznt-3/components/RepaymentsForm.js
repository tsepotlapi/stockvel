function RepaymentsForm({ members }) {
  try {
    const [selectedMember, setSelectedMember] = React.useState('');
    const [selectedMemberData, setSelectedMemberData] = React.useState(null);
    const [memberRepayments, setMemberRepayments] = React.useState({});
    const [memberFinancialData, setMemberFinancialData] = React.useState({
      outstandingCapital: 0,
      outstandingInterest: 0,
      totalOwing: 0
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const currentYear = new Date().getFullYear();
    const [repaymentData, setRepaymentData] = React.useState({
      amount: 0,
      period: 'P' + (new Date().getMonth() + 1),
      year: currentYear,
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
    const handleMemberSelect = async (memberId) => {
      setSelectedMember(memberId);
      const member = members.find(m => m.objectId === memberId);
      setSelectedMemberData(member?.objectData || null);
      
      if (member) {
        await calculateMemberFinancials(member);
      }
    };

    // Calculate member's outstanding capital and interest
    const calculateMemberFinancials = async (member) => {
      try {
        // Get all borrowings for capital calculation
        const borrowingsResponse = await trickleListObjects('borrowing', 1000);
        const memberBorrowings = (borrowingsResponse.items || []).filter(b => 
          b.objectData.memberId === member.objectId
        );

        // Get all repayments to calculate what's been paid
        const repaymentsResponse = await trickleListObjects('repayment', 1000);
        const memberRepayments = (repaymentsResponse.items || []).filter(r => 
          r.objectData.memberId === member.objectId
        );

        // Get all interest calculations
        const interestResponse = await trickleListObjects('interest_calculation', 1000);
        const memberInterest = (interestResponse.items || []).filter(i => 
          i.objectData.memberId === member.objectId
        );

        const totalBorrowed = memberBorrowings.reduce((sum, b) => sum + (b.objectData.amount || 0), 0);
        const totalRepaid = memberRepayments.reduce((sum, r) => sum + (r.objectData.amount || 0), 0);
        const totalInterest = memberInterest.reduce((sum, i) => sum + (i.objectData.interestAmount || 0), 0);

        // Capital goes towards principal first, then interest
        const outstandingCapital = Math.max(0, totalBorrowed - totalRepaid);
        const outstandingInterest = Math.max(0, totalInterest - Math.max(0, totalRepaid - totalBorrowed));
        const totalOwing = outstandingCapital + outstandingInterest;

        setMemberFinancialData({
          outstandingCapital,
          outstandingInterest,
          totalOwing
        });
      } catch (error) {
        console.error('Error calculating member financials:', error);
      }
    };

    // Fetch repayments when member changes
    React.useEffect(() => {
      const fetchMemberRepayments = async () => {
        if (!selectedMember) {
          setMemberRepayments({});
          return;
        }

        setIsLoading(true);
        try {
          const repaymentsResponse = await trickleListObjects('repayment', 1000);
          const repayments = (repaymentsResponse.items || []).filter(r => 
            r.objectData.memberId === selectedMember
          );
          
          const repaymentsByPeriod = {};
          repayments.forEach(rep => {
            const repayDate = new Date(rep.objectData.date || rep.objectData.timestamp);
            const year = repayDate.getFullYear();
            const period = 'P' + (repayDate.getMonth() + 1);
            if (!repaymentsByPeriod[year]) {
              repaymentsByPeriod[year] = {};
            }
            if (!repaymentsByPeriod[year][period]) {
              repaymentsByPeriod[year][period] = { amount: 0, count: 0 };
            }
            repaymentsByPeriod[year][period].amount += parseFloat(rep.objectData.amount) || 0;
            repaymentsByPeriod[year][period].count += 1;
          });
          
          setMemberRepayments(repaymentsByPeriod);
        } catch (error) {
          console.error('Error fetching repayments:', error);
          setMessage('Failed to load member repayments');
        }
        setIsLoading(false);
      };

      fetchMemberRepayments();
    }, [selectedMember, currentYear]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const amountNum = Number(repaymentData.amount);

      if (!selectedMember || Number.isNaN(amountNum) || amountNum <= 0) {
        setMessage('Please select a member and enter a valid repayment amount');
        return;
      }

      setIsSubmitting(true);
      try {
        await trickleCreateObject('repayment', {
          memberId: selectedMember,
          amount: parseFloat(repaymentData.amount),
          period: repaymentData.period,
          year: repaymentData.year,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        });

        const member = members.find(m => m.objectId === selectedMember);
        if (member) {
          const newRepayments = (member.objectData.totalRepayments || 0) + parseFloat(repaymentData.amount);
          const newOutstanding = Math.max(0, (member.objectData.outstandingBalance || 0) - parseFloat(repaymentData.amount));
          
          await trickleUpdateObject('member', selectedMember, {
            ...member.objectData,
            totalRepayments: newRepayments,
            outstandingBalance: newOutstanding
          });
        }

        setMessage('Repayment recorded successfully!');
        
        // Update local state
        const updatedRepayments = { ...memberRepayments };
        if (!updatedRepayments[repaymentData.year]) {
          updatedRepayments[repaymentData.year] = {};
        }
        if (!updatedRepayments[repaymentData.year][repaymentData.period]) {
          updatedRepayments[repaymentData.year][repaymentData.period] = { amount: 0, count: 0 };
        }
        updatedRepayments[repaymentData.year][repaymentData.period].amount += parseFloat(repaymentData.amount);
        updatedRepayments[repaymentData.year][repaymentData.period].count += 1;
        setMemberRepayments(updatedRepayments);

        // Update financial data
        if (selectedMemberData) {
          await calculateMemberFinancials({ objectId: selectedMember, objectData: selectedMemberData });
        }

        // Reset form
        setRepaymentData({
          amount: 0,
          period: 'P' + (new Date().getMonth() + 1),
          year: currentYear,
        });
      } catch (error) {
        console.error('Error recording repayment:', error);
        setMessage('Failed to record repayment. Please try again.');
      }
      setIsSubmitting(false);
    };

    const renderRepaymentGrid = () => {
      if (!selectedMember) return null;

      const currentYearRepayments = memberRepayments[currentYear] || {};

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--primary-color)'}}>
            Repayment History - {currentYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repaid Amount (R)
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map(period => {
                  const repayment = currentYearRepayments[period.id];
                  const hasRepayment = repayment?.amount !== undefined && 
                                    repayment?.amount !== null && 
                                    !Number.isNaN(Number(repayment?.amount));
                  const repaid = hasRepayment ? Number(repayment.amount) : 0;
                  const count = hasRepayment ? repayment.count : 0;

                  return (
                    <tr key={period.id} className={period.id === repaymentData.period ? 'bg-blue-50' : 'bg-white'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period.name}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm ${
                        hasRepayment ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}>
                        {hasRepayment ? repaid.toFixed(2) : '-'}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm ${
                        hasRepayment ? 'text-gray-700 font-medium' : 'text-gray-500'
                      }`}>
                        {hasRepayment ? count : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isLoading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Loading repayments...
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="max-w-4xl mx-auto" data-name="repayments-form" data-file="components/RepaymentsForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Member Repayments
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
                {members.filter(m => m.objectData.outstandingBalance > 0).map(member => (
                  <option key={member.objectId} value={member.objectId}>
                    {member.objectData.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMemberData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Capital</p>
                    <p className="font-medium text-red-600">R{memberFinancialData.outstandingCapital.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Interest</p>
                    <p className="font-medium text-orange-600">R{memberFinancialData.outstandingInterest.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Owing</p>
                    <p className="font-medium text-red-800">R{memberFinancialData.totalOwing.toFixed(2)}</p>
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
                  value={repaymentData.amount === 0 ? 0 : repaymentData.amount || '' }
                  onChange={(e) => {
                    const value = e.target.value;
                    setRepaymentData({
                      ...repaymentData,
                      amount: value === '' ? '' : parseInt(value) || 0
                    });
                  }}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Period
                </label>
                <select
                  className="input-field"
                  value={repaymentData.period}
                  onChange={(e) => setRepaymentData({...repaymentData, period: e.target.value})}
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>
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
                value={repaymentData.year}
                onChange={(e) => setRepaymentData({...repaymentData, year: parseInt(e.target.value)})}
              />
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
              {isSubmitting ? 'Recording...' : 'Record Repayment'}
            </button>
          </form>

          {renderRepaymentGrid()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('RepaymentsForm component error:', error);
    return null;
  }
}
