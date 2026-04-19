import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const navigate = useNavigate();
  const [readings, setReadings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalReadings: 0,
    diseaseReadings: 0,
    healthyReadings: 0,
    avgConfidence: 0
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchReadings(token);
  }, [navigate]);

  const fetchReadings = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/readings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setReadings(response.data.data.readings);
        setStats(response.data.data.statistics);
      }
    } catch (err) {
      setError('Failed to load readings');
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for confidence trends
  const confidenceData = {
    labels: readings.slice().reverse().map((_, i) => `Reading ${i + 1}`),
    datasets: [
      {
        label: 'Confidence %',
        data: readings.slice().reverse().map(r => r.confidence),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  // Prepare pie chart for disease vs healthy
  const diseaseData = {
    labels: ['Healthy', 'Disease Detected'],
    datasets: [
      {
        data: [stats.healthyReadings, stats.diseaseReadings],
        backgroundColor: [
          'rgba(75, 192, 75, 0.8)',
          'rgba(255, 99, 99, 0.8)'
        ],
        borderColor: [
          'rgb(75, 192, 75)',
          'rgb(255, 99, 99)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading your data...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p>Your Heart Health Dashboard</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalReadings}</div>
          <div className="stat-label">Total Readings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.healthyReadings}</div>
          <div className="stat-label">Healthy Results</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff6363' }}>{stats.diseaseReadings}</div>
          <div className="stat-label">Disease Detected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgConfidence}%</div>
          <div className="stat-label">Average Confidence</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Confidence Trend</h3>
          {readings.length > 0 ? (
            <Line data={confidenceData} options={chartOptions} />
          ) : (
            <p className="no-data">No data to display</p>
          )}
        </div>

        <div className="chart-box">
          <h3>Results Distribution</h3>
          {stats.totalReadings > 0 ? (
            <Pie data={diseaseData} options={chartOptions} />
          ) : (
            <p className="no-data">No data to display</p>
          )}
        </div>
      </div>

      <div className="recent-readings">
        <h3>Recent Readings</h3>
        {readings.length > 0 ? (
          <div className="readings-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Age</th>
                  <th>Blood Pressure</th>
                  <th>Heart Rate</th>
                  <th>Result</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 5).map((reading) => (
                  <tr key={reading._id}>
                    <td>{new Date(reading.createdAt).toLocaleDateString()}</td>
                    <td>{reading.age}</td>
                    <td>{reading.trestbps} mmHg</td>
                    <td>{reading.thalach} bpm</td>
                    <td>
                      <span className={`result-badge ${reading.prediction === 0 ? 'healthy' : 'disease'}`}>
                        {reading.prediction === 0 ? 'Healthy' : 'Disease'}
                      </span>
                    </td>
                    <td>{reading.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No readings yet. Start by taking a prediction.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
