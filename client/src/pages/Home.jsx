    import React, { useState } from 'react';
    import { Link } from 'react-router-dom';
    import Header from '../components/Header';
    import Form from '../components/Form';
    import Result from '../components/Result';
    import '../App.css';
    import '../styles/home.css';

    function Home() {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
        <div className="home-page">
        <Header />
        <div className="container">
            <div className="hero-section">
            <h2 className="hero-title">Quick Health Assessment</h2>
            <p className="hero-subtitle">Get an instant prediction about your heart health</p>
            </div>

            <div className="main-content">
            <div className="form-container">
                <h2>Health Parameters</h2>
                <p className="subtitle">Enter your health information to get a prediction</p>
                <Form 
                setPrediction={setPrediction} 
                setLoading={setLoading} 
                setError={setError} 
                />
            </div>
            <div className="result-container">
                <h2>{loading ? 'Processing...' : 'Prediction Result'}</h2>
                <p className="subtitle">
                {loading ? 'Analyzing your data...' : 'Your heart health assessment'}
                </p>
                {loading ? (
                <div className="loading">
                    <div className="loader"></div>
                    <p>Processing your health data...</p>
                </div>
                ) : (
                <Result prediction={prediction} error={error} />
                )}
            </div>
            </div>

            <div className="home-cta-section">
            <h3>Want to track your health over time?</h3>
            <p>Create an account to save your predictions and view detailed analytics</p>
            <div className="cta-buttons">
                <Link to="/signup" className="cta-button primary">Create Account</Link>
                <Link to="/login" className="cta-button secondary">Sign In</Link>
            </div>
            </div>
        </div>
        </div>
    );
    }

    export default Home;
