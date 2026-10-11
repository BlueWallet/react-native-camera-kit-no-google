import { useState } from 'react';
import {
  Platform,
  TextInput,
  Button,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { detectQRCodeInImage } from 'react-native-camera-kit-no-google';
import SafeAreaView from './SafeAreaView';

const DetectQRExample = ({ onBack }: { onBack: () => void }) => {
  const [base64Input, setBase64Input] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [result, setResult] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onPickImage = async () => {
    setResult(undefined);
    setError(undefined);

    const { launchImageLibrary } = await import('react-native-image-picker');
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: true,
    });

    if (response.didCancel || !response.assets?.length) return;

    const asset = response.assets[0];
    setImageUri(asset.uri);

    const base64 = asset.base64;
    if (!base64) {
      setError('No base64 data returned from image picker');
      return;
    }

    setLoading(true);
    try {
      const decoded = await detectQRCodeInImage(base64);
      setResult(decoded === null ? '(no QR code found)' : decoded);
    } catch (e: any) {
      setError(e.message ?? 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detect QR from Image</Text>
        <View style={{ width: 50 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {Platform.OS === 'macos' ? (
          <View style={{ width: '100%' }}>
            <TextInput
              multiline
              value={base64Input}
              onChangeText={setBase64Input}
              placeholder="Paste a base64 image or data URI"
              placeholderTextColor="#aaa"
              style={{ color: 'white', minHeight: 100, borderColor: '#777', borderWidth: 1, padding: 12 }}
            />
            <Button
              title="Decode QR image"
              disabled={loading || !base64Input}
              onPress={async () => {
                setLoading(true);
                setError(undefined);
                setResult(undefined);
                try {
                  setResult((await detectQRCodeInImage(base64Input)) ?? '(no QR code found)');
                } catch (e) {
                  setError(String(e));
                } finally {
                  setLoading(false);
                }
              }}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.pickButton} onPress={onPickImage}>
            <Text style={styles.pickButtonText}>Pick Image</Text>
          </TouchableOpacity>
        )}

        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />}

        {loading && <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />}

        {result !== undefined && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Decoded:</Text>
            <Text style={styles.resultValue} selectable>
              {result}
            </Text>
          </View>
        )}

        {error !== undefined && (
          <View style={[styles.resultBox, styles.errorBox]}>
            <Text style={styles.resultLabel}>Error:</Text>
            <Text style={styles.errorValue}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DetectQRExample;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  pickButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  preview: {
    width: 280,
    height: 280,
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#3a1a1a',
  },
  resultLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  resultValue: {
    color: '#4caf50',
    fontSize: 16,
  },
  errorValue: {
    color: '#f44336',
    fontSize: 16,
  },
});
