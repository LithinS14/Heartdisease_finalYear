import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/ocr.css';

function OCR() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [ocrHistory, setOcrHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOCRHistory(token);
  }, [navigate]);

  const fetchOCRHistory = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/ocr/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOcrHistory(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching OCR history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setExtractedText('');
      setSelectedHistory(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcessOCR = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Convert file to base64 for image processing
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageData = event.target.result;

          // Process with Tesseract
          const { data } = await Tesseract.recognize(
            imageData,
            'eng',
            { logger: m => console.log('[Tesseract]', m.status, m.progress) }
          );

          setExtractedText(data.text);
          setConfidence(Math.round(data.confidence));
        } catch (err) {
          setError('OCR processing failed: ' + err.message);
          console.error('OCR error:', err);
        } finally {
          setProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing file: ' + err.message);
      setProcessing(false);
    }
  };

  const handleSaveOCR = async () => {
    if (!extractedText) {
      setError('No text to save. Please process an image first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/ocr/save',
        {
          fileName: file?.name || 'untitled',
          fileType: file?.type.includes('pdf') ? 'pdf' : 'image',
          extractedText,
          imageData: preview,
          confidence
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOcrHistory([response.data.data, ...ocrHistory]);
        alert('OCR data saved successfully!');
      }
    } catch (err) {
      setError('Failed to save OCR data: ' + err.message);
      console.error('Error saving OCR:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!extractedText) {
      setError('No text to export. Please process an image first.');
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(16);
      pdf.text('OCR Extraction Report', margin, margin + 5);

      // Add metadata
      pdf.setFontSize(10);
      pdf.text(`File: ${file?.name || 'Unknown'}`, margin, margin + 15);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 22);
      pdf.text(`Confidence: ${confidence}%`, margin, margin + 29);

      // Add extracted text
      pdf.setFontSize(11);
      const splitText = pdf.splitTextToSize(extractedText, maxWidth);
      let yPosition = margin + 45;

      pdf.text('Extracted Text:', margin, yPosition);
      yPosition += 7;

      splitText.forEach(line => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Add preview image if available
      if (preview) {
        pdf.addPage();
        pdf.setFontSize(12);
        pdf.text('Document Preview', margin, margin + 10);
        
        const imgWidth = maxWidth;
        const imgHeight = (preview.height / preview.width) * imgWidth;
        
        pdf.addImage(preview, 'JPEG', margin, margin + 20, imgWidth, imgHeight);
      }

      // Save PDF
      pdf.save(`OCR_${Date.now()}.pdf`);
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
      console.error('PDF error:', err);
    }
  };

  if (loading && !file) {
    return <div className="ocr-loading">Loading OCR tools...</div>;
  }

  return (
    <div className="ocr-container">
      <div className="ocr-header">
        <h1>Document OCR</h1>
        <p>Extract text from images and documents</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="ocr-main">
        <div className="ocr-upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="file-input"
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="upload-label">
              {preview ? (
                <div className="file-preview">
                  <img src={preview} alt="preview" />
                  <p className="file-name">{file?.name}</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📄</div>
                  <p>Click or drag to upload</p>
                  <small>Supports: PDF, PNG, JPG, GIF</small>
                </div>
              )}
            </label>
          </div>

          <button 
            className="ocr-button primary"
            onClick={handleProcessOCR}
            disabled={!file || processing}
          >
            {processing ? 'Processing...' : 'Process OCR'}
          </button>
        </div>

        <div className="ocr-result-section">
          <div className="result-box">
            <h3>Extracted Text</h3>
            {extractedText ? (
              <div>
                <p className="confidence-badge">Confidence: {confidence}%</p>
                <textarea 
                  className="extracted-text"
                  value={extractedText}
                  readOnly
                />
                <div className="result-actions">
                  <button 
                    className="ocr-button secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedText);
                      alert('Text copied to clipboard!');
                    }}
                  >
                    Copy Text
                  </button>
                  <button 
                    className="ocr-button secondary"
                    onClick={handleGeneratePDF}
                  >
                    Download PDF
                  </button>
                  <button 
                    className="ocr-button primary"
                    onClick={handleSaveOCR}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save to History'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="no-result">No text extracted yet. Process a document above.</p>
            )}
          </div>
        </div>
      </div>

      <div className="ocr-history-section">
        <h3>OCR History</h3>
        {ocrHistory.length > 0 ? (
          <div className="history-list">
            {ocrHistory.map((item) => (
              <div 
                key={item._id} 
                className={`history-item ${selectedHistory?._id === item._id ? 'active' : ''}`}
                onClick={() => setSelectedHistory(item)}
              >
                <div className="history-info">
                  <p className="history-file">{item.fileName}</p>
                  <p className="history-date">{new Date(item.createdAt).toLocaleDateString()}</p>
                  <p className="history-confidence">Confidence: {item.confidence}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-history">No OCR history yet</p>
        )}

        {selectedHistory && (
          <div className="history-detail">
            <h4>Details</h4>
            <p><strong>File:</strong> {selectedHistory.fileName}</p>
            <p><strong>Extracted:</strong></p>
            <textarea 
              className="history-text"
              value={selectedHistory.extractedText}
              readOnly
              rows="6"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OCR;
