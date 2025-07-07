'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RotateCcw, 
  Zap, 
  Hand, 
  Eye,
  Vibrate,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useViewport } from '@/hooks/useViewport';
import { MobileInput } from '@/components/ui/mobile-input';

export default function MobileOptimizationTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [hapticTest, setHapticTest] = useState('');
  const [touchTest, setTouchTest] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  const viewport = useViewport();

  // Test haptic feedback
  const testHaptic = (type: 'light' | 'medium' | 'heavy') => {
    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[type]);
        setHapticTest(`✅ ${type} haptic test eseguito`);
        setTestResults(prev => ({ ...prev, [`haptic-${type}`]: true }));
      } else {
        setHapticTest('❌ Vibration API non supportata');
        setTestResults(prev => ({ ...prev, [`haptic-${type}`]: false }));
      }
    } catch (error) {
      setHapticTest('❌ Errore nel test haptic');
      setTestResults(prev => ({ ...prev, [`haptic-${type}`]: false }));
    }
  };

  // Touch gesture handlers
  const { attachGestures } = useTouchGestures({
    onSwipe: (gesture) => {
      setTouchTest(`✅ Swipe ${gesture.direction} rilevato (${Math.round(gesture.distance)}px)`);
      setTestResults(prev => ({ ...prev, 'swipe': true }));
    },
    onPinch: (gesture) => {
      setTouchTest(`✅ Pinch rilevato (scale: ${gesture.scale.toFixed(2)})`);
      setTestResults(prev => ({ ...prev, 'pinch': true }));
    },
    onLongPress: () => {
      setTouchTest('✅ Long press rilevato');
      setTestResults(prev => ({ ...prev, 'longpress': true }));
    },
    onTap: () => {
      setTouchTest('✅ Tap rilevato');
      setTestResults(prev => ({ ...prev, 'tap': true }));
    },
    onDoubleTap: () => {
      setTouchTest('✅ Double tap rilevato');
      setTestResults(prev => ({ ...prev, 'doubletap': true }));
    }
  });

  // Test viewport information
  const testViewport = () => {
    const info = {
      'viewport-mobile': viewport.isMobile,
      'viewport-tablet': viewport.isTablet,
      'viewport-desktop': viewport.isDesktop,
      'viewport-touch': viewport.isTouchDevice(),
      'viewport-ios': viewport.isIOS(),
      'viewport-android': viewport.isAndroid(),
      'viewport-iphone': viewport.isIPhone()
    };
    
    setTestResults(prev => ({ ...prev, ...info }));
  };

  // Test network status
  const testNetwork = () => {
    const online = navigator.onLine;
    setTestResults(prev => ({ 
      ...prev, 
      'network-online': online,
      'network-offline': !online 
    }));
  };

  // Test safe area
  const testSafeArea = () => {
    const safeViewport = viewport.getSafeViewport();
    const hasSafeArea = safeViewport.top > 0 || safeViewport.bottom > 0;
    setTestResults(prev => ({ ...prev, 'safe-area': hasSafeArea }));
  };

  React.useEffect(() => {
    testViewport();
    testNetwork();
    testSafeArea();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Test Ottimizzazioni Mobile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Viewport Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Informazioni Viewport
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Dimensioni</div>
                <div className="font-mono text-xs">
                  {viewport.size.innerWidth} × {viewport.size.innerHeight}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Dispositivo</div>
                <div className="flex items-center gap-1">
                  {viewport.isMobile && <Smartphone className="h-4 w-4" />}
                  {viewport.isTablet && <Tablet className="h-4 w-4" />}
                  {viewport.isDesktop && <Monitor className="h-4 w-4" />}
                  <span className="text-sm">
                    {viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Orientamento</div>
                <div className="flex items-center gap-1">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">
                    {viewport.isLandscape ? 'Landscape' : 'Portrait'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">DPR</div>
                <div className="font-mono text-sm">
                  {viewport.devicePixelRatio}x
                </div>
              </div>
            </div>
            
            {/* Test Results */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(testResults).map(([key, value]) => (
                <span
                  key={key}
                  className={`px-2 py-1 text-xs rounded-full ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {value ? '✅' : '❌'} {key}
                </span>
              ))}
            </div>
          </div>

          {/* Haptic Feedback Test */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Vibrate className="h-4 w-4" />
              Test Feedback Aptico
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => testHaptic('light')}
                className="touch-manipulation"
              >
                Light
              </Button>
              <Button
                size="sm"
                onClick={() => testHaptic('medium')}
                className="touch-manipulation"
              >
                Medium
              </Button>
              <Button
                size="sm"
                onClick={() => testHaptic('heavy')}
                className="touch-manipulation"
              >
                Heavy
              </Button>
            </div>
            {hapticTest && (
              <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
                {hapticTest}
              </div>
            )}
          </div>

          {/* Touch Gestures Test */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Hand className="h-4 w-4" />
              Test Touch Gestures
            </h3>
            <div
              ref={(node) => {
                if (node && viewport.isTouchDevice()) {
                  attachGestures(node);
                }
              }}
              className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 touch-manipulation"
            >
              <p className="text-gray-600 mb-2">
                Area di test per touch gestures
              </p>
              <p className="text-sm text-gray-500">
                Prova: tap, double tap, long press, swipe, pinch
              </p>
            </div>
            {touchTest && (
              <div className="p-2 bg-green-50 text-green-800 rounded text-sm">
                {touchTest}
              </div>
            )}
          </div>

          {/* Mobile Input Test */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Input Mobile</h3>
            <div className="space-y-4">
              <MobileInput
                label="Input Standard"
                placeholder="Scrivi qualcosa..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Input ottimizzato per mobile"
              />
              <MobileInput
                label="Input con Errore"
                placeholder="Input con errore..."
                error="Questo è un messaggio di errore"
                variant="outline"
              />
              <MobileInput
                label="Input Glass Effect"
                placeholder="Input con effetto vetro..."
                glassEffect
                variant="filled"
              />
            </div>
          </div>

          {/* Glass Effect Test */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Liquid Glass Effect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-effect p-4 rounded-lg">
                <h4 className="font-medium mb-2">Glass Effect Light</h4>
                <p className="text-sm opacity-80">
                  Questo è un esempio di effetto vetro liquido chiaro.
                </p>
              </div>
              <div className="glass-effect-dark p-4 rounded-lg text-white">
                <h4 className="font-medium mb-2">Glass Effect Dark</h4>
                <p className="text-sm opacity-80">
                  Questo è un esempio di effetto vetro liquido scuro.
                </p>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              {navigator.onLine ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              Stato Rete
            </h3>
            <div className={`p-3 rounded-lg ${navigator.onLine ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {navigator.onLine ? '✅ Online' : '❌ Offline'}
            </div>
          </div>

          {/* Safe Area Test */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Safe Area</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">Safe Area Insets:</div>
              <div className="font-mono text-xs">
                Top: {viewport.safeAreaInsets.top}px, 
                Bottom: {viewport.safeAreaInsets.bottom}px, 
                Left: {viewport.safeAreaInsets.left}px, 
                Right: {viewport.safeAreaInsets.right}px
              </div>
            </div>
          </div>

          {/* Performance Test */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Performance</h3>
            <div className="space-y-2">
              <motion.div
                className="p-4 bg-blue-100 rounded-lg cursor-pointer touch-manipulation"
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Tap per animazione Spring
              </motion.div>
              <div className="p-4 bg-purple-100 rounded-lg cursor-pointer touch-feedback">
                Tap per ripple effect
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 