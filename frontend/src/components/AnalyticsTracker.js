// Analytics tracking utility
class AnalyticsTracker {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async track(eventType, page, metadata = {}) {
    try {
      await fetch(`${this.apiUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          page: page,
          user_session: this.sessionId,
          metadata: metadata
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  trackPageView(page) {
    this.track('page_view', page);
  }

  trackButtonClick(buttonName, page) {
    this.track('button_click', page, { button_name: buttonName });
  }

  trackFormSubmit(formName, page, success = true) {
    this.track('form_submit', page, { form_name: formName, success });
  }

  trackDocumentUpload(documentType, page, success = true) {
    this.track('document_upload', page, { document_type: documentType, success });
  }

  trackCalculatorUse(calculatorType, page, inputData = {}) {
    this.track('calculator_use', page, { calculator_type: calculatorType, ...inputData });
  }

  trackSearch(searchTerm, page, resultsCount = 0) {
    this.track('search', page, { search_term: searchTerm, results_count: resultsCount });
  }

  trackError(errorType, page, errorMessage = '') {
    this.track('error', page, { error_type: errorType, error_message: errorMessage });
  }
}

export default AnalyticsTracker;