    import React, { useState } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import '../styles/navbar.css';

    function Navbar({ isAuthenticated, user, onLogout }) {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        onLogout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
        <div className="navbar-container">
            <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
            <span className="logo-icon">❤️</span>
            <span className="logo-text">HealthCheck</span>
            </Link>

            <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="navbar-link" onClick={closeMobileMenu}>
                Home
            </Link>

            {isAuthenticated ? (
                <>
                <Link to="/dashboard" className="navbar-link" onClick={closeMobileMenu}>
                    Dashboard
                </Link>
                <Link to="/history" className="navbar-link" onClick={closeMobileMenu}>
                    History
                </Link>
                <Link to="/ocr" className="navbar-link" onClick={closeMobileMenu}>
                    OCR
                </Link>
                <div className="navbar-user">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <Link to="/profile" className="navbar-link profile-link" onClick={closeMobileMenu}>
                    Profile
                    </Link>
                    <button className="navbar-button logout-btn" onClick={handleLogout}>
                    Logout
                    </button>
                </div>
                </>
            ) : (
                <>
                <Link to="/login" className="navbar-link" onClick={closeMobileMenu}>
                    Login
                </Link>
                <Link to="/signup" className="navbar-link signup-link" onClick={closeMobileMenu}>
                    Sign Up
                </Link>
                </>
            )}
            </div>

            <div className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
            </div>
        </div>
        </nav>
    );
    }

    export default Navbar;
