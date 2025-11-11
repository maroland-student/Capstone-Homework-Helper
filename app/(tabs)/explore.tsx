import { Image } from "expo-image";
import { useState } from "react";
import { Button, Modal, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

// NEW
import CameraCapture from "@/components/CameraCapture";
import ProgressBar from "@/components/ProgressBar";

export default function TabTwoScreen() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

      <ProgressBar value={0} color="#4caf50" useLabel={true} />
      <ProgressBar value={1} color="#4caf50" useLabel={true} />
      <ProgressBar value={10} color="#4caf50" useLabel={true} />
      <ProgressBar value={50} color="#4caf50" useLabel={true} />
      <ProgressBar value={80} color="#4caf50" useLabel={true} />
      <ProgressBar value={99} color="#4caf50" useLabel={true} />
      <ProgressBar value={100} color="#4caf50" useLabel={true} />
      
      <ProgressBar value={0} color="#4caf50" useLabel={false} />
      <ProgressBar value={1} color="#4caf50" useLabel={false} />
      <ProgressBar value={10} color="#4caf50" useLabel={false} />
      <ProgressBar value={50} color="#4caf50" useLabel={false} />
      <ProgressBar value={80} color="#4caf50" useLabel={false} />
      <ProgressBar value={99} color="#4caf50" useLabel={false} />
      <ProgressBar value={100} color="#4caf50" useLabel={false} />

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
