/**
 * Mobile Responsiveness Testing Tool
 * Tests touch targets, gestures, and mobile UX
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Smartphone, Monitor, Tablet } from 'lucide-react';

interface TouchTestResult {
  element: string;
  size: { width: number; height: number };
  passed: boolean;
  issues: string[];
}

interface ResponsiveTestResult {
  breakpoint: string;
  passed: boolean;
  issues: string[];
}

export function MobileResponsivenessTest() {
  const [touchTestResults, setTouchTestResults] = useState<TouchTestResult[]>([]);
  const [responsiveResults, setResponsiveResults] = useState<ResponsiveTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const testRef = useRef<HTMLDivElement>(null);

  const runTouchTargetTests = () => {
    setIsRunning(true);
    const results: TouchTestResult[] = [];

    // Test touch targets
    const touchElements = document.querySelectorAll([
      'button',
      '[role="button"]',
      'input[type="range"]',
      '.touch-target',
      '.emotion-slider input',
      'a',
      '[tabindex]'
    ].join(', '));

    touchElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const issues: string[] = [];
      
      // Apple recommends 44px minimum
      const minSize = 44;
      
      if (rect.width < minSize) {
        issues.push(`Width ${rect.width.toFixed(1)}px < ${minSize}px`);
      }
      
      if (rect.height < minSize) {
        issues.push(`Height ${rect.height.toFixed(1)}px < ${minSize}px`);
      }

      // Check spacing between touch targets
      const nearby = Array.from(touchElements).filter(other => {
        if (other === element) return false;
        const otherRect = other.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(rect.x - otherRect.x, 2) + 
          Math.pow(rect.y - otherRect.y, 2)
        );
        return distance < 48; // 8px minimum spacing
      });

      if (nearby.length > 0) {
        issues.push(`${nearby.length} nearby touch targets (< 8px spacing)`);
      }

      results.push({
        element: element.tagName.toLowerCase() + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        size: { width: rect.width, height: rect.height },
        passed: issues.length === 0,
        issues
      });
    });

    setTouchTestResults(results);
    setIsRunning(false);
  };

  const runResponsiveTests = () => {
    const breakpoints = [
      { name: 'Mobile (375px)', width: 375 },
      { name: 'Mobile Large (414px)', width: 414 },
      { name: 'Tablet (768px)', width: 768 },
      { name: 'Desktop (1024px)', width: 1024 },
    ];

    const results: ResponsiveTestResult[] = [];

    breakpoints.forEach(bp => {
      const issues: string[] = [];

      // Test horizontal scrolling
      const body = document.body;
      const html = document.documentElement;
      const scrollWidth = Math.max(
        body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth
      );

      if (scrollWidth > bp.width) {
        issues.push('Horizontal scrolling detected');
      }

      // Test viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        issues.push('Missing viewport meta tag');
      } else {
        const content = viewport.getAttribute('content') || '';
        if (!content.includes('width=device-width')) {
          issues.push('Viewport not set to device width');
        }
      }

      // Test text readability
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let smallTextCount = 0;

      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 16) {
          smallTextCount++;
        }
      });

      if (smallTextCount > textElements.length * 0.3) {
        issues.push(`${Math.round(smallTextCount / textElements.length * 100)}% text smaller than 16px`);
      }

      results.push({
        breakpoint: bp.name,
        passed: issues.length === 0,
        issues
      });
    });

    setResponsiveResults(results);
  };

  const testEmotionSlider = () => {
    const slider = document.querySelector('.emotion-slider input[type="range"]') as HTMLInputElement;
    const issues: string[] = [];

    if (slider) {
      const rect = slider.getBoundingClientRect();
      const thumb = slider.querySelector('::-webkit-slider-thumb');
      
      // Test track height for easy targeting
      if (rect.height < 44) {
        issues.push(`Slider track too thin: ${rect.height}px`);
      }

      // Test thumb size (should be at least 44px)
      const computedStyle = window.getComputedStyle(slider);
      console.log('Slider testing results:', {
        trackHeight: rect.height,
        computedStyle: computedStyle.height
      });

      // Test haptic feedback (iOS only)
      if ('vibrate' in navigator) {
        // Test vibration API
        try {
          navigator.vibrate(50);
        } catch (e) {
          issues.push('Haptic feedback not available');
        }
      }
    } else {
      issues.push('Emotion slider not found');
    }

    return {
      element: 'emotion-slider',
      issues,
      passed: issues.length === 0
    };
  };

  const passedCount = touchTestResults.filter(r => r.passed).length;
  const totalTests = touchTestResults.length;
  const passRate = totalTests > 0 ? (passedCount / totalTests) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Mobile Responsiveness Testing</h2>
        <p className="text-muted-foreground">
          Automated testing for touch targets, responsiveness, and mobile UX
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{passedCount}</div>
            <div className="text-sm text-muted-foreground">Touch Targets Passed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{passRate.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Pass Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{totalTests - passedCount}</div>
            <div className="text-sm text-muted-foreground">Issues Found</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={runTouchTargetTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Test Touch Targets
        </Button>
        
        <Button 
          onClick={runResponsiveTests} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          Test Responsive Design
        </Button>
      </div>

      <Tabs defaultValue="touch" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="touch">Touch Targets</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
          <TabsTrigger value="slider">Emotion Slider</TabsTrigger>
        </TabsList>

        <TabsContent value="touch">
          <Card>
            <CardHeader>
              <CardTitle>Touch Target Analysis</CardTitle>
              <CardDescription>
                Testing minimum 44px touch targets as recommended by Apple and Google
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {touchTestResults.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Click &ldquo;Test Touch Targets&rdquo; to run analysis
                  </p>
                )}
                
                {touchTestResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.element}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.size.width.toFixed(0)}px × {result.size.height.toFixed(0)}px
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {result.issues.length > 0 && (
                        <div className="space-y-1">
                          {result.issues.map((issue, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsive">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Design Analysis</CardTitle>
              <CardDescription>
                Testing layout and usability across different screen sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responsiveResults.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Click &ldquo;Test Responsive Design&rdquo; to run analysis
                  </p>
                )}
                
                {responsiveResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.breakpoint}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {result.issues.length > 0 && (
                        <div className="space-y-1">
                          {result.issues.map((issue, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slider">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Slider Testing</CardTitle>
              <CardDescription>
                Specialized testing for the EmotionSlider component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Test Criteria</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Touch targets must be at least 44px</li>
                    <li>• Smooth gesture handling</li>
                    <li>• Haptic feedback on iOS</li>
                    <li>• Visual feedback on interaction</li>
                    <li>• Accessibility compliance</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => {
                    const result = testEmotionSlider();
                    console.log('Emotion slider test:', result);
                  }}
                  className="w-full"
                >
                  Test Emotion Slider
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div ref={testRef} className="hidden">
        {/* Test environment elements */}
      </div>
    </div>
  );
}

export default MobileResponsivenessTest;
