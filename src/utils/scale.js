import {Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Base design reference width (iPhone 14 Pro)
const BASE_WIDTH = 390;

export const scaleFactor = Math.min(screenWidth / BASE_WIDTH, 1);

export const fs = size => Math.round(size * scaleFactor);

export const wp = percent => Math.round((screenWidth * percent) / 100);

export const hp = percent => Math.round((screenHeight * percent) / 100);

export const screenWidth_ = screenWidth;
export const screenHeight_ = screenHeight;

export default {fs, wp, hp, scaleFactor};
