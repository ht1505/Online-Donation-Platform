function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || '');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setError('');
    setSuccess('');
  };

  const decoded = token ? jwt_decode(token) : null;
  const email = decoded ? decoded.email : '';

  if (!token) return <Login setToken={setToken} error={error} setError={setError} />;
  if (token === 'register') return <Register setToken={setToken} error={error} setError={setError} success={success} setSuccess={setSuccess} />;
  return <Dashboard email={email} setToken={setToken} handleLogout={handleLogout} error={error} setError={setError} success={success} setSuccess={setSuccess} />;
}

function Login({ setToken, error, setError }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async () => {
    if (!email.includes('@') || password.length < 6) {
      setError('Invalid email or password (min 6 characters)');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold text-yellow-400 text-center mb-6">Login</h1>
      <div className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        />
        <button onClick={handleLogin} className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600">Login</button>
        <p className="text-red-500">{error}</p>
        <p className="text-center">
          Not registered? <a href="#" onClick={() => setToken('register')} className="text-yellow-400">Register</a>
        </p>
      </div>
    </div>
  );
}

function Register({ setToken, error, setError, success, setSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleRegister = async () => {
    if (!email.includes('@') || password.length < 6) {
      setError('Invalid email or password (min 6 characters)');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/register', { email, password });
      setSuccess('Registration successful! Please login.');
      setError('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setSuccess('');
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold text-yellow-400 text-center mb-6">Register</h1>
      <div className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        />
        <button onClick={handleRegister} className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600">Register</button>
        <p className="text-red-500">{error}</p>
        <p className="text-green-500">{success}</p>
        <p className="text-center">
          Already registered? <a href="#" onClick={() => setToken('')} className="text-yellow-400">Login</a>
        </p>
      </div>
    </div>
  );
}

function Dashboard({ email, setToken, handleLogout, error, setError, success, setSuccess }) {
  const [amount, setAmount] = React.useState('');
  const [campaign, setCampaign] = React.useState('education');
  const [donations, setDonations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/donations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setDonations(response.data);
        setError('');
      } catch (err) {
        setError('Failed to fetch donations');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const handleDonate = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/donate', { amount: amountNum, campaign }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Donation successful!');
      setError('');
      setAmount('');
      const response = await axios.get('http://localhost:3000/api/donations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDonations(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Donation failed');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold text-yellow-400 text-center mb-6">Welcome, {email}</h1>
      <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded hover:bg-red-600 mb-4">Logout</button>
      <h2 className="text-xl font-semibold text-yellow-400 mb-4">Make a Donation</h2>
      <div className="flex flex-col gap-4 mb-6">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Donation Amount"
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        />
        <select
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className="p-2 border border-gray-600 rounded bg-gray-800 text-white"
        >
          <option value="education">Education Fund</option>
          <option value="healthcare">Healthcare Fund</option>
          <option value="environment">Environment Fund</option>
        </select>
        <button onClick={handleDonate} disabled={loading} className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-500">
          {loading ? 'Processing...' : 'Donate'}
        </button>
        <p className="text-red-500">{error}</p>
        <p className="text-green-500">{success}</p>
      </div>
      <h2 className="text-xl font-semibold text-yellow-400 mb-4">Donation History</h2>
      {loading ? (
        <p className="text-white">Loading donations...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-600 p-2">Amount</th>
              <th className="border border-gray-600 p-2">Campaign</th>
              <th className="border border-gray-600 p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-600 p-2">{donation.amount}</td>
                <td className="border border-gray-600 p-2">{donation.campaign}</td>
                <td className="border border-gray-600 p-2">{new Date(donation.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}