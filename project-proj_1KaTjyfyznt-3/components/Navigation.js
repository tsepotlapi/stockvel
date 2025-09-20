function Navigation({ activeScreen, setActiveScreen }) {
  try {
    const navItems = [
      { id: 'membership', label: 'Membership', icon: 'user-plus' },
      { id: 'tokens', label: 'Tokens/Shares', icon: 'coins' },
      { id: 'contributions', label: 'Contributions', icon: 'wallet' },
      { id: 'borrowings', label: 'Borrowings', icon: 'hand-coins' },
      { id: 'repayments', label: 'Repayments', icon: 'banknote' },
      { id: 'interest', label: 'Interest Calculator', icon: 'calculator' },
      { id: 'summary', label: 'Member Summary', icon: 'chart-bar' },
      { id: 'period-transactions', label: 'Period Transactions', icon: 'arrow-right-left' },
      { id: 'admin', label: 'Administration', icon: 'settings' },
      { id: 'reports', label: 'Reports', icon: 'file-text' }
    ];

    return (
      <nav className="bg-white border-b px-4" style={{borderColor: 'var(--border-color)'}} data-name="navigation" data-file="components/Navigation.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 py-4 overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`nav-link flex items-center space-x-2 whitespace-nowrap ${
                  activeScreen === item.id ? 'active' : ''
                }`}
              >
                <div className={`icon-${item.icon} text-lg`}></div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  } catch (error) {
    console.error('Navigation component error:', error);
    return null;
  }
}