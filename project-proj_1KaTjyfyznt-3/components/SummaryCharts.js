function SummaryCharts() {
  try {
    const ChartJS = window.Chart;
    const [chartData, setChartData] = React.useState({
      borrowings: [],
      repayments: [],
      owing: []
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadChartData();
    }, []);

    const loadChartData = async () => {
      setLoading(true);
      try {
        const borrowingsData = await trickleListObjects('borrowing', 1000);
        const repaymentsData = await trickleListObjects('repayment', 1000);
        const membersData = await trickleListObjects('member', 1000);

        const members = membersData.items || [];
        
        // Create datasets for each member
        const borrowingsDatasets = [];
        const repaymentsDatasets = [];
        const owingDatasets = [];
        
        const colors = [
          'rgba(30, 64, 175, 0.6)', 'rgba(5, 150, 105, 0.6)', 'rgba(239, 68, 68, 0.6)',
          'rgba(245, 158, 11, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)',
          'rgba(34, 197, 94, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(251, 146, 60, 0.6)'
        ];

        members.forEach((member, index) => {
          const memberName = member.objectData.name;
          const colorIndex = index % colors.length;
          
          // Borrowings by period for this member
          const memberBorrowings = Array.from({length: 12}, (_, i) => {
            const period = i + 1;
            return (borrowingsData.items || [])
              .filter(b => b.objectData.memberId === member.objectId && 
                          new Date(b.objectData.date).getMonth() + 1 === period)
              .reduce((sum, b) => sum + (b.objectData.amount || 0), 0);
          });
          
          // Repayments by period for this member
          const memberRepayments = Array.from({length: 12}, (_, i) => {
            const period = i + 1;
            return (repaymentsData.items || [])
              .filter(r => r.objectData.memberId === member.objectId && 
                          new Date(r.objectData.date).getMonth() + 1 === period)
              .reduce((sum, r) => sum + (r.objectData.amount || 0), 0);
          });
          
          // Outstanding balance for this member (same across all periods)
          const memberOwing = Array.from({length: 12}, () => member.objectData.outstandingBalance || 0);
          
          if (memberBorrowings.some(val => val > 0)) {
            borrowingsDatasets.push({
              label: memberName,
              data: memberBorrowings,
              backgroundColor: colors[colorIndex],
              borderColor: colors[colorIndex].replace('0.6', '1'),
              borderWidth: 1
            });
          }
          
          if (memberRepayments.some(val => val > 0)) {
            repaymentsDatasets.push({
              label: memberName,
              data: memberRepayments,
              borderColor: colors[colorIndex].replace('0.6', '1'),
              backgroundColor: colors[colorIndex].replace('0.6', '0.1'),
              tension: 0.4,
              fill: false
            });
          }
          
          if ((member.objectData.outstandingBalance || 0) > 0) {
            owingDatasets.push({
              label: memberName,
              data: memberOwing,
              backgroundColor: colors[colorIndex],
              borderColor: colors[colorIndex].replace('0.6', '1'),
              borderWidth: 1
            });
          }
        });

        setChartData({
          borrowings: borrowingsDatasets,
          repayments: repaymentsDatasets,
          owing: owingDatasets
        });
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
      setLoading(false);
    };

    React.useEffect(() => {
      if (!loading && chartData.borrowings.length > 0) {
        createCharts();
      }
    }, [loading, chartData]);

    const createCharts = () => {
      const periods = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12'];
      
      // Borrowings Chart
      const borrowingCtx = document.getElementById('borrowingChart');
      if (borrowingCtx) {
        new ChartJS(borrowingCtx, {
          type: 'bar',
          data: {
            labels: periods,
            datasets: chartData.borrowings
          },
          options: {
            plugins: { 
              legend: { 
                display: true,
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 10 } }
              } 
            },
            scales: {
              y: { beginAtZero: true },
              x: { 
                stacked: false
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }

      // Repayments Chart
      const repaymentCtx = document.getElementById('repaymentChart');
      if (repaymentCtx) {
        new ChartJS(repaymentCtx, {
          type: 'line',
          data: {
            labels: periods,
            datasets: chartData.repayments
          },
          options: {
            plugins: { 
              legend: { 
                display: true,
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 10 } }
              } 
            },
            scales: {
              y: { beginAtZero: true }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }

      // Total Owing Chart
      const owingCtx = document.getElementById('owingChart');
      if (owingCtx) {
        new ChartJS(owingCtx, {
          type: 'bar',
          data: {
            labels: periods,
            datasets: chartData.owing
          },
          options: {
            plugins: { 
              legend: { 
                display: true,
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 10 } }
              } 
            },
            scales: {
              y: { beginAtZero: true },
              x: { 
                stacked: false
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    };

    if (loading) {
      return (
        <div className="card text-center" data-name="summary-charts" data-file="components/SummaryCharts.js">
          <div className="icon-loader animate-spin text-3xl mx-auto mb-4" style={{color: 'var(--primary-color)'}}></div>
          <p>Loading summary charts...</p>
        </div>
      );
    }

    return (
      <div className="card" data-name="summary-charts" data-file="components/SummaryCharts.js">
        <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
          Financial Summary Reports
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Member Borrowings by Period</h3>
            <div className="h-80">
              <canvas id="borrowingChart"></canvas>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Repayments by Period</h3>
            <div className="h-80">
              <canvas id="repaymentChart"></canvas>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Total Outstanding by Period</h3>
            <div className="h-80">
              <canvas id="owingChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SummaryCharts component error:', error);
    return null;
  }
}