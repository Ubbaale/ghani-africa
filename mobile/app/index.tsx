import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Platform,
  Linking,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

const APP_URL = Constants.expoConfig?.extra?.appUrl || 'https://ghani-africa.replit.app';

const INJECTED_JS = `
  (function() {
    // Notify the app that the page has loaded
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_LOADED' }));
    
    // Override window.open to handle in WebView
    window.open = function(url) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_URL', url: url }));
    };

    // Add safe area padding for notched devices
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no';
    const existing = document.querySelector('meta[name="viewport"]');
    if (existing) existing.remove();
    document.head.appendChild(meta);

    // Hide any PWA install prompts since we're already in the native app
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
    });

    // Pass push notification token to the web app
    if (window.__EXPO_PUSH_TOKEN__) {
      window.localStorage.setItem('expoPushToken', window.__EXPO_PUSH_TOKEN__);
    }

    true;
  })();
`;

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
    } catch {
      setIsOffline(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAGE_LOADED') {
        SplashScreen.hideAsync();
        setIsLoading(false);
      } else if (data.type === 'OPEN_URL') {
        if (data.url?.startsWith('https://wa.me') || data.url?.startsWith('tel:') || data.url?.startsWith('mailto:')) {
          Linking.openURL(data.url);
        }
      }
    } catch {}
  };

  const handleShouldStartLoad = (event: any) => {
    const { url } = event;
    if (
      url.startsWith('https://wa.me') ||
      url.startsWith('whatsapp://') ||
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('intent:') ||
      url.startsWith('market:')
    ) {
      Linking.openURL(url);
      return false;
    }
    if (url.startsWith('https://checkout.stripe.com') || url.startsWith('https://m.stripe.com')) {
      return true;
    }
    if (!url.startsWith(APP_URL) && !url.startsWith('about:') && !url.includes('stripe.com')) {
      Linking.openURL(url);
      return false;
    }
    return true;
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    SplashScreen.hideAsync();
  };

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  if (isOffline && hasError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📡</Text>
        <Text style={styles.errorTitle}>No Internet Connection</Text>
        <Text style={styles.errorMessage}>
          Please check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>
          Unable to load the marketplace. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onError={handleError}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 500) {
            handleError();
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        scalesPageToFit={true}
        pullToRefreshEnabled={true}
        overScrollMode="content"
        textZoom={100}
        setSupportMultipleWindows={false}
        userAgent={`GhaniAfrica-Mobile/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS})`}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#c97f44" />
          <Text style={styles.loadingText}>Loading Ghani Africa...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#c97f44',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#c97f44',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
