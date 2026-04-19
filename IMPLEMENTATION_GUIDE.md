# Heart Disease Classifier - UPGRADE IMPLEMENTATION GUIDE

## Overview
This guide will help you add the following features to your project:
1. ✅ User Authentication (Sign In / Sign Up)
2. ✅ MongoDB Database Integration
3. ✅ Dashboard with Charts (Past Data Visualization)
4. ✅ User Profile & History
5. ✅ Browser-Based OCR (Tesseract.js)
6. ✅ PDF Generation & Download
7. ✅ Model Performance Optimization

---

## STEP 1: Install Dependencies

### Backend Dependencies (server folder)
Run these commands in the `server` folder:

```bash
npm install mongoose bcryptjs jsonwebtoken dotenv multer pdfkit tesseract.js-core cors
npm install --save-dev nodemon
```

**What each package does:**
- `mongoose` - MongoDB database ORM
- `bcryptjs` - Password encryption
- `jsonwebtoken` - JWT authentication tokens
- `dotenv` - Environment variables management
- `multer` - File upload handling
- `pdfkit` - PDF generation
- `tesseract.js-core` - OCR for server-side (optional)

### Frontend Dependencies (client folder)
Run these commands in the `client` folder:

```bash
npm install react-router-dom axios chart.js tesseract.js jspdf html2canvas
```

**What each package does:**
- `react-router-dom` - Page routing
- `axios` - HTTP requests
- `chart.js` - Charts library
- `tesseract.js` - Browser-based OCR
- `jspdf` - PDF generation in browser
- `html2canvas` - Convert HTML to image for PDF

---

## STEP 2: Create Environment File

Create a `.env` file in the `server` folder:

```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster_name.mongodb.net/database_name
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
PORT=5000
NODE_ENV=development
```

**Replace:**
- `MONGODB_URI` with your MongoDB connection string
- `JWT_SECRET` with any random string (use a long random key)

---

## STEP 3: Create MongoDB Database Models

### Create File: `server/models/User.js`
Store user information and authentication data.

### Create File: `server/models/Reading.js`
Store heart health readings/predictions per user.

### Create File: `server/models/OCRData.js`
Store OCR extracted data with user and timestamp.

---

## STEP 4: Create Backend Routes

### Create File: `server/routes/auth.js`
- `/auth/signup` - Register new user
- `/auth/login` - User login
- `/auth/logout` - User logout

### Update File: `server/routes/predict.js`
- Optimize model loading (load once, not per request)
- Save predictions to database
- Add JWT verification middleware

### Create File: `server/routes/readings.js`
- `/readings` - Get all user readings
- `/readings/:id` - Get specific reading
- `/readings/save` - Save new reading

### Create File: `server/routes/ocr.js`
- `/ocr/history` - Get user's OCR history
- `/ocr/:id` - Get specific OCR result

---

## STEP 5: Create Frontend Pages

### Create File: `client/src/pages/Login.jsx`
- Email and password form
- Validation
- Error handling
- Link to signup

### Create File: `client/src/pages/Signup.jsx`
- User registration form
- Name, email, password input
- Validation
- Age and medical history optional

### Create File: `client/src/pages/Dashboard.jsx`
- Welcome message
- Charts showing past predictions
- Quick stats (average risk, readings count)
- Navigation to other features

### Create File: `client/src/pages/Profile.jsx`
- User information display
- Edit profile option
- Past readings list
- Delete account option

### Create File: `client/src/pages/OCR.jsx`
- File upload area (PDF, PNG, JPG)
- Live OCR processing
- Display extracted data in table
- PDF download of results

### Create File: `client/src/pages/History.jsx`
- All past predictions in table format
- Filter options
- Export to CSV
- Detailed view per reading

### Create File: `client/src/components/Chart.jsx`
- Reusable chart component
- Display trends over time

---

## STEP 6: Update Main App.jsx

Add React Router for navigation between pages:
- Home (Prediction)
- Login
- Signup
- Dashboard
- Profile
- OCR
- History

---

## STEP 7: Model Performance Optimization

### Update: `server/ml/ml_predict.py`
- Load model and scaler ONCE at startup
- Cache predictions for identical inputs
- Use batch processing if available

### Optimization Benefits:
- First prediction: ~2-3 seconds
- Subsequent predictions: ~200-500ms (from cache)

---

## STEP 8: Update Server Configuration

### Update: `server/app.js`
- Add MongoDB connection
- Add authentication middleware
- Register all new routes
- Add error handling

---

## COMPLETE FOLDER STRUCTURE AFTER IMPLEMENTATION

```
project/
├── server/
│   ├── .env (your connection strings)
│   ├── app.js (updated)
│   ├── middleware/
│   │   └── auth.js (JWT verification)
│   ├── models/
│   │   ├── User.js (new)
│   │   ├── Reading.js (new)
│   │   └── OCRData.js (new)
│   ├── routes/
│   │   ├── auth.js (new)
│   │   ├── predict.js (updated & optimized)
│   │   ├── readings.js (new)
│   │   └── ocr.js (new)
│   ├── ml/
│   │   ├── heart_disease_model.keras (keep as-is)
│   │   ├── scaler.pkl (keep as-is)
│   │   ├── ml_predict.py (optimized)
│   │   └── check.py
│   └── package.json (updated)
│
├── client/
│   ├── src/
│   │   ├── App.jsx (with routing)
│   │   ├── pages/
│   │   │   ├── Home.jsx (current prediction)
│   │   │   ├── Login.jsx (new)
│   │   │   ├── Signup.jsx (new)
│   │   │   ├── Dashboard.jsx (new)
│   │   │   ├── Profile.jsx (new)
│   │   │   ├── OCR.jsx (new)
│   │   │   └── History.jsx (new)
│   │   ├── components/
│   │   │   ├── Header.jsx (updated with nav)
│   │   │   ├── Form.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── Chart.jsx (new)
│   │   │   └── ProtectedRoute.jsx (new)
│   │   ├── App.css (updated)
│   │   ├── pages.css (new - styling for pages)
│   │   └── main.jsx
│   └── package.json (updated)
```

---

## QUICK SETUP CHECKLIST

- [ ] Install all backend dependencies
- [ ] Install all frontend dependencies
- [ ] Create `.env` file with MongoDB URI
- [ ] Create all 5 model files (User, Reading, OCRData)
- [ ] Create all 4 route files (auth, readings, ocr, predict update)
- [ ] Create all 7 page components
- [ ] Update App.jsx with React Router
- [ ] Update Header.jsx with navigation
- [ ] Update server/app.js
- [ ] Update ml_predict.py for optimization
- [ ] Test signup/login
- [ ] Test predictions save to DB
- [ ] Test OCR functionality
- [ ] Test dashboard charts

---

## DATABASE SCHEMA

### Users Collection
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  age: Number,
  medicalHistory: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Readings Collection
```
{
  _id: ObjectId,
  userId: ObjectId (reference to User),
  age: Number,
  sex: Number,
  cp: Number,
  trestbps: Number,
  chol: Number,
  fbs: Number,
  restecg: Number,
  thalach: Number,
  exang: Number,
  oldpeak: Number,
  slope: Number,
  ca: Number,
  thal: Number,
  prediction: Number (0 or 1),
  confidence: Number,
  createdAt: Date
}
```

### OCRData Collection
```
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,
  extractedText: String,
  extractedData: Object,
  imageUrl: String,
  pdfUrl: String,
  createdAt: Date
}
```

---

## NEXT STEPS

1. Start with **STEP 1** - Install dependencies
2. Then **STEP 2** - Create .env file
3. Then create the models, routes, and pages as described
4. Test each feature independently
5. Finally, test the complete flow

The detailed code for each file will be provided in the next message!

