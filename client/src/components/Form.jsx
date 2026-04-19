import React, { useState } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

function Form({ setPrediction, setLoading, setError }) {
const [formData, setFormData] = useState({
age: 45,
sex: 1,
cp: 0,
trestbps: 120,
chol: 200,
fbs: 0,
restecg: 0,
thalach: 150,
exang: 0,
oldpeak: 0,
slope: 0,
ca: 0,
thal: 1
});

const [ocrFile, setOcrFile] = useState(null);
const [ocrProcessing, setOcrProcessing] = useState(false);
const [ocrPreview, setOcrPreview] = useState(null);

const handleChange = (e) => {
const { name, value } = e.target;
setFormData({
    ...formData,
    [name]: name === 'oldpeak' ? parseFloat(value) : parseInt(value)
});
};

const handleOCRFileSelect = (e) => {
const selectedFile = e.target.files[0];
if (selectedFile) {
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfType = 'application/pdf';
    
    if (!validImageTypes.includes(selectedFile.type) && selectedFile.type !== validPdfType) {
        setError('Please upload a valid image (PNG, JPG, GIF, WebP) or PDF file');
        return;
    }
    
    setOcrFile(selectedFile);
    setError(null);
    
    // Create preview - only for images, PDFs will show file name
    if (validImageTypes.includes(selectedFile.type)) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setOcrPreview(event.target.result);
        };
        reader.readAsDataURL(selectedFile);
    } else {
        // For PDF, just show file name (no preview)
        setOcrPreview(null);
    }
}
};

const handleProcessOCR = async () => {
if (!ocrFile) {
    setError('Please select a file first');
    return;
}

setOcrProcessing(true);
setError(null);

try {
    // Check if file is PDF or image
    const isPDF = ocrFile.type === 'application/pdf';
    
    if (isPDF) {
        // For PDF files, use server-side OCR
        await handlePDFProcessing();
    } else {
        // For image files, use Tesseract.js
        await handleImageProcessing();
    }
    
    // Clear OCR section after extraction
    setOcrFile(null);
    setOcrPreview(null);
    
} catch (err) {
    console.error('[v0] OCR error:', err);
    setError('OCR processing failed: ' + (err.message || 'Unknown error. Please try again.'));
} finally {
    setOcrProcessing(false);
}
};

const handleImageProcessing = async () => {
return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
    try {
        const imageData = event.target.result;
        console.log('[v0] Processing image with Tesseract...');
        
        // Process with Tesseract
        const result = await Tesseract.recognize(
        imageData,
        'eng',
        { 
            logger: m => {
            console.log('[Tesseract]', m.status, Math.round(m.progress * 100) + '%');
            }
        }
        );

        const extractedText = result.data.text;
        console.log('[v0] Image OCR completed. Extracted text length:', extractedText.length);
        console.log('[v0] Extracted text preview:', extractedText.substring(0, 200));
        
        // Parse the extracted text to fill form fields
        parseAndFillForm(extractedText);
        resolve();
        
    } catch (err) {
        reject(new Error('Image OCR processing failed: ' + (err.message || 'Unknown error')));
    }
    };
    
    reader.onerror = () => {
    reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(ocrFile);
});
};

const handlePDFProcessing = async () => {
console.log('[v0] Processing PDF file...');

try {
    // Set worker for pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const fileReader = new FileReader();
    
    fileReader.onload = async (event) => {
        try {
            const pdfData = event.target.result;
            console.log('[v0] PDF file loaded, extracting text...');
            
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let extractedText = '';
            
            console.log('[v0] PDF has', pdf.numPages, 'pages');
            
            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                extractedText += pageText + '\n';
                console.log('[v0] Extracted page', pageNum);
            }
            
            console.log('[v0] PDF text extraction complete. Total text length:', extractedText.length);
            console.log('[v0] Text preview:', extractedText.substring(0, 300));
            
            // Parse extracted text and fill form
            parseAndFillForm(extractedText);
            
        } catch (err) {
            throw new Error('Failed to extract text from PDF: ' + (err.message || 'Unknown error'));
        }
    };
    
    fileReader.onerror = () => {
        throw new Error('Failed to read PDF file');
    };
    
    fileReader.readAsArrayBuffer(ocrFile);
    
} catch (err) {
    console.error('[v0] PDF processing error:', err);
    throw err;
}
};

const parseAndFillForm = (text) => {
console.log('[v0] parseAndFillForm called with text length:', text.length);
console.log('[v0] Text preview:', text.substring(0, 500));

const updates = {};

// Strategy 1: Try to match table format (Parameter | Value)
const tablePatterns = {
    age: {
        name: 'Age',
        regex: /Age\s+(\d+)\s*years/i,
        convert: (val) => parseInt(val)
    },
    sex: {
        name: 'Sex',
        regex: /Sex\s+(Male|Female)/i,
        convert: (val) => val.toLowerCase() === 'female' ? 0 : 1
    },
    cp: {
        name: 'CP',
        regex: /CP\s+(Typical\s+Angina|Atypical|Non-anginal|Asymptomatic)/i,
        convert: (val) => {
            if (val.match(/typical/i)) return 0;
            if (val.match(/atypical/i)) return 1;
            if (val.match(/non-anginal/i)) return 2;
            if (val.match(/asymptomatic/i)) return 3;
            return parseInt(val);
        }
    },
    trestbps: {
        name: 'Blood Pressure',
        regex: /Blood\s+Pressure\s+(\d+)\s*mm/i,
        convert: (val) => parseInt(val)
    },
    chol: {
        name: 'Cholesterol',
        regex: /Cholesterol\s+(\d+)\s*mg/i,
        convert: (val) => parseInt(val)
    },
    fbs: {
        name: 'FBS',
        regex: /FBS\s+([><=]*\d+)\s*mg/i,
        convert: (val) => val.includes('>') || parseInt(val) > 120 ? 1 : 0
    },
    restecg: {
        name: 'Restecg',
        regex: /Restecg\s+(ST-T\s+abnormality|Normal|LV\s+Hypertrophy)/i,
        convert: (val) => {
            if (val.match(/st-t|abnormality/i)) return 1;
            if (val.match(/lv|hypertrophy/i)) return 2;
            return 0;
        }
    },
    thalach: {
        name: 'Thalach',
        regex: /Thalach\s+(\d+)\s*bpm/i,
        convert: (val) => parseInt(val)
    },
    exang: {
        name: 'Exang',
        regex: /Exang\s+(Yes|No)/i,
        convert: (val) => val.toLowerCase() === 'yes' ? 1 : 0
    },
    oldpeak: {
        name: 'Oldpeak',
        regex: /Oldpeak\s+([\d.]+)\s*mm/i,
        convert: (val) => parseFloat(val)
    },
    slope: {
        name: 'Slope',
        regex: /Slope\s+(Upsloping|Flat|Downsloping)/i,
        convert: (val) => {
            if (val.match(/upsloping/i)) return 0;
            if (val.match(/flat/i)) return 1;
            if (val.match(/downsloping/i)) return 2;
            return parseInt(val);
        }
    },
    ca: {
        name: 'CA',
        regex: /CA\s+(\d+)\s*vessels/i,
        convert: (val) => parseInt(val)
    },
    thal: {
        name: 'Thal',
        regex: /Thal\s+(Normal|Fixed\s+defect|Reversible\s+defect)/i,
        convert: (val) => {
            if (val.match(/normal/i)) return 0;
            if (val.match(/fixed/i)) return 1;
            if (val.match(/reversible/i)) return 2;
            return parseInt(val);
        }
    }
};

// Try table format matching
Object.keys(tablePatterns).forEach(key => {
    const pattern = tablePatterns[key];
    const match = text.match(pattern.regex);
    if (match) {
        try {
            const value = match[1];
            console.log(`[v0] Found ${key}: "${value}"`);
            updates[key] = pattern.convert(value);
            console.log(`[v0] Converted ${key} to: ${updates[key]}`);
        } catch (err) {
            console.error(`[v0] Error converting ${key}:`, err);
        }
    }
});

console.log('[v0] Extracted fields:', Object.keys(updates).length);
console.log('[v0] Extracted values:', updates);

if (Object.keys(updates).length > 0) {
    setFormData(prev => ({ ...prev, ...updates }));
    console.log(`[v0] Successfully extracted ${Object.keys(updates).length} fields from OCR`);
    setError(null);
} else {
    console.error('[v0] No fields matched. Text content:', text);
    setError('Could not extract health data from the report. Please ensure the PDF contains a readable medical report with the required parameters.');
}
};

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setPrediction(null);
setError(null);

try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    // Add token to headers if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post('http://localhost:5000/api/predict', formData, { headers });
    
    if (response.data.success) {
        setPrediction(response.data);
    } else {
        setError(response.data.message || 'Prediction failed. Please try again.');
    }
} catch (error) {
    console.error('[v0] Error in prediction:', error);
    console.error('[v0] Error response:', error.response?.data);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to process your data. Please try again.';
    setError(errorMessage);
} finally {
    setLoading(false);
}
};

// Helper function to create form field descriptions
const getFieldDescription = (field) => {
const descriptions = {
    age: 'Your age in years',
    sex: 'Gender (1 = male, 0 = female)',
    cp: 'Chest pain type (0 = typical angina, 1 = atypical angina, 2 = non-anginal pain, 3 = asymptomatic)',
    trestbps: 'Resting blood pressure in mm Hg',
    chol: 'Serum cholesterol in mg/dl',
    fbs: 'Fasting blood sugar > 120 mg/dl (1 = true, 0 = false)',
    restecg: 'Resting electrocardiographic results (0 = normal, 1 = ST-T wave abnormality, 2 = left ventricular hypertrophy)',
    thalach: 'Maximum heart rate achieved',
    exang: 'Exercise induced angina (1 = yes, 0 = no)',
    oldpeak: 'ST depression induced by exercise relative to rest',
    slope: 'Slope of the peak exercise ST segment (0 = upsloping, 1 = flat, 2 = downsloping)',
    ca: 'Number of major vessels colored by fluoroscopy (0-4)',
    thal: 'Thalassemia (0 = normal, 1 = fixed defect, 2 = reversible defect, 3 = unknown)'
};
return descriptions[field] || '';
};

return (
<form className="heart-form" onSubmit={handleSubmit}>
    <div className="ocr-upload-section">
    <div className="ocr-header">
        <h3>Extract Data from Report</h3>
        <p>Upload a medical report or image to auto-fill the form</p>
    </div>
    
    <div className="ocr-input-wrapper">
        <input
        type="file"
        id="ocr-file-input"
        onChange={handleOCRFileSelect}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        />
        <label htmlFor="ocr-file-input" className="ocr-file-label">
        {ocrFile ? (
            <div className="ocr-file-preview">
            {ocrPreview ? (
                <>
                <img src={ocrPreview} alt="preview" className="ocr-preview-img" />
                <span className="ocr-file-name">{ocrFile.name}</span>
                </>
            ) : (
                <>
                <span className="ocr-pdf-icon">📋</span>
                <span className="ocr-file-name">{ocrFile.name}</span>
                <small className="ocr-file-size">{(ocrFile.size / 1024).toFixed(1)} KB</small>
                </>
            )}
            </div>
        ) : (
            <div className="ocr-upload-placeholder">
            <span className="ocr-upload-icon">📄</span>
            <span>Click to upload report or drag and drop</span>
            <small>PNG, JPG, GIF or PDF</small>
            </div>
        )}
        </label>
        
        {ocrFile && (
        <div className="ocr-actions">
            <button
            type="button"
            className="ocr-extract-btn"
            onClick={handleProcessOCR}
            disabled={ocrProcessing}
            >
            {ocrProcessing ? 'Extracting...' : 'Extract Data'}
            </button>
            <button
            type="button"
            className="ocr-cancel-btn"
            onClick={() => {
                setOcrFile(null);
                setOcrPreview(null);
            }}
            disabled={ocrProcessing}
            >
            Cancel
            </button>
        </div>
        )}
    </div>
    </div>

    <div className="form-grid">
    <div className="form-group">
        <label htmlFor="age">
        Age
        <span className="tooltip" data-tooltip={getFieldDescription('age')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="age"
        name="age"
        value={formData.age}
        onChange={handleChange}
        min="1"
        max="120"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="sex">
        Sex
        <span className="tooltip" data-tooltip={getFieldDescription('sex')}>ⓘ</span>
        </label>
        <select
        id="sex"
        name="sex"
        value={formData.sex}
        onChange={handleChange}
        required
        >
        <option value="0">Female</option>
        <option value="1">Male</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="cp">
        Chest Pain Type
        <span className="tooltip" data-tooltip={getFieldDescription('cp')}>ⓘ</span>
        </label>
        <select
        id="cp"
        name="cp"
        value={formData.cp}
        onChange={handleChange}
        required
        >
        <option value="0">Typical Angina</option>
        <option value="1">Atypical Angina</option>
        <option value="2">Non-anginal Pain</option>
        <option value="3">Asymptomatic</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="trestbps">
        Resting Blood Pressure
        <span className="tooltip" data-tooltip={getFieldDescription('trestbps')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="trestbps"
        name="trestbps"
        value={formData.trestbps}
        onChange={handleChange}
        min="50"
        max="300"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="chol">
        Cholesterol
        <span className="tooltip" data-tooltip={getFieldDescription('chol')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="chol"
        name="chol"
        value={formData.chol}
        onChange={handleChange}
        min="100"
        max="600"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="fbs">
        Fasting Blood Sugar
        <span className="tooltip" data-tooltip={getFieldDescription('fbs')}>ⓘ</span>
        </label>
        <select
        id="fbs"
        name="fbs"
        value={formData.fbs}
        onChange={handleChange}
        required
        >
        <option value="0">False</option>
        <option value="1">True</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="restecg">
        Resting ECG
        <span className="tooltip" data-tooltip={getFieldDescription('restecg')}>ⓘ</span>
        </label>
        <select
        id="restecg"
        name="restecg"
        value={formData.restecg}
        onChange={handleChange}
        required
        >
        <option value="0">Normal</option>
        <option value="1">ST-T Wave Abnormality</option>
        <option value="2">Left Ventricular Hypertrophy</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="thalach">
        Max Heart Rate
        <span className="tooltip" data-tooltip={getFieldDescription('thalach')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="thalach"
        name="thalach"
        value={formData.thalach}
        onChange={handleChange}
        min="50"
        max="250"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="exang">
        Exercise Induced Angina
        <span className="tooltip" data-tooltip={getFieldDescription('exang')}>ⓘ</span>
        </label>
        <select
        id="exang"
        name="exang"
        value={formData.exang}
        onChange={handleChange}
        required
        >
        <option value="0">No</option>
        <option value="1">Yes</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="oldpeak">
        ST Depression
        <span className="tooltip" data-tooltip={getFieldDescription('oldpeak')}>ⓘ</span>
        </label>
        <input
        type="number"
        id="oldpeak"
        name="oldpeak"
        value={formData.oldpeak}
        onChange={handleChange}
        min="0"
        max="10"
        step="0.1"
        required
        />
    </div>

    <div className="form-group">
        <label htmlFor="slope">
        Slope
        <span className="tooltip" data-tooltip={getFieldDescription('slope')}>ⓘ</span>
        </label>
        <select
        id="slope"
        name="slope"
        value={formData.slope}
        onChange={handleChange}
        required
        >
        <option value="0">Upsloping</option>
        <option value="1">Flat</option>
        <option value="2">Downsloping</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="ca">
        Number of Major Vessels
        <span className="tooltip" data-tooltip={getFieldDescription('ca')}>ⓘ</span>
        </label>
        <select
        id="ca"
        name="ca"
        value={formData.ca}
        onChange={handleChange}
        required
        >
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        </select>
    </div>

    <div className="form-group">
        <label htmlFor="thal">
        Thalassemia
        <span className="tooltip" data-tooltip={getFieldDescription('thal')}>ⓘ</span>
        </label>
        <select
        id="thal"
        name="thal"
        value={formData.thal}
        onChange={handleChange}
        required
        >
        <option value="0">Normal</option>
        <option value="1">Fixed Defect</option>
        <option value="2">Reversible Defect</option>
        <option value="3">Unknown</option>
        </select>
    </div>
    </div>

    <button type="submit" className="submit-button">
    Predict Heart Disease
    </button>
</form>
);
}

export default Form;
