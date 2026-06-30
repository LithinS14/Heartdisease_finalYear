    const axios = require('axios');

    const OCR_SPACE_API_KEY = 'K82436867988957';
    const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

    // Parse extracted text to get medical parameters
    const parseParameters = (text) => {
    const result = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find the "Test Value" line which marks the start of values
    const testValueIndex = lines.findIndex(l => l.toLowerCase().includes('test value'));
    
    if (testValueIndex === -1) {
        console.log('[OCR Parser] Could not find "Test Value" header');
        return { result, found: 0 };
    }

    // Extract values that come after "Test Value" header
    const valueLines = lines.slice(testValueIndex + 1);
    console.log('[OCR Parser] Found', valueLines.length, 'values after Test Value');
    
    // Parameters in order: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
    const parameterOrder = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'];
    
    valueLines.forEach((value, index) => {
        if (index < parameterOrder.length && value) {
        const paramName = parameterOrder[index];
        const cleanValue = value.trim();
        
        // Extract numeric value from strings like "65 years", "145 mmHg", etc.
        let extractedValue = cleanValue;
        
        // Try to extract just the number for numeric fields
        if (['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'ca'].includes(paramName)) {
            const numMatch = cleanValue.match(/(\d+\.?\d*)/);
            if (numMatch) {
            extractedValue = numMatch[1];
            }
        }
        
        // Extract first word for yes/no fields
        if (['exang'].includes(paramName)) {
            const yesNoMatch = cleanValue.match(/(yes|no)/i);
            if (yesNoMatch) {
            extractedValue = yesNoMatch[1];
            }
        }
        
        // For categorical fields, keep the value as is
        result[paramName] = extractedValue;
        console.log(`[OCR Parser] [${index}] ${paramName} = ${extractedValue}`);
        }
    });

    return { result, found: Object.keys(result).length };
    };

    // Convert categorical values to numeric for ML model
    const convertToNumeric = (extractedData) => {
    const converted = { ...extractedData };

    // Sex: Male=1, Female=0
    if (converted.sex) {
        converted.sex = converted.sex.toLowerCase() === 'male' ? 1 : 0;
    }

    // CP (Chest Pain Type): Typical Angina=0, Atypical=1, Non-anginal=2, Asymptomatic=3
    if (converted.cp) {
        const cpMap = {
        'typical': 0,
        'typical angina': 0,
        'atypical': 1,
        'non-anginal': 2,
        'non anginal': 2,
        'asymptomatic': 3
        };
        const cpLower = converted.cp.toLowerCase();
        converted.cp = cpMap[cpLower] !== undefined ? cpMap[cpLower] : 0;
    }

    // FBS: >120=1, <120=0, Yes=1, No=0
    if (converted.fbs) {
        const fbsLower = converted.fbs.toLowerCase();
        converted.fbs = fbsLower === '>120' || fbsLower === 'yes' ? 1 : 0;
    }

    // Restecg: Normal=0, ST-T abnormality=1, LV hypertrophy=2
    if (converted.restecg) {
        const restecgMap = {
        'normal': 0,
        'st-t abnormality': 1,
        'st-t': 1,
        'lv hypertrophy': 2,
        'lvh': 2
        };
        const restecgLower = converted.restecg.toLowerCase();
        converted.restecg = restecgMap[restecgLower] !== undefined ? restecgMap[restecgLower] : 0;
    }

    // Exang: Yes=1, No=0
    if (converted.exang) {
        const exangLower = converted.exang.toLowerCase();
        converted.exang = exangLower === 'yes' ? 1 : 0;
    }

    // Slope: Upsloping=0, Flat=1, Downsloping=2
    if (converted.slope) {
        const slopeMap = {
        'upsloping': 0,
        'up': 0,
        'flat': 1,
        'downsloping': 2,
        'down': 2
        };
        const slopeLower = converted.slope.toLowerCase();
        converted.slope = slopeMap[slopeLower] !== undefined ? slopeMap[slopeLower] : 0;
    }

    // Thal: Normal=1, Fixed defect=2, Reversible defect=3
    if (converted.thal) {
        const thalMap = {
        'normal': 1,
        'fixed': 2,
        'fixed defect': 2,
        'reversible': 3,
        'reversible defect': 3
        };
        const thalLower = converted.thal.toLowerCase();
        converted.thal = thalMap[thalLower] !== undefined ? thalMap[thalLower] : 1;
    }

    // Ensure numeric fields are numbers
    ['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'ca'].forEach(field => {
        if (converted[field]) {
        converted[field] = parseFloat(converted[field]);
        }
    });

    console.log('[OCR Converter] Converted values:', converted);
    return converted;
    };

    // Validate extracted data
    const validateExtractedData = (extractedData) => {
    const expectedFields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'];
    const missing = expectedFields.filter(field => !extractedData[field]);
    
    return {
        isValid: missing.length === 0,
        total: expectedFields.length,
        extracted: expectedFields.length - missing.length,
        missing
    };
    };

    // Process document using OCR.space API
    const processOCRDocument = async (buffer, fileType) => {
    try {
        console.log(`[OCR.space] Starting processing for ${fileType} file`);
        console.log(`[OCR.space] Buffer size: ${buffer.length} bytes`);

        // Convert buffer to base64
        const base64 = buffer.toString('base64');
        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/png';

        // Call OCR.space API with form data
        console.log('[OCR.space] Calling OCR.space API...');
        
        // Create form data
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('apikey', OCR_SPACE_API_KEY);
        formData.append('base64Image', `data:${mimeType};base64,${base64}`);
        formData.append('language', 'eng');
        formData.append('filetype', fileType === 'pdf' ? 'PDF' : 'PNG');
        
        const response = await axios.post(OCR_SPACE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 60000
        });

        console.log('[OCR.space] API Response received');
        console.log('[OCR.space] Exit Code:', response.data.OCRExitCode);
        console.log('[OCR.space] Is Errored:', response.data.IsErroredOnProcessing);

        if (response.data.IsErroredOnProcessing) {
        console.error('[OCR.space] API Error:', response.data.ErrorMessage);
        return {
            success: false,
            error: 'OCR.space API error',
            message: 'Failed to process document: ' + response.data.ErrorMessage
        };
        }

        // Extract parsed text from response
        const extractedText = response.data.ParsedResults?.[0]?.ParsedText || '';
        console.log('[OCR.space] Extracted text length:', extractedText.length);
        console.log('[OCR.space] Extracted text preview:', extractedText.substring(0, 500));

        if (!extractedText || extractedText.trim().length === 0) {
        console.error('[OCR.space] No text extracted from document');
        return {
            success: false,
            error: 'Could not extract text',
            message: 'No readable text found in the document'
        };
        }

        // Parse medical parameters from text
        const { result: extractedData, found } = parseParameters(extractedText);
        console.log('[OCR.space] Extracted parameters:', found);
        console.log('[OCR.space] Extracted data:', extractedData);

        // Validate
        const validation = validateExtractedData(extractedData);

        // Convert categorical values to numeric for ML model
        const numericData = convertToNumeric(extractedData);
        console.log('[OCR.space] Numeric data for ML model:', numericData);

        return {
        success: true,
        extractedText,
        extractedData: numericData,
        originalData: extractedData,
        confidence: 85,
        validation,
        message: validation.isValid
            ? 'All medical parameters extracted successfully!'
            : `Extracted ${validation.extracted}/${validation.total} parameters. Missing: ${validation.missing.join(', ')}`
        };
    } catch (error) {
        console.error('[OCR.space] Error:', error.message);
        return {
        success: false,
        error: error.message,
        message: `Failed to process document: ${error.message}`
        };
    }
    };

    module.exports = { processOCRDocument };
