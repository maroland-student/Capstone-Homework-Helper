import { Image } from "expo-image";
import { useState } from "react";
import { Button, Modal, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

import CameraCapture from "@/components/CameraCapture";
import ProgressBar from "@/components/ProgressBar";

let lastRandom = "";
function randomColor(): string{
  const h = Math.random(); // hue [0,1)
  const s = 1;             // max saturation
  const v = 1;             // max value

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  let generated = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
  if(generated == lastRandom)
    return randomColor();
  lastRandom = generated;
  return generated;
}

export default function TabTwoScreen() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const testValues = [0, 1, 25, 50, 80, 99, 100];
  const testWidth = [20, 50, 100];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Explore
        </ThemedText>
      </ThemedView>

      {testValues.map((value) => {
        const color = randomColor();

        return (
          <div>
            <ThemedText type="semibold" style={{ fontFamily: Fonts.rounded }}>
              Testing value {value}
            </ThemedText>
            {
              testWidth.map((width) => (
                <div>
                  <View style={{ height: 24 }} />
                  <ProgressBar value={value} color={color} width={width} useLabel={false} />
                  <View style={{ height: 24 }} />
                  <ProgressBar value={value} color={color} width={width} useLabel={true} />
                  <View style={{ height: 24 }} />
                </div>
              ))}
          </div>
        );
      })}

      <Collapsible title="Camera demo">
        {photoUri ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: 240, borderRadius: 12 }}
              contentFit="cover"
            />
            <Button title="Retake" onPress={() => setPhotoUri(null)} />
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Button title="Open camera" onPress={() => setCameraOpen(true)} />
          </View>
        )}
      </Collapsible>

      {/* Full-screen camera modal */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCameraOpen(false)}
      >
        <View style={{ flex: 1 }}>
          <CameraCapture
            allowSave
            onCapture={(uri) => {
              setPhotoUri(uri);      // <- use this URI anywhere (upload/process/etc.)
              setCameraOpen(false);
            }}
          />
          <View style={{ position: "absolute", top: 50, right: 16 }}>
            <Button title="Close" onPress={() => setCameraOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* ...rest of your Collapsibles */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { color: '#808080', bottom: -90, left: -35, position: 'absolute' },
  titleContainer: { flexDirection: 'row', gap: 8 },
});
