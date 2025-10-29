// Jest setup for React Native Testing Library

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  ImagePickerResult: {},
}));

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    executeSql: jest.fn(),
  })),
}));

// Mock modules that may not be installed
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mocked-hash')),
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}), { virtual: true });

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('mock-device-id')),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '14.0'),
  getBrand: jest.fn(() => 'Apple'),
  getModel: jest.fn(() => 'iPhone'),
  getBundleId: jest.fn(() => 'com.example.app'),
  getBuildNumber: jest.fn(() => '1'),
  getVersion: jest.fn(() => '1.0.0'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
}), { virtual: true });

// Mock React Native Image Resizer
jest.mock('react-native-image-resizer', () => ({
  createResizedImage: jest.fn(() => Promise.resolve({
    uri: 'file:///mock/resized/image.jpg',
    size: 1024,
  })),
}), { virtual: true });

// Mock React Native FS
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(() => Promise.resolve('mock-file-content')),
  stat: jest.fn(() => Promise.resolve({
    size: 1024,
    isFile: () => true,
  })),
}), { virtual: true });

// Mock React Native Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));



// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// Mock Haptic Feedback
jest.mock('react-native-haptic-feedback', () => {
  const mockTrigger = jest.fn();
  return {
    trigger: mockTrigger,
    HapticFeedbackTypes: {
      selection: 'selection',
      impactLight: 'impactLight',
      impactMedium: 'impactMedium',
      impactHeavy: 'impactHeavy',
    },
    default: {
      trigger: mockTrigger,
    },
  };
});

// Mock responsive utils
jest.mock('../utils/responsive', () => ({
  responsive: {
    wp: jest.fn((percentage) => percentage * 3.9),
    hp: jest.fn((percentage) => percentage * 8.44),
    scale: jest.fn((size) => size),
    verticalScale: jest.fn((size) => size),
    moderateScale: jest.fn((size) => size),
    fontSize: jest.fn((size) => size),
  },
  deviceInfo: {
    isSmallDevice: false,
    isMediumDevice: true,
    isLargeDevice: false,
    isTablet: false,
    isLandscape: false,
    isPortrait: true,
    pixelDensity: 2,
    isHighDensity: false,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  touchTarget: {
    minSize: 44,
    androidMinSize: 48,
    recommended: 48,
  },
  breakpoints: {
    small: 0,
    medium: 375,
    large: 414,
    tablet: 768,
    desktop: 1024,
  },
  responsiveValue: jest.fn((values) => values.default),
  getScreenDimensions: jest.fn(() => ({ width: 390, height: 844 })),
  onOrientationChange: jest.fn(() => jest.fn()),
}));

// Mock Security Service
jest.mock('../services/securityService', () => ({
  securityService: {
    setSecureItem: jest.fn(() => Promise.resolve()),
    getSecureItem: jest.fn(() => Promise.resolve('mock-value')),
    removeSecureItem: jest.fn(() => Promise.resolve()),
    isBiometricSupported: jest.fn(() => Promise.resolve(true)),
    encryptData: jest.fn((data) => Promise.resolve({
      data: Buffer.from(data).toString('base64'),
      iv: 'mock-iv',
      salt: 'mock-salt',
      timestamp: Date.now(),
    })),
    decryptData: jest.fn((encrypted) => Promise.resolve(
      Buffer.from(encrypted.data, 'base64').toString()
    )),
    performSecurityCheck: jest.fn(() => Promise.resolve({
      deviceBinding: true,
      appIntegrity: true,
      tamperDetection: true,
    })),
  },
}));



// Mock AbortSignal for fetch timeout support
global.AbortSignal = {
  timeout: jest.fn().mockImplementation((timeout) => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    aborted: false,
    reason: undefined,
  })),
} as any;

// Mock setImmediate for React Native
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || global.clearTimeout;

// Global test timeout
jest.setTimeout(10000);