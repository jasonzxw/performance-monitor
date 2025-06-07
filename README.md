# performance-monitor
This is browser performance and error monitoring tool
# Frontend Monitoring SDK Documentation

## Overview

The Frontend Monitoring SDK is a lightweight TypeScript library for tracking web application performance metrics and capturing runtime errors. It provides comprehensive monitoring capabilities including Core Web Vitals, resource timing, and error tracking.

## Features

- 📊 **Performance Monitoring**:
  - Navigation Timing metrics
  - Core Web Vitals (LCP, FID, CLS)
  - First Contentful Paint (FCP)
  - First Paint (FP)
  
- 🚨 **Error Tracking**:
  - JavaScript runtime errors
  - Resource loading failures
  - Unhandled promise rejections
  - Detailed stack traces

- 📡 **Reporting**:
  - Beacon API for reliable delivery
  - XMLHttpRequest fallback
  - Simple JSON payload format

## Installation

```bash
npm install performance-monitor
```

```typescript
import { FrontendMonitor } from 'performance-monitor';
```

## Usage

### Basic Initialization

```typescript
import { FrontendMonitor } from 'performance-monitor';

// Initialize with your reporting endpoint
const monitor = new FrontendMonitor('https://api.yourdomain.com/monitor');
monitor.init();
```

### Manual Error Reporting

```typescript
// Report custom errors
monitor.report({
  type: 'error',
  data: {
    message: 'Authentication timeout',
    filename: 'auth-service.ts',
    lineno: 42,
    colno: 15,
    type: 'js',
    timestamp: Date.now()
  }
});
```

### Performance Tracking

Automatically tracks performance metrics including:

| Metric | Description | Collected Automatically |
|--------|-------------|--------------------------|
| DNS    | DNS lookup time | ✓ |
| TCP    | TCP connection time | ✓ |
| TTFB   | Time to First Byte | ✓ |
| FCP    | First Contentful Paint | ✓ |
| LCP    | Largest Contentful Paint | ✓ |
| CLS    | Cumulative Layout Shift | ✓ |
| FP     | First Paint | ✓ |

## API Reference

### `FrontendMonitor` Class

#### Constructor
```typescript
new FrontendMonitor(reportUrl: string)
```
- `reportUrl`: Endpoint URL for sending monitoring data

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `init()` | None | Starts monitoring performance and errors |
| `report(data: ReportData)` | `data`: Performance or error data object | Sends custom monitoring data |
| `getBasicTiming()` | None | Returns calculated performance metrics (internal) |

### Data Structures

#### Performance Report
```typescript
interface PerformanceReport {
  type: 'performance';
  data: {
    dns: number;      // DNS lookup duration (ms)
    tcp: number;      // TCP connection duration (ms)
    ttfb: number;     // Time to First Byte (ms)
    domParse: number; // DOM parsing duration (ms)
    resources: number; // Resource loading duration (ms)
    domReady: number; // DOM ready time (ms)
    interactive: number; // Time to interactive (ms)
    load: number;     // Page load time (ms)
    fp?: number;      // First Paint (ms)
    fcp?: number;     // First Contentful Paint (ms)
    lcp?: number;     // Largest Contentful Paint (ms)
    fid?: number;     // First Input Delay (ms)
    cls?: number;     // Cumulative Layout Shift
  };
}
```

#### Error Report
```typescript
interface ErrorReport {
  type: 'error';
  data: {
    message: string;  // Error message
    filename: string; // Source file URL
    lineno: number;   // Line number
    colno: number;    // Column number
    stack?: string;   // Stack trace
    type: 'js' | 'resource' | 'promise'; // Error type
    timestamp: number; // Unix timestamp
  };
}
```

## Configuration Options

The SDK works out-of-the-box with no configuration required. For advanced use cases, consider extending the class:

```typescript
class CustomMonitor extends FrontendMonitor {
  constructor(reportUrl: string) {
    super(reportUrl);
  }

  // Add custom metrics
  reportCustomMetric(metricName: string, value: number) {
    this.report({
      type: 'performance',
      data: {
        ...this.getBasicTiming(),
        [metricName]: value
      }
    });
  }
}
```

## Sample Payloads

### Performance Report
```json
{
  "type": "performance",
  "data": {
    "dns": 12,
    "tcp": 25,
    "ttfb": 320,
    "domParse": 42,
    "resources": 150,
    "domReady": 1200,
    "interactive": 850,
    "load": 2100,
    "fp": 980,
    "fcp": 1020,
    "lcp": 1850,
    "cls": 0.15
  }
}
```

### Error Report
```json
{
  "type": "error",
  "data": {
    "message": "Resource load error: https://cdn.example.com/main.css",
    "filename": "https://cdn.example.com/main.css",
    "lineno": 0,
    "colno": 0,
    "type": "resource",
    "timestamp": 1686147200000
  }
}
```

## Browser Compatibility

The SDK supports all modern browsers including:

- Chrome 60+
- Firefox 55+
- Safari 12.1+
- Edge 79+
- Mobile Safari 12.2+

**Note:** Core Web Vitals (LCP, FID, CLS) require Chrome 77+ or equivalent modern browsers.

## Best Practices

1. **Endpoint Configuration**:
   - Ensure your reporting endpoint accepts CORS requests
   - Add proper authentication if needed
   - Compress responses with gzip

2. **Error Filtering**:
   ```typescript
   // Add before reporting
   if (errorMessage.includes('ThirdPartyScript')) return;
   ```

3. **User Session Tracking**:
   ```typescript
   // Add user context
   const sessionId = generateSessionId();
   const blob = new Blob([JSON.stringify({...data, sessionId})], ...);
   ```

4. **Production Considerations**:
   - Add sampling for high-traffic sites
   - Implement rate limiting
   - Add sensitive data filters
   - Include environment tags (production/staging)

## Troubleshooting

### Common Issues

1. **Missing Core Web Vitals**:
   - Ensure you're using a supported browser
   - Verify page has sufficient content for LCP calculation

2. **CORS Errors**:
   ```bash
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST
   Access-Control-Allow-Headers: Content-Type
   ```

3. **Resource Errors Not Captured**:
   - Add `crossorigin="anonymous"` to external scripts/styles
   - Verify server sends proper CORS headers

4. **Data Not Reaching Endpoint**:
   - Check browser console for network errors
   - Verify endpoint is accepting POST requests
   - Test with XMLHttpRequest fallback

## License

This SDK is provided under the MIT License. Use freely in commercial and open-source projects.