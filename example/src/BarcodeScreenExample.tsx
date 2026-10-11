import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  useWindowDimensions,
  Vibration,
} from 'react-native';
import Camera from '../../src/Camera';
import { type CameraApi, CameraType } from '../../src/types';
import { Orientation } from '../../src';
import SafeAreaView from './SafeAreaView';

const flashImages = {
  on: require('../images/flashOn.png'),
  off: require('../images/flashOff.png'),
  auto: require('../images/flashAuto.png'),
};

const flashArray = [
  {
    mode: 'auto',
    image: flashImages.auto,
  },
  {
    mode: 'on',
    image: flashImages.on,
  },
  {
    mode: 'off',
    image: flashImages.off,
  },
] as const;

const BarcodeExample = ({ onBack }: { onBack: () => void }) => {
  const cameraRef = useRef<CameraApi>(null);
  const [currentFlashArrayPosition, setCurrentFlashArrayPosition] = useState(0);

  const [flashData, setFlashData] = useState(flashArray[currentFlashArrayPosition]);
  const [torchMode, setTorchMode] = useState(false);
  // const [ratios, setRatios] = useState([]);
  // const [ratioArrayPosition, setRatioArrayPosition] = useState(-1);

  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [barcode, setBarcode] = useState<string>('');
  const [fps, setFps] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [scansPerSec, setScansPerSec] = useState(0);

  // FPS counter using requestAnimationFrame
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Scans per second counter
  useEffect(() => {
    const interval = setInterval(() => {
      setScansPerSec(scanCount);
      setScanCount(0);
    }, 1000);

    return () => clearInterval(interval);
  }, [scanCount]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBarcode('');
    }, 2000);
    return () => {
      clearTimeout(t);
    };
  }, [barcode]);

  // useEffect(() => {
  //   let updatedRatios = [...ratios];
  //   if (props.cameraRatioOverlay) {
  //     updatedRatios = updatedRatios.concat(props.cameraRatioOverlay.ratios || []);
  //   }
  //   setRatios(updatedRatios);
  //   setRatioArrayPosition(updatedRatios.length > 0 ? 0 : -1);
  // }, []);

  const onSwitchCameraPressed = () => {
    const direction = cameraType === CameraType.Back ? CameraType.Front : CameraType.Back;
    setCameraType(direction);
  };

  const onSetFlash = () => {
    const newPosition = (currentFlashArrayPosition + 1) % 3;
    setCurrentFlashArrayPosition(newPosition);
    setFlashData(flashArray[newPosition]);
  };

  const onSetTorch = () => {
    setTorchMode(!torchMode);
  };

  // const onRatioButtonPressed = () => {
  //   const newPosition = (ratioArrayPosition + 1) % ratios.length;
  //   setRatioArrayPosition(newPosition);
  // };

  const window = useWindowDimensions();
  const cameraRatio = 4 / 3;

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <SafeAreaView style={styles.topButtons}>
        {flashData.image && (
          <TouchableOpacity style={styles.topButton} onPress={onSetFlash}>
            <Image style={styles.topButtonImg} source={flashData.image} resizeMode="contain" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.topButton} onPress={onSwitchCameraPressed}>
          <Image style={styles.topButtonImg} source={require('../images/cameraFlipIcon.png')} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.topButton} onPress={onSetTorch}>
          <Image
            style={styles.topButtonImg}
            source={torchMode ? require('../images/torchOn.png') : require('../images/torchOff.png')}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.fpsContainer}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
          <Text style={styles.fpsText}>{scansPerSec} scans/s</Text>
        </View>
      </SafeAreaView>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.cameraPreview}
          cameraType={cameraType}
          flashMode={flashData?.mode}
          zoomMode="on"
          focusMode="on"
          scanThrottleDelay={0}
          torchMode={torchMode ? 'on' : 'off'}
          onOrientationChange={(e) => {
            // We recommend locking the camera UI to portrait (using a different library)
            // and rotating the UI elements counter to the orientation
            // However, we include onOrientationChange so you can match your UI to what the camera does
            switch (e.nativeEvent.orientation) {
              case Orientation.LANDSCAPE_LEFT:
                console.log('orientationChange', 'LANDSCAPE_LEFT');
                break;
              case Orientation.LANDSCAPE_RIGHT:
                console.log('orientationChange', 'LANDSCAPE_RIGHT');
                break;
              case Orientation.PORTRAIT:
                console.log('orientationChange', 'PORTRAIT');
                break;
              case Orientation.PORTRAIT_UPSIDE_DOWN:
                console.log('orientationChange', 'PORTRAIT_UPSIDE_DOWN');
                break;
              default:
                console.log('orientationChange', e.nativeEvent);
                break;
            }
          }}
          // ratioOverlay={ratios[ratioArrayPosition]}
          laserColor="red"
          frameColor="white"
          scanBarcode
          showFrame
          allowedBarcodeTypes={['qr', 'ean-13']}
          barcodeFrameSize={{ width: 300, height: 150 }}
          onReadCode={(event) => {
            setScanCount((prev) => prev + 1);
            setBarcode(event.nativeEvent.codeStringValue);
            console.log('barcode', event.nativeEvent.codeStringValue);
            console.log('codeFormat', event.nativeEvent.codeFormat);
          }}
        />
      </View>
      {/* {ratios.length > 0 && (
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10, paddingLeft: 20 }}>
            <Text style={styles.ratioBestText}>Your images look best at a {ratios[0] || ''} ratio</Text>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 8 }}
              onPress={() => onRatioButtonPressed()}
            >
              <Text style={styles.ratioText}>{ratios[ratioArrayPosition]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )} */}

      <SafeAreaView style={styles.bottomButtons}>
        <View style={styles.backBtnContainer}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.textStyle}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.barcodeContainer}>
          <Text testID="barcode-result" style={styles.textStyle}>
            {barcode}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default BarcodeExample;

const styles = StyleSheet.create({
  screen: {
    height: '100%',
    backgroundColor: 'black',
  },

  topButtons: {
    margin: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    backgroundColor: '#222',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonImg: {
    margin: 10,
    width: 24,
    height: 24,
  },

  cameraContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  cameraPreview: {
    aspectRatio: 3 / 4,
    width: '100%',
  },
  bottomButtons: {
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnContainer: {
    alignItems: 'flex-start',
  },
  captureButtonContainer: {},
  textNumberContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  textStyle: {
    padding: 10,
    color: 'white',
    fontSize: 20,
  },
  fpsContainer: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  fpsText: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
