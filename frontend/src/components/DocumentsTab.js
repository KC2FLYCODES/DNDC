import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DocumentsTab = ({ api }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/documents`);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentId, file) => {
    try {
      setUploadingId(documentId);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${api}/documents/upload/${documentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh documents list
      await fetchDocuments();
      setError(null);
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileReplace = async (documentId, file) => {
    try {
      setUploadingId(documentId);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${api}/documents/replace/${documentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh documents list
      await fetchDocuments();
      setError(null);
    } catch (err) {
      setError('Failed to replace file');
      console.error('Error replacing file:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await axios.delete(`${api}/documents/${documentId}/file`);
      await fetchDocuments();
      setError(null);
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const handleFileView = async (documentId) => {
    try {
      const response = await axios.get(`${api}/documents/${documentId}/view`);
      const fileInfo = response.data;
      
      // Create a popup window with file information
      const popup = window.open('', 'FileView', 'width=600,height=400');
      popup.document.write(`
        <html>
          <head>
            <title>File Information</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; }
              .download-btn { 
                background: #3498db; color: white; border: none; 
                padding: 10px 20px; border-radius: 4px; cursor: pointer;
                margin-top: 20px;
              }
              .download-btn:hover { background: #2980b9; }
            </style>
          </head>
          <body>
            <h2>File Information</h2>
            <div class="info-item">
              <span class="label">Document:</span> ${fileInfo.name}
            </div>
            <div class="info-item">
              <span class="label">Original Filename:</span> ${fileInfo.original_filename}
            </div>
            <div class="info-item">
              <span class="label">File Size:</span> ${(fileInfo.file_size / 1024).toFixed(2)} KB
            </div>
            <div class="info-item">
              <span class="label">Uploaded:</span> ${new Date(fileInfo.uploaded_at).toLocaleString()}
            </div>
            <button class="download-btn" onclick="window.open('${api}/documents/${documentId}/download', '_blank')">
              Download File
            </button>
          </body>
        </html>
      `);
    } catch (err) {
      setError('Failed to view file information');
      console.error('Error viewing file:', err);
    }
  };

  const handleFileInputChange = (documentId, event, isReplace = false) => {
    const file = event.target.files[0];
    if (file) {
      if (isReplace) {
        handleFileReplace(documentId, file);
      } else {
        handleFileUpload(documentId, file);
      }
    }
    event.target.value = ''; // Reset input
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  return (
    <div className="document-checklist">
      <div className="card-header">
        <div>
          <h3 className="card-title">Housing Application Checklist</h3>
          <p className="card-subtitle">Upload your required documents to complete your Mission 180 application</p>
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div style={{ 
        background: '#f7fafc', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📋</span>
          <strong style={{ color: '#2d3748' }}>
            Progress: {documents.filter(d => d.is_uploaded).length} of {documents.length} documents completed
          </strong>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#e2e8f0', 
          borderRadius: '4px', 
          overflow: 'hidden' 
        }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              width: `${documents.length > 0 ? (documents.filter(d => d.is_uploaded).length / documents.length) * 100 : 0}%`,
              transition: 'width 0.5s ease'
            }}
          />
        </div>
      </div>
      
      {documents.map(document => (
        <div key={document.id} className="checklist-item">
          <input
            type="checkbox"
            className="checklist-checkbox"
            checked={document.is_uploaded}
            readOnly
          />
          <div className="checklist-label">
            <div style={{ fontWeight: '600', color: '#2d3748' }}>{document.name}</div>
            <div style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.25rem' }}>
              {document.description}
            </div>
            {document.is_uploaded && (
              <div className="file-info">
                ✅ Uploaded: {formatDate(document.uploaded_at)} 
                {document.original_filename && ` • ${document.original_filename}`}
                {document.file_size && ` • ${formatFileSize(document.file_size)}`}
              </div>
            )}
          </div>
          
          <div className="file-actions">
            {!document.is_uploaded ? (
              <>
                <input
                  type="file"
                  id={`upload-${document.id}`}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileInputChange(document.id, e)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
                <button
                  className="upload-btn"
                  onClick={() => document.getElementById(`upload-${document.id}`).click()}
                  disabled={uploadingId === document.id}
                >
                  {uploadingId === document.id ? 'Uploading...' : '📁 Upload'}
                </button>
              </>
            ) : (
              <>
                <button
                  className="action-btn"
                  onClick={() => handleFileView(document.id)}
                  title="View file details"
                >
                  👁️ View
                </button>
                <input
                  type="file"
                  id={`replace-${document.id}`}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileInputChange(document.id, e, true)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
                <button
                  className="action-btn secondary"
                  onClick={() => document.getElementById(`replace-${document.id}`).click()}
                  disabled={uploadingId === document.id}
                  title="Replace with new file"
                >
                  {uploadingId === document.id ? 'Replacing...' : '🔄 Replace'}
                </button>
                <button
                  className="action-btn"
                  onClick={() => window.open(`${api}/documents/${document.id}/download`, '_blank')}
                  title="Download file"
                >
                  💾 Download
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => handleFileDelete(document.id)}
                  title="Delete file"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📄 File Upload Guidelines
        </h4>
        <div style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Accepted formats:</strong> PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png), Text files (.txt)
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Maximum file size:</strong> 10MB per file
          </p>
          <p style={{ marginBottom: '0' }}>
            <strong>Tips:</strong> Ensure documents are clear and readable. Scan documents at 300 DPI for best quality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;