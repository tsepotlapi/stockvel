function MemberSummary({ members }) {
  try {
    const [memberData, setMemberData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadMemberSummary();
    }, [members]);

    const loadMemberSummary = async () => {
      setLoading(true);
      try {
        const summaryData = await Promise.all(
          members.map(async (member) => {
            const contributions = await trickleListObjects(`contribution:${member.objectId}`, 100);
            const borrowings = await trickleListObjects(`borrowing:${member.objectId}`, 100);
            const repayments = await trickleListObjects(`repayment:${member.objectId}`, 100);
            
            return {
              ...member,
              contributionsCount: contributions.items?.length || 0,
              borrowingsCount: borrowings.items?.length || 0,
              repaymentsCount: repayments.items?.length || 0
            };
          })
        );
        setMemberData(summaryData);
      } catch (error) {
        console.error('Failed to load member summary:', error);
      }
      setLoading(false);
    };

    if (loading) {
      return (
        <div className="max-w-6xl mx-auto" data-name="member-summary" data-file="components/MemberSummary.js">
          <div className="card text-center">
            <div className="icon-loader animate-spin text-3xl mx-auto mb-4" style={{color: 'var(--primary-color)'}}></div>
            <p>Loading member summary...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-6" data-name="member-summary" data-file="components/MemberSummary.js">
        <SummaryCharts />
        
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Member Summary Table
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border" style={{borderColor: 'var(--border-color)'}}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left" style={{borderColor: 'var(--border-color)'}}>Member</th>
                  <th className="border p-3 text-center" style={{borderColor: 'var(--border-color)'}}>Shares</th>
                  <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Total Contributions</th>
                  <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Total Borrowings</th>
                  <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Total Repayments</th>
                  <th className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>Outstanding Balance</th>
                  <th className="border p-3 text-center" style={{borderColor: 'var(--border-color)'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {memberData.map((member) => (
                  <tr key={member.objectId} className="hover:bg-gray-50">
                    <td className="border p-3" style={{borderColor: 'var(--border-color)'}}>
                      <div>
                        <div className="font-medium">{member.objectData.name}</div>
                        <div className="text-sm text-gray-500">{member.objectData.email}</div>
                      </div>
                    </td>
                    <td className="border p-3 text-center" style={{borderColor: 'var(--border-color)'}}>{member.objectData.shares || 0}</td>
                    <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>R{(member.objectData.totalContributions || 0).toFixed(2)}</td>
                    <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>R{(member.objectData.totalBorrowings || 0).toFixed(2)}</td>
                    <td className="border p-3 text-right" style={{borderColor: 'var(--border-color)'}}>R{(member.objectData.totalRepayments || 0).toFixed(2)}</td>
                    <td className="border p-3 text-right font-bold" style={{borderColor: 'var(--border-color)'}}>
                      <span className={(member.objectData.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                        R{(member.objectData.outstandingBalance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="border p-3 text-center" style={{borderColor: 'var(--border-color)'}}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.objectData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.objectData.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MemberSummary component error:', error);
    return null;
  }
}
