import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import type { PermissionStatus } from "expo-modules-core";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, View, Modal, Text } from "react-native";

export default function CameraCapture({
  onCapture,
  allowSave = false,
}: {
  onCapture: (u: string) => void;
  allowSave?: boolean;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [libPerm, setLibPerm] = useState<PermissionStatus | null>(null);

  const [stage, setStage] = useState<false | "uploading" | "processing">(false);
  const ref = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      if (allowSave) {
        const p = await MediaLibrary.requestPermissionsAsync(true);
        setLibPerm(p.status);
      } else {
        setLibPerm(null);
      }
    })();
    // re-run if allowSave flips or camera permission state changes
  }, [allowSave, permission?.granted]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Button title="Grant camera permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  const snap = async () => {
    if (!ref.current || stage) return;
    try {

      setStage("uploading");
      const photo = await ref.current.takePictureAsync({ quality: 0.9 });

      // Sim Upload for 2s
      await new Promise((r) => setTimeout(r, 2000));

      if (allowSave && libPerm === "granted") {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      setStage("processing");

      // Sim Process for 2s
      await new Promise((r) => setTimeout(r,2000));

      setStage(false);
      await new Promise(r => setTimeout(r, 100));

      onCapture(photo.uri);
    } catch (e: any) {
      Alert.alert("Capture failed", e?.message ?? "Unknown error");
    } finally {
      setStage(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={ref} facing="back" style={styles.camera}>
        <View style={styles.controls}>
          <Button title={stage ? "..." : "Snap"} onPress={snap} />
        </View>
      </CameraView>



      <Modal visible={!!stage} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlayBackground}>
          <View style={styles.overlayBoundCard}>


            <ActivityIndicator size="large" />

            <Text style={styles.overlayTitle}>
              {stage === "uploading" ? "Uploading Your Photo..." : "Processing Your Photo..."}
            </Text>
            <Text style={styles.overlaySub}>Just A Moment Please...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, backgroundColor: "#00000" 
  },
  
  camera: { 
    flex: 1, justifyContent: "flex-end" 
  },
  
  controls: { 
    padding: 16, backgroundColor: "rgba(0,0,0,0.25)" 
  },

  center: { 
    flex: 1, alignItems: "center", justifyContent: "center" 
  },

  preview: {
    ...StyleSheet.absoluteFillObject,
  },

  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", 
    alignItems: "center", 
    padding: 24,

  },

  overlayBoundCard: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "darkgray",
    borderRadius: 14, 
    padding: 20,
    alignItems: "center",
  },

  overlayTitle: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: "600"
  },

  overlaySub: {
    marginTop: 8, 
    fontSize: 12,
    opacity: 0.75
  },

});
