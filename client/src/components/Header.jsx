import React from 'react';

function Header() {
return (
<header className="header">
    <div className="header-content">
    <div className="logo">
        <span className="heart-icon">❤️</span>
        <h1>Heart Disease Classifier</h1>
    </div>
    <p>Predict heart disease risk using machine learning</p>
    </div>
</header>
);
}

export default Header;