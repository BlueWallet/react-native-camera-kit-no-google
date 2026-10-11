import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Button, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Camera,
  CameraType,
  getCameraDevices,
  type CameraDevice,
  type ResizeMode,
} from 'react-native-camera-kit-no-google';

import { checkCameraAccess, requestCameraAccess } from './permissions';

const macos = Platform.OS === 'macos';

export default function QRScannerExample({ onBack }: { onBack: () => void }) {
  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [permission, setPermission] = useState(false);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceID, setDeviceID] = useState<string>();
  const [scanning, setScanning] = useState(true);
  const [visible, setVisible] = useState(true);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('cover');
  const [lastQR, setLastQR] = useState('—');
  const [events, setEvents] = useState(0);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const [allowed, cameras] = await Promise.all([
        checkCameraAccess(),
        macos ? getCameraDevices() : Promise.resolve([]),
      ]);
      setPermission(allowed);
      setDevices(cameras);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setError('');
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const disconnected = deviceID !== undefined && !devices.some((d) => d.id === deviceID);
  const status = !permission
    ? 'Camera permission not granted'
    : disconnected
    ? 'Camera disconnected'
    : macos && devices.length === 0
    ? 'No cameras available'
    : visible
    ? 'Camera open'
    : 'Camera closed';

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>CameraKit · {Platform.OS} · QR</Text>
      <View style={styles.row}>
        <Button title="Back" onPress={onBack} />
        <Text style={styles.text}>{status}</Text>
        <Button
          title="Request permission"
          onPress={async () => {
            try {
              const allowed = await requestCameraAccess();
              setPermission(allowed);
              setError(allowed ? '' : 'Allow camera access for this app in system settings.');
              await refresh();
            } catch (e) {
              setError(String(e));
            }
          }}
        />
        {macos && <Button title="Refresh cameras" onPress={refresh} />}
        <Button
          title={visible ? 'Close camera' : 'Open camera'}
          onPress={() => {
            setVisible(!visible);
            setError('');
          }}
        />
      </View>
      {macos ? (
        <ScrollView horizontal style={styles.devices}>
          {[{ id: '', name: 'System default' }, ...devices].map((device) => (
            <Button
              key={device.id}
              title={`${(deviceID ?? '') === device.id ? '✓ ' : ''}${device.name}`}
              onPress={() => {
                setDeviceID(device.id || undefined);
                setError('');
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <Button
          title={`Camera: ${cameraType}`}
          onPress={() => setCameraType(cameraType === CameraType.Back ? CameraType.Front : CameraType.Back)}
        />
      )}
      <View style={styles.row}>
        <Switch value={scanning} onValueChange={setScanning} />
        <Text style={styles.text}>Scanning · 100 ms interval</Text>
        {Platform.OS !== 'android' && (
          <Button
            title={`Preview mode: ${resizeMode}`}
            onPress={() => setResizeMode(resizeMode === 'cover' ? 'contain' : 'cover')}
          />
        )}
      </View>
      <Text style={styles.error}>{error}</Text>
      <View style={styles.preview}>
        {permission && visible ? (
          <Suspense fallback={<Text style={styles.text}>Loading…</Text>}>
            <Camera
              style={StyleSheet.absoluteFill}
              cameraDeviceId={deviceID}
              cameraType={cameraType}
              scanBarcode={scanning}
              scanThrottleDelay={100}
              resizeMode={resizeMode}
              allowedBarcodeTypes={['qr']}
              onCameraDevicesChanged={refresh}
              onError={(event) => setError(event.nativeEvent.errorMessage)}
              onReadCode={(event) => {
                setLastQR(event.nativeEvent.codeStringValue);
                setEvents((count) => count + 1);
                setError('');
              }}
            />
          </Suspense>
        ) : (
          <Text style={styles.placeholder}>{status}</Text>
        )}
      </View>
      <Text style={styles.text}>Events: {events} · Last QR:</Text>
      <ScrollView style={styles.result}>
        <Text testID="barcode-result" selectable style={styles.text}>
          {lastQR}
        </Text>
      </ScrollView>
      <Text style={styles.text}>Animated QR: each frame is sent to the app; the app assembles the sequence.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 20, gap: 12, backgroundColor: '#f4f4f5' },
  text: { color: '#161616' },
  title: { fontSize: 24, fontWeight: '600', color: '#161616' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  devices: { maxHeight: 40 },
  preview: { flex: 1, minHeight: 160, backgroundColor: '#111', overflow: 'hidden' },
  placeholder: { color: 'white', padding: 20 },
  error: { color: '#b42318' },
  result: { maxHeight: 90 },
});
