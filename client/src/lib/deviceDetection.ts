// Device detection utilities

export interface DeviceInfo {
  isApple: boolean;
  isIOS: boolean;
  isMac: boolean;
  isAndroid: boolean;
  deviceType: 'iPhone' | 'iPad' | 'iPod' | 'Mac' | 'Android' | 'Windows' | 'Other';
  appStoreUrl: string;
  downloadText: string;
}

/**
 * Detect the user's device type and return relevant information
 */
export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  
  const isIPhone = /iPhone/.test(userAgent);
  const isIPad = /iPad/.test(userAgent);
  const isIPod = /iPod/.test(userAgent);
  const isMac = /Mac/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isWindows = /Windows/.test(userAgent);
  
  const isApple = isIPhone || isIPad || isIPod || isMac;
  const isIOS = isIPhone || isIPad || isIPod;
  
  let deviceType: DeviceInfo['deviceType'] = 'Other';
  if (isIPhone) deviceType = 'iPhone';
  else if (isIPad) deviceType = 'iPad';
  else if (isIPod) deviceType = 'iPod';
  else if (isMac) deviceType = 'Mac';
  else if (isAndroid) deviceType = 'Android';
  else if (isWindows) deviceType = 'Windows';
  
  // Determine app store URL and download text based on device
  let appStoreUrl: string;
  let downloadText: string;
  
  if (isApple) {
    appStoreUrl = 'https://apps.apple.com/app/mykliq/id123456789'; // Replace with actual App Store ID
    downloadText = 'download MyKliq from the App Store';
  } else if (isAndroid) {
    appStoreUrl = 'https://play.google.com/store/apps/details?id=com.mykliq.app'; // Replace with actual package name
    downloadText = 'download MyKliq from Google Play';
  } else {
    // Fallback for desktop/other devices - could show both or a landing page
    appStoreUrl = 'https://kliqlife.com';
    downloadText = 'get MyKliq mobile app';
  }
  
  return {
    isApple,
    isIOS,
    isMac,
    isAndroid,
    deviceType,
    appStoreUrl,
    downloadText
  };
};

/**
 * Get a formatted invite message based on the user's device
 */
export const getInviteMessage = (firstName: string, inviteCode: string): string => {
  const device = detectDevice();
  
  return `${firstName} wants you to join their Kliq. Use the following Invite Code ${inviteCode} and ${device.downloadText} - "A Different Social Experience"`;
};

/**
 * Get the app store URL for the current device
 */
export const getAppStoreUrl = (): string => {
  const device = detectDevice();
  return device.appStoreUrl;
};

/**
 * Get device-specific download text
 */
export const getDownloadText = (): string => {
  const device = detectDevice();
  return device.downloadText;
};