const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Performance test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  routes: [
    '/',
    '/dashboard',
    '/admin',
    '/admin/dashboard',
    '/admin/homepage-management',
    '/admin/book-insights',
    '/admin/content-moderation',
    '/admin/user-management',
    '/admin/coin-management',
    '/admin/withdrawal-management',
    '/editor',
    '/story/create'
  ],
  iterations: 3,
  outputDir: './performance-results'
};

async function measurePagePerformance(page, url) {
  console.log(`Testing: ${url}`);
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  // Start performance measurement
  const startTime = Date.now();
  
  // Navigate to page
  const response = await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  const loadTime = Date.now() - startTime;
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Navigation timing
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Paint timing
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      
      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      
      // Memory usage (if available)
      usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
      totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
    };
  });
  
  // Get Lighthouse-style metrics
  const performanceMetrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
        const fid = entries.find(entry => entry.entryType === 'first-input');
        const cls = entries.find(entry => entry.entryType === 'layout-shift');
        
        resolve({
          largestContentfulPaint: lcp?.startTime || 0,
          firstInputDelay: fid?.processingStart - fid?.startTime || 0,
          cumulativeLayoutShift: cls?.value || 0
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      
      // Fallback timeout
      setTimeout(() => resolve({
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0
      }), 5000);
    });
  });
  
  // Get bundle information
  const bundleInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map(s => s.src).filter(src => src.includes('/_next/')),
      styles: styles.map(s => s.href).filter(href => href.includes('/_next/'))
    };
  });
  
  return {
    url,
    loadTime,
    statusCode: response.status(),
    ...metrics,
    ...performanceMetrics,
    ...bundleInfo,
    timestamp: new Date().toISOString()
  };
}

async function runPerformanceTests() {
  console.log('Starting performance tests...');
  
  // Create output directory
  if (!fs.existsSync(TEST_CONFIG.outputDir)) {
    fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    for (const route of TEST_CONFIG.routes) {
      const url = `${TEST_CONFIG.baseUrl}${route}`;
      const routeResults = [];
      
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const page = await browser.newPage();
        
        try {
          const result = await measurePagePerformance(page, url);
          routeResults.push(result);
          console.log(`  Iteration ${i + 1}: ${result.loadTime}ms`);
        } catch (error) {
          console.error(`  Error testing ${url}:`, error.message);
          routeResults.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        } finally {
          await page.close();
        }
      }
      
      // Calculate averages
      const validResults = routeResults.filter(r => !r.error);
      if (validResults.length > 0) {
        const average = {
          url,
          iterations: validResults.length,
          averageLoadTime: validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length,
          averageFCP: validResults.reduce((sum, r) => sum + r.firstContentfulPaint, 0) / validResults.length,
          averageLCP: validResults.reduce((sum, r) => sum + r.largestContentfulPaint, 0) / validResults.length,
          averageMemory: validResults.reduce((sum, r) => sum + r.usedJSHeapSize, 0) / validResults.length,
          bundleInfo: validResults[0]?.scripts || [],
          timestamp: new Date().toISOString()
        };
        
        results.push({
          route,
          average,
          individual: routeResults
        });
      }
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(TEST_CONFIG.outputDir, `performance-${timestamp}.json`);
    
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Generate summary report
    const summary = generateSummaryReport(results);
    const summaryFile = path.join(TEST_CONFIG.outputDir, `summary-${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('\nPerformance test completed!');
    console.log(`Results saved to: ${resultsFile}`);
    console.log(`Summary saved to: ${summaryFile}`);
    
    // Print summary to console
    console.log('\n=== PERFORMANCE SUMMARY ===');
    summary.routes.forEach(route => {
      console.log(`${route.route}: ${route.averageLoadTime.toFixed(0)}ms (FCP: ${route.averageFCP.toFixed(0)}ms)`);
    });
    
  } finally {
    await browser.close();
  }
}

function generateSummaryReport(results) {
  const routes = results.map(r => ({
    route: r.route,
    averageLoadTime: r.average.averageLoadTime,
    averageFCP: r.average.averageFCP,
    averageLCP: r.average.averageLCP,
    averageMemory: r.average.averageMemory,
    bundleCount: r.average.bundleInfo.length
  }));
  
  const overall = {
    totalRoutes: routes.length,
    averageLoadTime: routes.reduce((sum, r) => sum + r.averageLoadTime, 0) / routes.length,
    averageFCP: routes.reduce((sum, r) => sum + r.averageFCP, 0) / routes.length,
    averageLCP: routes.reduce((sum, r) => sum + r.averageLCP, 0) / routes.length,
    averageMemory: routes.reduce((sum, r) => sum + r.averageMemory, 0) / routes.length,
    timestamp: new Date().toISOString()
  };
  
  return {
    overall,
    routes,
    recommendations: generateRecommendations(routes)
  };
}

function generateRecommendations(routes) {
  const recommendations = [];
  
  // Check for slow routes
  const slowRoutes = routes.filter(r => r.averageLoadTime > 3000);
  if (slowRoutes.length > 0) {
    recommendations.push({
      type: 'performance',
      severity: 'high',
      message: `Slow loading routes detected: ${slowRoutes.map(r => r.route).join(', ')}`,
      suggestion: 'Consider implementing additional code splitting or optimizing these routes'
    });
  }
  
  // Check for high memory usage
  const highMemoryRoutes = routes.filter(r => r.averageMemory > 50 * 1024 * 1024); // 50MB
  if (highMemoryRoutes.length > 0) {
    recommendations.push({
      type: 'memory',
      severity: 'medium',
      message: `High memory usage detected: ${highMemoryRoutes.map(r => r.route).join(', ')}`,
      suggestion: 'Consider optimizing component memory usage and implementing proper cleanup'
    });
  }
  
  // Check for poor FCP
  const poorFCPRoutes = routes.filter(r => r.averageFCP > 2500);
  if (poorFCPRoutes.length > 0) {
    recommendations.push({
      type: 'fcp',
      severity: 'medium',
      message: `Poor First Contentful Paint: ${poorFCPRoutes.map(r => r.route).join(', ')}`,
      suggestion: 'Consider optimizing critical rendering path and reducing render-blocking resources'
    });
  }
  
  return recommendations;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = {
  runPerformanceTests,
  measurePagePerformance,
  TEST_CONFIG
};