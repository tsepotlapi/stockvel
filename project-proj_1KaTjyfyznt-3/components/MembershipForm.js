function MembershipForm({ onMemberAdded }) {
  try {
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      phone: '',
      address: '',
      nationalId: '',
      shares: 1
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        setMessage('Name is required');
        return;
      }

      setIsSubmitting(true);
      try {
        await trickleCreateObject('member', {
          ...formData,
          dateJoined: new Date().toISOString(),
          status: 'active',
          totalContributions: 0,
          totalBorrowings: 0,
          totalRepayments: 0,
          outstandingBalance: 0
        });

        setMessage('Member registered successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          nationalId: '',
          shares: 1
        });
        
        if (onMemberAdded) onMemberAdded();
      } catch (error) {
        setMessage('Failed to register member. Please try again.');
      }
      setIsSubmitting(false);
    };

    return (
      <div className="max-w-2xl mx-auto" data-name="membership-form" data-file="components/MembershipForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--primary-color)'}}>
            Member Registration
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Full Name *
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter member's full name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Address
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter member's address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  National ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  placeholder="Enter ID number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Initial Shares
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={formData.shares}
                  onChange={(e) => setFormData({...formData, shares: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Registering...' : 'Register Member'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MembershipForm component error:', error);
    return null;
  }
}