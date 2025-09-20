class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  try {
    const [activeScreen, setActiveScreen] = React.useState('membership');
    const [members, setMembers] = React.useState([]);
    const [interestRates, setInterestRates] = React.useState({
      monthly: 10,
      annual: 120
    });

    React.useEffect(() => {
      loadMembers();
    }, []);

    const loadMembers = async () => {
      try {
        const response = await trickleListObjects('member', 100);
        setMembers(response.items || []);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };

    const renderScreen = () => {
      switch(activeScreen) {
        case 'membership':
          return <MembershipForm onMemberAdded={loadMembers} />;
        case 'tokens':
          return <TokensForm members={members} />;
        case 'contributions':
          return <ContributionsForm members={members} />;
        case 'borrowings':
          return <BorrowingsForm members={members} />;
        case 'repayments':
          return <RepaymentsForm members={members} />;
        case 'interest':
          return <InterestCalculator members={members} interestRates={interestRates} />;
        case 'summary':
          return <MemberSummary members={members} />;
        case 'period-transactions':
          return <PeriodTransactions />;
        case 'admin':
          return <AdminPanel interestRates={interestRates} setInterestRates={setInterestRates} />;
        case 'reports':
          return <ReportsPanel members={members} />;
        default:
          return <MembershipForm onMemberAdded={loadMembers} />;
      }
    };

    return (
      <div className="min-h-screen" data-name="app" data-file="app.js">
        <div className="bg-white border-b" style={{borderColor: 'var(--border-color)'}}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--primary-color)'}}>
                  <div className="icon-users text-xl text-white"></div>
                </div>
                <h1 className="text-2xl font-bold" style={{color: 'var(--primary-color)'}}>
                  Titans Financial Society
                </h1>
              </div>
              <div className="text-sm" style={{color: 'var(--text-secondary)'}}>
                © 2025 Titans Financial Savings Society
              </div>
            </div>
          </div>
        </div>
        
        <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {renderScreen()}
        </main>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);