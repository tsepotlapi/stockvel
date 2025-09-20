function ContributionsForm({ members }) {
  try {
    const [selectedMember, setSelectedMember] = React.useState('');
    const [selectedMemberData, setSelectedMemberData] = React.useState(null);
    const [memberContributions, setMemberContributions] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);
    const currentYear = new Date().getFullYear();
    const [contributionData, setContributionData] = React.useState({
      amount: 0,
      period: 'P' + (new Date().getMonth() + 1),
      year: currentYear,
      assignedTo: '',
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
      
      if (member?.objectData?.shares) {
        setContributionData(prev => ({
          ...prev,
          amount: member.objectData.shares * 1000
        }));
      }
    };

    // Fetch contributions when member changes
    React.useEffect(() => {
      const fetchMemberContributions = async () => {
        if (!selectedMember) {
          setMemberContributions({});
          return;
        }

        setIsLoading(true);
        try {
          const contributionsResponse = await trickleListObjects('contribution', 1000);
          const contributions = (contributionsResponse.items || []).filter(c => 
            c.objectData.memberId === selectedMember
          );
          
          const contributionsByPeriod = {};
          contributions.forEach(cont => {
            const year = cont.objectData.year || currentYear;
            const period = cont.objectData.period || 'P1';
            if (!contributionsByPeriod[year]) {
              contributionsByPeriod[year] = {};
            }
            contributionsByPeriod[year][period] = {
              amount: parseFloat(cont.objectData.amount) || 0,
              id: cont.objectId
            };
          });
          
          setMemberContributions(contributionsByPeriod);
        } catch (error) {
          console.error('Error fetching contributions:', error);
          setMessage('Failed to load member contributions');
        }
        setIsLoading(false);
      };

      fetchMemberContributions();
    }, [selectedMember, currentYear]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const amountNum = Number(contributionData.amount);

      if (!selectedMember || Number.isNaN(amountNum) || amountNum < 0) {
        setMessage('Please select a member and enter a valid contribution amount');
        return;
      }

      if (!contributionData.assignedTo) {
        setMessage('Please select where this contribution is assigned');
        return;
      }

      setIsSubmitting(true);
      try {
        await trickleCreateObject('contribution', {
          memberId: selectedMember,
          amount: parseFloat(contributionData.amount),
          period: contributionData.period,
          year: contributionData.year,
          assignedTo: contributionData.assignedTo,
          timestamp: new Date().toISOString()
        });

        const member = members.find(m => m.objectId === selectedMember);
        if (member) {
          await trickleUpdateObject('member', selectedMember, {
            ...member.objectData,
            totalContributions: (member.objectData.totalContributions || 0) + parseFloat(contributionData.amount)
          });
        }

        setMessage('Contribution recorded successfully!');
        
        const updatedContributions = { ...memberContributions };
        if (!updatedContributions[contributionData.year]) {
          updatedContributions[contributionData.year] = {};
        }
        updatedContributions[contributionData.year][contributionData.period] = {
          amount: parseFloat(contributionData.amount),
          id: 'new'
        };
        setMemberContributions(updatedContributions);
      } catch (error) {
        setMessage('Failed to record contribution. Please try again.');
      }
      setIsSubmitting(false);
    };

    const calculateExpectedAmount = () => {
      if (!selectedMemberData) return 0;
      return (selectedMemberData.shares || 0) * 1000;
    };

    const renderContributionGrid = () => {
      if (!selectedMember) return null;

      const currentYearContributions = memberContributions[currentYear] || {};
      const expectedAmount = calculateExpectedAmount();
      let totalShortfallExcess = 0;

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--primary-color)'}}>
            Contribution History - {currentYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected (R)
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributed (R)
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shortfall/Excess (R)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map(period => {
                  const contribution = currentYearContributions[period.id];
                  const hasContribution = contribution?.amount !== undefined && 
                                        contribution?.amount !== null && 
                                        !Number.isNaN(Number(contribution?.amount));
                  const contributed = hasContribution ? Number(contribution.amount) : 0;
                  const shortfallExcess = hasContribution ? contributed - expectedAmount : null;

                  if (hasContribution) {
                    totalShortfallExcess += shortfallExcess;
                  }

                  return (
                    <tr key={period.id} className={period.id === contributionData.period ? 'bg-blue-50' : 'bg-white'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period.name}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-500">
                        {expectedAmount.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm ${
                        hasContribution ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}>
                        {hasContribution ? contributed.toFixed(2) : '-'}
                      </td>
                      <td className={`px-3 py-2 text-center text-sm font-medium ${
                        shortfallExcess == null ? 'text-gray-500' :
                        shortfallExcess < 0 ? 'text-red-600' : 
                        shortfallExcess > 0 ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {shortfallExcess == null ? '-' : shortfallExcess.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isLoading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Loading contributions...
            </div>
          )}
        </div>
      );
    };


    return (
      <div className="max-w-4xl mx-auto" data-name="contributions-form" data-file="components/ContributionsForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Member Contributions
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
                    <p className="text-sm text-gray-500">Shares/Tokens</p>
                    <p className="font-medium">{selectedMemberData.shares || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Contributions</p>
                    <p className="font-medium">R{(selectedMemberData.totalContributions || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Monthly</p>
                    <p className="font-medium">R{calculateExpectedAmount().toFixed(2)}</p>
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
                  step="1000"
                  className="input-field"
                  value={contributionData.amount === 0 ? 0 : contributionData.amount || '' }

                  onChange={(e) => {

                    const value = e.target.value;
                    setContributionData({
                      ...contributionData,
                      amount: value === '' ? '' : parseInt(value) || 0
                    });
                  }}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Assigned To *
                </label>
                <select
                  className="input-field"
                  value={contributionData.assignedTo}
                  onChange={(e) => setContributionData({...contributionData, assignedTo: e.target.value})}
                  required
                >
                  <option value="">Choose assignee...</option>
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
                  value={contributionData.period}
                  onChange={(e) => setContributionData({...contributionData, period: e.target.value})}
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
                  value={contributionData.year}
                  onChange={(e) => setContributionData({...contributionData, year: parseInt(e.target.value)})}
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
              {isSubmitting ? 'Recording...' : 'Record Contribution'}
            </button>
          </form>

          {renderContributionGrid()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ContributionsForm component error:', error);
    return null;
  }
}


