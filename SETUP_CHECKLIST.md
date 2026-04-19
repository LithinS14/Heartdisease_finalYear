# Complete Setup Checklist

Follow these steps in order to get your Heart Disease Classifier running!

---

## ✅ PRE-SETUP (Do These First)

### 1. MongoDB Database Setup
- [ ] Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create free account
- [ ] Create new project
- [ ] Create M0 Free cluster
- [ ] Wait for cluster to deploy (5-10 minutes)
- [ ] Click "Connect" button
- [ ] Copy connection string that looks like:
  ```
  mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname
  ```
- [ ] Replace `password` with your actual password
- [ ] Save this string - you'll need it in Step 4

### 2. Generate JWT Secret
- [ ] Open terminal anywhere
- [ ] Run: `openssl rand -base64 32` (or use any random string)
- [ ] Copy the output - you'll need it in Step 4

---

## ⚙️ INSTALLATION & CONFIGURATION

### 3. Install Backend Dependencies
```bash
cd server
npm install
```

**Expected output:**
```
added XX packages in X.XXs
```

### 4. Create .env File
In the `server` folder, create a file named `.env` (exactly like this):

```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/heartdiseasedb
JWT_SECRET=your_random_secret_key_here
PORT=5000
NODE_ENV=development
```

**Replace:**
- `MONGODB_URI` - your connection string from Step 1
- `JWT_SECRET` - your random key from Step 2

### 5. Install Frontend Dependencies
```bash
cd client
npm install
```

**Expected output:**
```
added XX packages in X.XXs
```

---

## 🚀 RUNNING THE APPLICATION

### 6. Start Backend Server
Open terminal, navigate to `server` folder:

```bash
npm run dev
```

**Expected output:**
```
Server running on port 5000
Environment: development
MongoDB URI: Configured
```

✅ If you see "MongoDB connected successfully" - database is working!

### 7. Start Frontend Server
Open NEW terminal, navigate to `client` folder:

```bash
npm run dev
```

**Expected output:**
```
VITE v6.2.0  ready in XXX ms

➜  Local:   http://localhost:5173/
```

Browser should automatically open. If not, visit: `http://localhost:5173`

---

## 🧪 TESTING THE SETUP

### 8. Test Authentication
- [ ] Click "Sign Up"
- [ ] Enter any name, email, password
- [ ] Click "Sign Up" button
- [ ] Should redirect to Dashboard
- [ ] ✅ If successful, auth is working!

### 9. Test Prediction & Database
- [ ] Go to Home page
- [ ] Fill in health parameters
- [ ] Click "Predict"
- [ ] Should get a prediction result
- [ ] Go to Dashboard
- [ ] Your prediction should appear in "Recent Readings"
- [ ] ✅ If visible, database is working!

### 10. Test OCR
- [ ] Go to OCR page
- [ ] Upload an image with text
- [ ] Click "Process OCR"
- [ ] Should extract text from image
- [ ] ✅ If text appears, OCR is working!

### 11. Test History & Charts
- [ ] Go to History page
- [ ] Should see your prediction there
- [ ] Go back to Dashboard
- [ ] Charts should show your data
- [ ] ✅ If visible, charting is working!

---

## 🔍 VERIFICATION CHECKLIST

Check off each item as confirmed:

### Backend
- [ ] Server starts without errors
- [ ] MongoDB connection message appears
- [ ] No error in terminal on startup

### Frontend
- [ ] Page loads without errors
- [ ] Can navigate between pages
- [ ] No console errors (F12)

### Database
- [ ] Can sign up new user
- [ ] Can log in
- [ ] Predictions save to database
- [ ] Data persists after refresh

### Features
- [ ] Dashboard shows data
- [ ] Charts display correctly
- [ ] OCR extracts text
- [ ] PDF downloads work
- [ ] CSV export works
- [ ] History filters work

### UI
- [ ] Pages look good
- [ ] Buttons are clickable
- [ ] Forms accept input
- [ ] Mobile responsive (try resizing browser)

---

## 🆘 TROUBLESHOOTING

### Problem: Backend fails to start
```
Error: Cannot find module 'mongoose'
```
**Solution:** Run `npm install` in server folder again

### Problem: MongoDB connection fails
```
MongoDB connection error: EAUTH Authentication failed
```
**Solution:** 
- Check username/password in MONGODB_URI
- Make sure whitelist includes your IP
- Test connection string format

### Problem: Frontend shows "Cannot reach backend"
```
Error: Network request failed
```
**Solution:**
- Check if backend is running (should see "Server running on port 5000")
- Make sure backend is on `http://localhost:5000`
- Check browser console for exact error

### Problem: OCR not working
```
Error: Cannot load Tesseract
```
**Solution:**
- Try with a clearer image
- Make sure image is not too large
- Clear browser cache (Ctrl+Shift+Delete)

### Problem: Predictions are slow
**Solution:**
- First prediction is slow (2-3 sec) - this is normal
- Subsequent same predictions use cache (200-500ms)
- Python model takes time to load first time

### Problem: Can't login after signup
**Solution:**
- Check email/password are correct (case-sensitive)
- Try signup again with different email
- Check backend logs for error

---

## 🎯 NEXT: CUSTOMIZATION

After everything works, you can customize:

### Colors & Styling
- Edit files in `client/src/styles/`
- Change color values in `:root` variables
- Add custom CSS

### Database
- Add new fields in models (User.js, Reading.js)
- Update forms to match new fields
- Migration: delete old data or update manually

### Features
- Add new health parameters
- Add doctor recommendations
- Add export to PDF with patient info
- Add email notifications

### Deployment
- Deploy backend to Heroku/Railway
- Deploy frontend to Vercel/Netlify
- Set production environment variables

---

## 📞 QUICK REFERENCE

### Important File Locations

**Backend Configuration:**
- `.env` - Database connection & secrets
- `app.js` - Main server file
- `models/` - Database schemas

**Frontend:**
- `App.jsx` - Main app with routes
- `pages/` - All page components
- `styles/` - All CSS styling

**Machine Learning:**
- `server/ml/ml_predict.py` - Prediction script
- `server/ml/heart_disease_model.keras` - Your model
- `server/ml/scaler.pkl` - Data scaler

### Important URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB Atlas: `https://www.mongodb.com/cloud/atlas`
- API Health: `http://localhost:5000/api/health`

### Important Ports

- Frontend: `5173` (Vite)
- Backend: `5000` (Express)
- MongoDB: `27017` (Remote in Atlas)

---

## ✨ SUCCESS CHECKLIST

If you can do all of these, you're ready to go:

- [ ] Start both servers without errors
- [ ] Sign up for new account
- [ ] Make a heart disease prediction
- [ ] See prediction in dashboard
- [ ] View charts with your data
- [ ] Upload document for OCR
- [ ] Export history to CSV
- [ ] Edit your profile
- [ ] Everything loads without console errors

---

## 🎉 CONGRATULATIONS!

If you've completed all items above, your application is fully functional!

**What you now have:**

✅ Full-stack application with authentication
✅ MongoDB database storing user data
✅ Heart disease predictions with ML model
✅ OCR for document text extraction
✅ Beautiful dashboard with charts
✅ User profiles and history
✅ PDF export of documents
✅ CSV export of predictions
✅ Fully optimized for performance
✅ Secure with JWT authentication
✅ Mobile responsive design
✅ Professional UI with pure CSS

---

## 📚 RECOMMENDED NEXT STEPS

1. **Test thoroughly** - Try different health parameters
2. **Customize UI** - Change colors to match your brand
3. **Add features** - Doctor recommendations, more charts, etc.
4. **Deploy** - Put it online so others can use it
5. **Promote** - Share with doctors, hospitals, clinics

---

**If you encounter any issues, check the console output carefully - it usually tells you what's wrong!**

Good luck! 🚀
