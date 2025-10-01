import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import type { PermissionStatus } from "expo-modules-core";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, View } from "react-native";

export default function CameraCapture({
  onCapture,
  allowSave = false,
}: {
  onCapture: (u: string) => void;
  allowSave?: boolean;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [libPerm, setLibPerm] = useState<PermissionStatus | null>(null);
  const [busy, setBusy] = useState(false);
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
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Button title="Grant camera permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  const snap = async () => {
    if (!ref.current || busy) return;
    try {
      setBusy(true);
      const photo = await ref.current.takePictureAsync({ quality: 0.9 });
      if (allowSave && libPerm === "granted") {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      onCapture(photo.uri);
    } catch (e: any) {
      Alert.alert("Capture failed", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <CameraView ref={ref} facing="back" style={s.camera}>
        <View style={s.controls}>
          <Button title={busy ? "..." : "Snap"} onPress={snap} />
        </View>
      </CameraView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1, justifyContent: "flex-end" },
  controls: { padding: 16, backgroundColor: "rgba(0,0,0,0.25)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
