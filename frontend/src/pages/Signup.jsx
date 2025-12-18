import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiBriefcase } from 'react-icons/fi';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.signup(formData);
      const { data } = response.data;
      login(data, data.token);
      toast.success('Account created successfully!');
      
      if (data.isFirstLogin) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h2>
            <p className="text-secondary-600">Start tracking your machine production</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="label">
                <FiUser className="inline mr-2" />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                <FiMail className="inline mr-2" />
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                <FiLock className="inline mr-2" />
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="companyName" className="label">
                <FiBriefcase className="inline mr-2" />
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="input"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={handleChange}
              />
              <p className="mt-2 text-sm text-secondary-500">
                Multiple users from the same company can use the same company name
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
