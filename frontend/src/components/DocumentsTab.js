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
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Housing Application Checklist</h3>
            <p className="card-subtitle">Upload your required documents to complete your Mission 180 application</p>
          </div>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <div style={{ 
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                📋
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: '#2d3748',
                  marginBottom: '0.25rem'
                }}>
                  Document Progress
                </div>
                <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                  {documents.filter(d => d.is_uploaded).length} of {documents.length} completed
                </div>
              </div>
            </div>
            <div style={{ 
              background: 'white',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: documents.length > 0 && documents.filter(d => d.is_uploaded).length === documents.length 
                ? '#27ae60' : '#3498db'
            }}>
              {documents.length > 0 ? Math.round((documents.filter(d => d.is_uploaded).length / documents.length) * 100) : 0}%
            </div>
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
      </div>
      
      <div className="document-checklist">
        {documents.map((document, index) => (
          <div key={document.id} className="checklist-item" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {document.is_uploaded && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
              }} />
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: document.is_uploaded 
                  ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' 
                  : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'white',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {document.is_uploaded ? '✓' : index + 1}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#2d3748',
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem'
                }}>
                  {document.name}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#718096', 
                  lineHeight: '1.5',
                  marginBottom: document.is_uploaded ? '0.75rem' : '1rem'
                }}>
                  {document.description}
                </div>
                
                {document.is_uploaded && (
                  <div style={{
                    background: '#f0fff4',
                    border: '1px solid #c6f6d5',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    color: '#2f855a',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span>✅</span>
                      <strong>Uploaded successfully</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      {formatDate(document.uploaded_at)}
                      {document.original_filename && ` • ${document.original_filename}`}
                      {document.file_size && ` • ${formatFileSize(document.file_size)}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              flexWrap: 'wrap',
              marginTop: '1rem',
              marginLeft: '40px'
            }}>
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
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: uploadingId === document.id ? 'not-allowed' : 'pointer',
                      opacity: uploadingId === document.id ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => document.getElementById(`upload-${document.id}`).click()}
                    disabled={uploadingId === document.id}
                    onMouseOver={(e) => {
                      if (uploadingId !== document.id) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {uploadingId === document.id ? (
                      <>⏳ Uploading...</>
                    ) : (
                      <>📁 Upload File</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="action-btn"
                    onClick={() => handleFileView(document.id)}
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
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
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      cursor: uploadingId === document.id ? 'not-allowed' : 'pointer',
                      opacity: uploadingId === document.id ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {uploadingId === document.id ? '⏳ Replacing...' : '🔄 Replace'}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => window.open(`${api}/documents/${document.id}/download`, '_blank')}
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    💾 Download
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={() => handleFileDelete(document.id)}
                    style={{
                      background: 'white',
                      border: '1px solid #fee2e2',
                      color: '#dc2626',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#fef2f2';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'white';
                    }}
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
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ 
            marginBottom: '1rem', 
            color: '#2d3748', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            📄 File Upload Guidelines
          </h4>
          <div style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: '1.6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#2d3748' }}>Accepted formats:</strong>
                <div style={{ marginTop: '0.25rem' }}>PDF, Word (.doc, .docx), Images (.jpg, .png), Text files</div>
              </div>
              <div>
                <strong style={{ color: '#2d3748' }}>Maximum file size:</strong>
                <div style={{ marginTop: '0.25rem' }}>10MB per file</div>
              </div>
              <div>
                <strong style={{ color: '#2d3748' }}>Best practices:</strong>
                <div style={{ marginTop: '0.25rem' }}>Ensure documents are clear and scan at 300 DPI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;