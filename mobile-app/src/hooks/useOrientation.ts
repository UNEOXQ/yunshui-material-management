import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface OrientationInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export const useOrientation = (): OrientationInfo => {
  const [orientation, setOrientation] = useState<OrientationInfo>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
      isPortrait: height > width,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      setOrientation({
        width,
        height,
        isLandscape: width > height,
        isPortrait: height > width,
      });
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
};