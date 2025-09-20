function ReportsPanel({ members }) {
  try {
    const [reportType, setReportType] = React.useState('summary');
    const [reportData, setReportData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [dateRange, setDateRange] = React.useState({
      startPeriod: 'P1',
      endPeriod: 'P9',
      year: 2025
    });

    const generateReport = async () => {
      setLoading(true);
      try {
        switch (reportType) {
          case 'summary':
            await generateSummaryReport();
            break;
          case 'contributions':
            await generateContributionsReport();
            break;
          case 'borrowings':
            await generateBorrowingsReport();
            break;
          case 'repayments':
            await generateRepaymentsReport();
            break;
          case 'interest':
            await generateInterestReport();
            break;
        }
      } catch (error) {
        console.error('Report generation failed:', error);
      }
      setLoading(false);
    };

    const generateSummaryReport = async () => {
      const summary = {
        totalMembers: members.length,
        totalShares: members.reduce((sum, m) => sum + (m.objectData.shares || 0), 0),
        totalContributions: members.reduce((sum, m) => sum + (m.objectData.totalContributions || 0), 0),
        totalBorrowings: members.reduce((sum, m) => sum + (m.objectData.totalBorrowings || 0), 0),
        totalOutstanding: members.reduce((sum, m) => sum + (m.objectData.outstandingBalance || 0), 0)
      };
      setReportData({ type: 'summary', data: summary });
    };

    const periodOptions = [
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

    const generateContributionsReport = async () => {
      const contributions = await trickleListObjects('contribution', 1000);
      const contributionsData = contributions.items || [];
      
      // Filter contributions for the selected single period and year
      const selectedPeriod = dateRange.startPeriod; // Use single period selection
      const periodContributions = contributionsData.filter(c => 
        c.objectData.period === selectedPeriod && 
        c.objectData.year === dateRange.year
      );
      
      // Create member allocation matrix
      const reportData = [];
      const memberNames = members.map(m => m.objectData.name).sort();
      const columnTotals = { Bank: 0 };
      
      // Initialize column totals for all members
      memberNames.forEach(name => {
        columnTotals[name] = 0;
      });
      
      members.forEach(member => {
        const memberContributions = periodContributions.filter(c => 
          c.objectData.memberId === member.objectId
        );
        
        if (memberContributions.length > 0) {
          const row = { name: member.objectData.name, Bank: 0 };
          
          // Initialize all member columns to 0
          memberNames.forEach(name => {
            row[name] = 0;
          });
          
          // Process each contribution and allocate to assignee
          memberContributions.forEach(contrib => {
            const assignedTo = contrib.objectData.assignedTo || 'Bank';
            const amount = contrib.objectData.amount || 0;
            
            if (assignedTo === 'Bank') {
              row.Bank += amount;
              columnTotals.Bank += amount;
            } else {
              // Find if assignedTo is a member name
              const assigneeMember = members.find(m => m.objectData.name === assignedTo);
              if (assigneeMember) {
                row[assignedTo] = (row[assignedTo] || 0) + amount;
                columnTotals[assignedTo] += amount;
              } else {
                // If not found as member, assign to Bank
                row.Bank += amount;
                columnTotals.Bank += amount;
              }
            }
          });
          
          reportData.push(row);
        }
      });
      
      // Add totals row
      const totalsRow = { name: 'TOTALS', Bank: columnTotals.Bank };
      memberNames.forEach(name => {
        totalsRow[name] = columnTotals[name];
      });
      reportData.push(totalsRow);
      
      setReportData({ 
        type: 'contributions', 
        data: reportData,
        selectedPeriod: selectedPeriod,
        memberNames: memberNames
      });
    };

    const generateBorrowingsReport = async () => {
      const borrowings = await trickleListObjects('borrowing', 1000);
      const borrowingsData = borrowings.items || [];
      
      // Get period range
      const startPeriodNum = parseInt(dateRange.startPeriod.replace('P', ''));
      const endPeriodNum = parseInt(dateRange.endPeriod.replace('P', ''));
      
      // Format data by member and selected period range
      const reportData = members.map(member => {
        const memberBorrowings = borrowingsData.filter(b => b.objectData.memberId === member.objectId);
        const row = { name: member.objectData.name };
        
        // Add data for selected period range
        for (let i = startPeriodNum; i <= endPeriodNum; i++) {
          const periodId = `P${i}`;
          const periodName = periodOptions.find(p => p.id === periodId)?.name || periodId;
          const monthNumber = i === 12 ? 12 : i; // P12 = December (month 12), P1 = January (month 1)
          const periodBorrowings = memberBorrowings
            .filter(b => {
              const borrowDate = new Date(b.objectData.date);
              return borrowDate.getMonth() + 1 === monthNumber && 
                     borrowDate.getFullYear() === dateRange.year;
            })
            .reduce((sum, b) => sum + (b.objectData.amount || 0), 0);
          row[periodName] = periodBorrowings;
        }
        
        return row;
      });
      
      setReportData({ type: 'borrowings', data: reportData });
    };

    const generateRepaymentsReport = async () => {
      const repayments = await trickleListObjects('repayment', 1000);
      const repaymentsData = repayments.items || [];
      
      // Get period range
      const startPeriodNum = parseInt(dateRange.startPeriod.replace('P', ''));
      const endPeriodNum = parseInt(dateRange.endPeriod.replace('P', ''));
      
      // Format data by member and selected period range
      const reportData = members.map(member => {
        const memberRepayments = repaymentsData.filter(r => r.objectData.memberId === member.objectId);
        const row = { name: member.objectData.name };
        
        // Add data for selected period range
        for (let i = startPeriodNum; i <= endPeriodNum; i++) {
          const periodId = `P${i}`;
          const periodName = periodOptions.find(p => p.id === periodId)?.name || periodId;
          const monthNumber = i === 12 ? 12 : i; // P12 = December (month 12), P1 = January (month 1)
          const periodRepayments = memberRepayments
            .filter(r => {
              const repayDate = new Date(r.objectData.date);
              return repayDate.getMonth() + 1 === monthNumber && 
                     repayDate.getFullYear() === dateRange.year;
            })
            .reduce((sum, r) => sum + (r.objectData.amount || 0), 0);
          row[periodName] = periodRepayments;
        }
        
        return row;
      });
      
      setReportData({ type: 'repayments', data: reportData });
    };

    const generateInterestReport = async () => {
      const interests = await trickleListObjects('interest_calculation', 1000);
      const interestsData = interests.items || [];
      
      // Get period range
      const startPeriodNum = parseInt(dateRange.startPeriod.replace('P', ''));
      const endPeriodNum = parseInt(dateRange.endPeriod.replace('P', ''));
      
      // Format data by member and selected period range
      const reportData = members.map(member => {
        const memberInterests = interestsData.filter(i => i.objectData.memberId === member.objectId);
        const row = { name: member.objectData.name };
        
        // Add data for selected period range
        for (let i = startPeriodNum; i <= endPeriodNum; i++) {
          const periodId = `P${i}`;
          const periodName = periodOptions.find(p => p.id === periodId)?.name || periodId;
          const periodInterests = memberInterests
            .filter(i => i.objectData.period === periodId && i.objectData.year === dateRange.year)
            .reduce((sum, i) => sum + (i.objectData.interestAmount || 0), 0);
          row[periodName] = periodInterests;
        }
        
        return row;
      });
      
      setReportData({ type: 'interest', data: reportData });
    };

    const renderReport = () => {
      if (!reportData) return null;

      if (reportType === 'summary' && reportData.type === 'summary' && reportData.data) {
        const summary = reportData.data;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-2xl font-bold" style={{color: 'var(--primary-color)'}}>
                {summary.totalMembers || 0}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold" style={{color: 'var(--accent-color)'}}>
                R{(summary.totalContributions || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Contributions</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold text-red-600">
                R{(summary.totalOutstanding || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Outstanding Balance</div>
            </div>
          </div>
        );
      }

      if (reportData.type && reportData.data && Array.isArray(reportData.data)) {
        // Special handling for contributions allocation matrix
        if (reportData.type === 'contributions' && reportData.memberNames) {
          const columns = ['MEMBER', 'Bank', ...reportData.memberNames];
          const periodName = periodOptions.find(p => p.id === reportData.selectedPeriod)?.name || reportData.selectedPeriod;
          
          return (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--primary-color)'}}>
                Contributions Allocation Matrix - {periodName} {dateRange.year}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border text-sm" style={{borderColor: 'var(--border-color)'}}>
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left font-semibold" style={{borderColor: 'var(--border-color)'}}>
                        Contributing Member
                      </th>
                      <th className="border p-2 text-center font-semibold" style={{borderColor: 'var(--border-color)'}}>
                        Bank
                      </th>
                      {reportData.memberNames.map(memberName => (
                        <th key={memberName} className="border p-2 text-center font-semibold" style={{borderColor: 'var(--border-color)'}}>
                          {memberName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row, index) => {
                      const isTotalsRow = row.name === 'TOTALS';
                      return (
                        <tr key={index} className={isTotalsRow ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}>
                          <td className="border p-2 font-medium" style={{borderColor: 'var(--border-color)'}}>
                            {row.name || 'Unknown'}
                          </td>
                          <td className="border p-2 text-center" style={{borderColor: 'var(--border-color)'}}>
                            {(row.Bank || 0) > 0 ? `R ${(row.Bank || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          {reportData.memberNames.map(memberName => (
                            <td key={memberName} className="border p-2 text-center" style={{borderColor: 'var(--border-color)'}}>
                              {(row[memberName] || 0) > 0 ? `R ${(row[memberName] || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        
        // Default handling for other report types
        const firstRow = reportData.data[0];
        if (!firstRow) return <div className="text-center text-gray-500 py-8">No data available.</div>;
        
        const columns = ['NAME', ...Object.keys(firstRow).filter(key => key !== 'name')];
        
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm" style={{borderColor: 'var(--border-color)'}}>
              <thead>
                <tr className="bg-gray-50">
                  {columns.map(column => (
                    <th key={column} className="border p-2 text-left font-semibold" style={{borderColor: 'var(--border-color)'}}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium" style={{borderColor: 'var(--border-color)'}}>{row.name || 'Unknown'}</td>
                    {columns.slice(1).map(column => (
                      <td key={column} className="border p-2 text-right" style={{borderColor: 'var(--border-color)'}}>
                        {(row[column] || 0) > 0 ? `R ${(row[column] || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return (
        <div className="text-center text-gray-500 py-8">
          No data available for the selected report type.
        </div>
      );
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="reports-panel" data-file="components/ReportsPanel.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Financial Reports
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select
                className="input-field"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="summary">Summary Report</option>
                <option value="contributions">Contributions Report</option>
                <option value="borrowings">Borrowings Report</option>
                <option value="repayments">Repayments Report</option>
                <option value="interest">Interest Report</option>
              </select>
            </div>
            
            {reportType === 'contributions' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Period</label>
                <select
                  className="input-field"
                  value={dateRange.startPeriod}
                  onChange={(e) => setDateRange({...dateRange, startPeriod: e.target.value})}
                >
                  {periodOptions.map(period => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Period</label>
                  <select
                    className="input-field"
                    value={dateRange.startPeriod}
                    onChange={(e) => setDateRange({...dateRange, startPeriod: e.target.value})}
                  >
                    {periodOptions.map(period => (
                      <option key={period.id} value={period.id}>{period.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">End Period</label>
                  <select
                    className="input-field"
                    value={dateRange.endPeriod}
                    onChange={(e) => setDateRange({...dateRange, endPeriod: e.target.value})}
                  >
                    {periodOptions.map(period => (
                      <option key={period.id} value={period.id}>{period.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <select
                className="input-field"
                value={dateRange.year}
                onChange={(e) => setDateRange({...dateRange, year: parseInt(e.target.value)})}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {renderReport()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ReportsPanel component error:', error);
    return null;
  }
}