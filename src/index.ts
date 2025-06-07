// Define report data types
interface PerformanceReport {
    type: 'performance';
    data: {
        dns: number;
        tcp: number;
        ttfb: number;
        domParse: number;
        resources: number;
        domReady: number;
        interactive: number;
        load: number;
        fp?: number;     // First Paint
        fcp?: number;    // First Contentful Paint
        lcp?: number;    // Largest Contentful Paint
        fid?: number;    // First Input Delay
        cls?: number;    // Cumulative Layout Shift
    };
}

interface ErrorReport {
    type: 'error';
    data: {
        message: string;
        filename: string;
        lineno: number;
        colno: number;
        stack?: string;
        type: 'js' | 'resource' | 'promise';
        timestamp: number;
    };
}

type ReportData = PerformanceReport | ErrorReport;

// Extended interface declarations for modern performance metrics
interface LayoutShiftEntry extends PerformanceEntry {
    value: number;
    hadRecentInput: boolean;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
    renderTime: number;
    loadTime: number;
}

/**
 * FrontendMonitor class for monitoring web performance and errors.
 */
export class FrontendMonitor {
    private reportUrl: string;
    private performanceTiming: PerformanceTiming;
    private isMonitoring = false;
    private clsValue = 0;

    constructor(reportUrl: string) {
        this.reportUrl = reportUrl;
        this.performanceTiming = performance.timing;
    }

    // Initialize monitoring
    public init() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        this.setupPerformanceObserver();
        this.captureErrors();
        window.addEventListener('load', () => this.reportPerformance());
    }

    // Performance metrics monitoring
    private setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) return;

        // Monitor FP/FCP
        new PerformanceObserver(list => {
            for (const entry of list.getEntriesByName('first-paint')) {
                this.report({
                    type: 'performance',
                    data: { ...this.getBasicTiming(), fp: Math.round(entry.startTime) }
                });
            }
            for (const entry of list.getEntriesByName('first-contentful-paint')) {
                this.report({
                    type: 'performance',
                    data: { ...this.getBasicTiming(), fcp: Math.round(entry.startTime) }
                });
            }
        }).observe({ type: 'paint', buffered: true });

        // Monitor LCP
        new PerformanceObserver(list => {
            const entries = list.getEntries();
            if (entries.length > 0) {
                const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry;
                const lcp = lastEntry.renderTime || lastEntry.loadTime;
                this.report({
                    type: 'performance',
                    data: { ...this.getBasicTiming(), lcp: Math.round(lcp) }
                });
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Monitor CLS
        new PerformanceObserver(list => {
            const entries = list.getEntries() as LayoutShiftEntry[];
            for (const entry of entries) {
                if (!entry.hadRecentInput) {
                    this.clsValue += entry.value;
                }
            }
            this.report({
                type: 'performance',
                data: { ...this.getBasicTiming(), cls: this.clsValue }
            });
        }).observe({ type: 'layout-shift', buffered: true });
    }

    // Calculate basic performance metrics
    private getBasicTiming() {
        const t = this.performanceTiming;
        return {
            dns: t.domainLookupEnd - t.domainLookupStart,
            tcp: t.connectEnd - t.connectStart,
            ttfb: t.responseStart - t.requestStart,
            domParse: t.domComplete - t.domInteractive,
            resources: t.loadEventStart - t.domContentLoadedEventEnd,
            domReady: t.domContentLoadedEventEnd - t.navigationStart,
            interactive: t.domInteractive - t.navigationStart,
            load: t.loadEventEnd - t.navigationStart
        };
    }

    // Error monitoring
    private captureErrors() {
        // JavaScript runtime errors
        window.addEventListener('error', event => {
            this.report({
                type: 'error',
                data: {
                    message: event.message,
                    filename: event.filename || window.location.href,
                    lineno: event.lineno || 0,
                    colno: event.colno || 0,
                    stack: event.error?.stack,
                    type: 'js',
                    timestamp: Date.now()
                }
            });
        }, true);

        // Resource loading errors
        window.addEventListener('error', event => {
            const target = event.target as HTMLElement;
            if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT' || target.tagName === 'IMG')) {
                this.report({
                    type: 'error',
                    data: {
                        message: `Resource load error: ${(target as HTMLImageElement).src || (target as HTMLLinkElement).href}`,
                        filename: (target as HTMLImageElement).src || (target as HTMLLinkElement).href || '',
                        lineno: 0,
                        colno: 0,
                        type: 'resource',
                        timestamp: Date.now()
                    }
                });
            }
        }, true);

        // Uncaught promise rejections
        window.addEventListener('unhandledrejection', event => {
            this.report({
                type: 'error',
                data: {
                    message: event.reason?.message || 'Unhandled promise rejection',
                    filename: window.location.href,
                    lineno: 0,
                    colno: 0,
                    stack: event.reason?.stack,
                    type: 'promise',
                    timestamp: Date.now()
                }
            });
        });
    }

    // Report core performance metrics
    private reportPerformance() {
        this.report({
            type: 'performance',
            data: this.getBasicTiming()
        });
    }

    // Data reporting method
    public report(data: ReportData) {
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon(this.reportUrl, blob);
        } else {
            // Fallback using XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.reportUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }
}