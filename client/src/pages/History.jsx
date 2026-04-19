import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/history.css';

function History() {
  const navigate = useNavigate();
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReading, setSelectedReading] = useState(null);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    prediction: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReadings(token);
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [readings, filters]);

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
      }
    } catch (err) {
      setError('Failed to load readings');
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...readings];

    // Filter by risk level
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(r => r.riskLevel === filters.riskLevel);
    }

    // Filter by prediction
    if (filters.prediction !== 'all') {
      const predValue = parseInt(filters.prediction);
      filtered = filtered.filter(r => r.prediction === predValue);
    }

    // Sort
    if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filters.sortBy === 'confidence') {
      filtered.sort((a, b) => b.confidence - a.confidence);
    }

    setFilteredReadings(filtered);
  };

  const handleDeleteReading = async (readingId) => {
    if (window.confirm('Are you sure you want to delete this reading?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/readings/${readingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          setReadings(readings.filter(r => r._id !== readingId));
          setSelectedReading(null);
          alert('Reading deleted successfully');
        }
      } catch (err) {
        alert('Failed to delete reading');
        console.error('Error deleting reading:', err);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredReadings.length === 0) {
      alert('No data to export');
      return;
    }

    let csv = 'Date,Age,Sex,Chest Pain,Blood Pressure,Cholesterol,Heart Rate,Result,Confidence,Risk Level\n';

    filteredReadings.forEach(r => {
      csv += `"${new Date(r.createdAt).toLocaleDateString()}",${r.age},"${r.sex === 1 ? 'Male' : 'Female'}",${r.cp},${r.trestbps},${r.chol},${r.thalach},"${r.prediction === 0 ? 'Healthy' : 'Disease'}",${r.confidence}%,${r.riskLevel}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readings_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="history-loading">Loading your history...</div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Reading History</h1>
        <p>View and manage all your heart health readings</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="history-controls">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="riskLevel">Risk Level:</label>
            <select 
              id="riskLevel"
              value={filters.riskLevel}
              onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            >
              <option value="all">All Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="prediction">Result:</label>
            <select 
              id="prediction"
              value={filters.prediction}
              onChange={(e) => setFilters({...filters, prediction: e.target.value})}
            >
              <option value="all">All Results</option>
              <option value="0">Healthy</option>
              <option value="1">Disease Detected</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Sort By:</label>
            <select 
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>
          </div>
        </div>

        <button className="export-button" onClick={handleExportCSV}>
          📥 Export CSV
        </button>
      </div>

      <div className="history-content">
        <div className="readings-list">
          {filteredReadings.length > 0 ? (
            <div className="readings-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Age</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Cholesterol</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Risk</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.map((reading) => (
                    <tr 
                      key={reading._id}
                      onClick={() => setSelectedReading(reading)}
                      className={selectedReading?._id === reading._id ? 'active' : ''}
                    >
                      <td>{new Date(reading.createdAt).toLocaleDateString()}</td>
                      <td>{reading.age}</td>
                      <td>{reading.trestbps}</td>
                      <td>{reading.thalach}</td>
                      <td>{reading.chol}</td>
                      <td>
                        <span className={`badge ${reading.prediction === 0 ? 'healthy' : 'disease'}`}>
                          {reading.prediction === 0 ? 'Healthy' : 'Disease'}
                        </span>
                      </td>
                      <td>{reading.confidence}%</td>
                      <td>
                        <span className={`risk-badge ${reading.riskLevel.toLowerCase()}`}>
                          {reading.riskLevel}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReading(reading._id);
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-readings">No readings match your filters</p>
          )}
        </div>

        {selectedReading && (
          <div className="reading-detail">
            <h3>Reading Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Date</label>
                <p>{new Date(selectedReading.createdAt).toLocaleString()}</p>
              </div>
              <div className="detail-item">
                <label>Age</label>
                <p>{selectedReading.age} years</p>
              </div>
              <div className="detail-item">
                <label>Sex</label>
                <p>{selectedReading.sex === 1 ? 'Male' : 'Female'}</p>
              </div>
              <div className="detail-item">
                <label>Chest Pain Type</label>
                <p>{selectedReading.cp}</p>
              </div>
              <div className="detail-item">
                <label>Resting Blood Pressure</label>
                <p>{selectedReading.trestbps} mmHg</p>
              </div>
              <div className="detail-item">
                <label>Serum Cholesterol</label>
                <p>{selectedReading.chol} mg/dl</p>
              </div>
              <div className="detail-item">
                <label>Max Heart Rate</label>
                <p>{selectedReading.thalach} bpm</p>
              </div>
              <div className="detail-item">
                <label>Exercise Induced Angina</label>
                <p>{selectedReading.exang === 1 ? 'Yes' : 'No'}</p>
              </div>
              <div className="detail-item">
                <label>ST Depression</label>
                <p>{selectedReading.oldpeak}</p>
              </div>
              <div className="detail-item">
                <label>Result</label>
                <p className={selectedReading.prediction === 0 ? 'healthy' : 'disease'}>
                  {selectedReading.prediction === 0 ? '✓ Healthy' : '⚠ Disease Detected'}
                </p>
              </div>
              <div className="detail-item">
                <label>Confidence</label>
                <p>{selectedReading.confidence}%</p>
              </div>
              <div className="detail-item">
                <label>Risk Level</label>
                <p className={`risk-${selectedReading.riskLevel.toLowerCase()}`}>
                  {selectedReading.riskLevel}
                </p>
              </div>
            </div>

            {selectedReading.notes && (
              <div className="detail-notes">
                <label>Notes</label>
                <p>{selectedReading.notes}</p>
              </div>
            )}

            <button 
              className="delete-reading-btn"
              onClick={() => handleDeleteReading(selectedReading._id)}
            >
              Delete This Reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
