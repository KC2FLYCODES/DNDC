import React, { useState } from 'react';
import axios from 'axios';

const FinancialCalculator = ({ api }) => {
  const [activeCalculator, setActiveCalculator] = useState('loan');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Loan Calculator State
  const [loanData, setLoanData] = useState({
    loan_amount: 150000,
    interest_rate: 4.5,
    loan_term_years: 30
  });

  // Income Qualification State
  const [incomeData, setIncomeData] = useState({
    household_size: 2,
    annual_income: 45000
  });

  // Utility Assistance State
  const [utilityData, setUtilityData] = useState({
    household_size: 2,
    monthly_income: 3500,
    utility_type: 'combined',
    monthly_utility_cost: 200
  });

  const calculateLoan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${api}/calculate/loan`, null, {
        params: loanData
      });
      
      setResults(response.data);
    } catch (err) {
      setError('Failed to calculate loan payment');
      console.error('Error calculating loan:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIncomeQualification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${api}/calculate/income-qualification`, null, {
        params: incomeData
      });
      
      setResults(response.data);
    } catch (err) {
      setError('Failed to check income qualification');
      console.error('Error checking qualification:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateUtilityAssistance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${api}/calculate/utility-assistance`, null, {
        params: utilityData
      });
      
      setResults(response.data);
    } catch (err) {
      setError('Failed to calculate utility assistance');
      console.error('Error calculating assistance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderLoanCalculator = () => (
    <div className="calculator-form">
      <h4>Mission 180 Loan Payment Estimator</h4>
      <div className="form-group">
        <label>Loan Amount</label>
        <input
          type="number"
          value={loanData.loan_amount}
          onChange={(e) => setLoanData({...loanData, loan_amount: parseFloat(e.target.value) || 0})}
          min="1000"
          max="500000"
          step="1000"
        />
      </div>
      <div className="form-group">
        <label>Interest Rate (%)</label>
        <input
          type="number"
          value={loanData.interest_rate}
          onChange={(e) => setLoanData({...loanData, interest_rate: parseFloat(e.target.value) || 0})}
          min="0"
          max="15"
          step="0.1"
        />
      </div>
      <div className="form-group">
        <label>Loan Term (Years)</label>
        <select
          value={loanData.loan_term_years}
          onChange={(e) => setLoanData({...loanData, loan_term_years: parseInt(e.target.value)})}
        >
          <option value={15}>15 years</option>
          <option value={20}>20 years</option>
          <option value={25}>25 years</option>
          <option value={30}>30 years</option>
        </select>
      </div>
      <button className="btn-primary" onClick={calculateLoan} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Payment'}
      </button>
      
      {results && results.monthly_payment && (
        <div className="calculation-results">
          <h5>Loan Payment Results</h5>
          <div className="result-item">
            <strong>Monthly Payment:</strong> {formatCurrency(results.monthly_payment)}
          </div>
          <div className="result-item">
            <strong>Total Interest:</strong> {formatCurrency(results.total_interest)}
          </div>
          <div className="result-item">
            <strong>Total Cost:</strong> {formatCurrency(results.total_cost)}
          </div>
        </div>
      )}
    </div>
  );

  const renderIncomeQualification = () => (
    <div className="calculator-form">
      <h4>Income Qualification Checker</h4>
      <div className="form-group">
        <label>Household Size</label>
        <select
          value={incomeData.household_size}
          onChange={(e) => setIncomeData({...incomeData, household_size: parseInt(e.target.value)})}
        >
          {[1,2,3,4,5,6,7,8].map(size => (
            <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Annual Household Income</label>
        <input
          type="number"
          value={incomeData.annual_income}
          onChange={(e) => setIncomeData({...incomeData, annual_income: parseFloat(e.target.value) || 0})}
          min="0"
          max="200000"
          step="1000"
        />
      </div>
      <button className="btn-primary" onClick={checkIncomeQualification} disabled={loading}>
        {loading ? 'Checking...' : 'Check Qualification'}
      </button>
      
      {results && results.qualifies !== undefined && (
        <div className="calculation-results">
          <h5>Qualification Results</h5>
          <div className={`qualification-status ${results.qualifies ? 'qualified' : 'not-qualified'}`}>
            {results.qualifies ? '✅ You Qualify!' : '❌ Income Too High'}
          </div>
          <div className="result-item">
            <strong>Your Income:</strong> {formatCurrency(results.annual_income)}
          </div>
          <div className="result-item">
            <strong>Maximum Allowed:</strong> {formatCurrency(results.max_income_limit)}
          </div>
          <div className="result-item">
            <strong>Area Median Income:</strong> {formatCurrency(results.area_median_income)}
          </div>
          <div className="result-item">
            <strong>Qualification Level:</strong> {results.qualification_percentage}% of limit
          </div>
        </div>
      )}
    </div>
  );

  const renderUtilityAssistance = () => (
    <div className="calculator-form">
      <h4>Utility Assistance Calculator</h4>
      <div className="form-group">
        <label>Household Size</label>
        <select
          value={utilityData.household_size}
          onChange={(e) => setUtilityData({...utilityData, household_size: parseInt(e.target.value)})}
        >
          {[1,2,3,4,5,6,7,8].map(size => (
            <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Monthly Household Income</label>
        <input
          type="number"
          value={utilityData.monthly_income}
          onChange={(e) => setUtilityData({...utilityData, monthly_income: parseFloat(e.target.value) || 0})}
          min="0"
          max="20000"
          step="100"
        />
      </div>
      <div className="form-group">
        <label>Utility Type</label>
        <select
          value={utilityData.utility_type}
          onChange={(e) => setUtilityData({...utilityData, utility_type: e.target.value})}
        >
          <option value="electric">Electric Only</option>
          <option value="gas">Gas Only</option>
          <option value="water">Water Only</option>
          <option value="combined">Combined Utilities</option>
        </select>
      </div>
      <div className="form-group">
        <label>Monthly Utility Cost</label>
        <input
          type="number"
          value={utilityData.monthly_utility_cost}
          onChange={(e) => setUtilityData({...utilityData, monthly_utility_cost: parseFloat(e.target.value) || 0})}
          min="0"
          max="1000"
          step="10"
        />
      </div>
      <button className="btn-primary" onClick={calculateUtilityAssistance} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Assistance'}
      </button>
      
      {results && results.assistance_amount !== undefined && (
        <div className="calculation-results">
          <h5>Assistance Results</h5>
          <div className="result-item">
            <strong>Monthly Assistance:</strong> {formatCurrency(results.assistance_amount)}
          </div>
          <div className="result-item">
            <strong>Assistance Percentage:</strong> {results.assistance_percentage}%
          </div>
          <div className="result-item">
            <strong>Your Monthly Cost After Assistance:</strong> {formatCurrency(results.monthly_utility_cost - results.assistance_amount)}
          </div>
          {results.assistance_amount > 0 && (
            <div className="assistance-note">
              💡 You may be eligible for utility assistance programs. Contact DNDC for more information.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="financial-calculator">
      <h3>Financial Calculators</h3>
      
      <div className="calculator-tabs">
        <button 
          className={`calculator-tab ${activeCalculator === 'loan' ? 'active' : ''}`}
          onClick={() => {setActiveCalculator('loan'); setResults(null); setError(null);}}
        >
          💰 Loan Calculator
        </button>
        <button 
          className={`calculator-tab ${activeCalculator === 'income' ? 'active' : ''}`}
          onClick={() => {setActiveCalculator('income'); setResults(null); setError(null);}}
        >
          📊 Income Check
        </button>
        <button 
          className={`calculator-tab ${activeCalculator === 'utility' ? 'active' : ''}`}
          onClick={() => {setActiveCalculator('utility'); setResults(null); setError(null);}}
        >
          💡 Utility Help
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="calculator-content">
        {activeCalculator === 'loan' && renderLoanCalculator()}
        {activeCalculator === 'income' && renderIncomeQualification()}
        {activeCalculator === 'utility' && renderUtilityAssistance()}
      </div>
    </div>
  );
};

export default FinancialCalculator;