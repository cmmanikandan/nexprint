import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, RadioButton, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

type PrintType = 'color' | 'black_white';
type PrintSide = 'single' | 'double';
type PaperSize = 'A4' | 'A3' | 'Letter';

export default function UploadScreen() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; uri: string } | null>(null);
  const [printType, setPrintType] = useState<PrintType>('black_white');
  const [printSide, setPrintSide] = useState<PrintSide>('single');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [copies, setCopies] = useState('1');
  const [pages, setPages] = useState('');

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setFile({ name: result.assets[0].name, uri: result.assets[0].uri });
    }
  };

  const copiesNum = parseInt(copies) || 1;
  const pagesNum = parseInt(pages) || 1;
  const totalPages = pagesNum * copiesNum;
  const pricePerPage = printType === 'color' ? 2 : 0.5;
  const estimatedPrice = totalPages * pricePerPage;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>Select file and configure print options</Text>
      </View>

      <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
        {file ? (
          <View>
            <Text style={styles.fileIcon}>📄</Text>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.changeText}>Tap to change file</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.uploadIcon}>☁️</Text>
            <Text style={styles.uploadText}>Tap to select document</Text>
            <Text style={styles.uploadHint}>PDF, JPG, PNG supported</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Print Options</Text>

        <Card style={styles.optionCard}>
          <Text style={styles.optionLabel}>Color / Black & White</Text>
          <RadioButton.Group onValueChange={(v) => setPrintType(v as PrintType)} value={printType}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Black & White" value="black_white" color="#2563EB" />
              <RadioButton.Item label="Color" value="color" color="#2563EB" />
            </View>
          </RadioButton.Group>
        </Card>

        <Card style={styles.optionCard}>
          <Text style={styles.optionLabel}>Single or Double Side</Text>
          <RadioButton.Group onValueChange={(v) => setPrintSide(v as PrintSide)} value={printSide}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Single" value="single" color="#2563EB" />
              <RadioButton.Item label="Double" value="double" color="#2563EB" />
            </View>
          </RadioButton.Group>
        </Card>

        <Card style={styles.optionCard}>
          <Text style={styles.optionLabel}>Paper Size</Text>
          <RadioButton.Group onValueChange={(v) => setPaperSize(v as PaperSize)} value={paperSize}>
            <RadioButton.Item label="A4" value="A4" color="#2563EB" />
            <RadioButton.Item label="A3" value="A3" color="#2563EB" />
            <RadioButton.Item label="Letter" value="Letter" color="#2563EB" />
          </RadioButton.Group>
        </Card>

        <View style={styles.row}>
          <TextInput
            label="Number of pages"
            value={pages}
            onChangeText={setPages}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Copies"
            value={copies}
            onChangeText={setCopies}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
          />
        </View>
      </View>

      <Card style={styles.priceCard}>
        <Card.Content>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Estimated price</Text>
            <Text style={styles.priceValue}>₹{estimatedPrice.toFixed(2)}</Text>
          </View>
          <Text style={styles.priceDetail}>
            {totalPages} pages × ₹{pricePerPage}/page
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => router.push('/shop/1')}
        style={styles.button}
        contentStyle={styles.buttonContent}
        disabled={!file}
      >
        Select Print Shop
      </Button>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  uploadArea: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  uploadIcon: { fontSize: 48, marginBottom: 8 },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  uploadHint: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  fileIcon: { fontSize: 48, marginBottom: 8 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  changeText: { fontSize: 13, color: '#2563EB', marginTop: 4 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  optionCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  optionLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', paddingHorizontal: 16, paddingTop: 16 },
  radioRow: { flexDirection: 'row' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  input: { flex: 1, backgroundColor: 'white' },
  priceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  priceValue: { fontSize: 24, fontWeight: '800', color: 'white' },
  priceDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  button: { marginHorizontal: 20, borderRadius: 16, backgroundColor: '#22C55E' },
  buttonContent: { paddingVertical: 12 },
});
