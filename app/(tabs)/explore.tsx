import { Image } from "expo-image";
import React, { useState } from "react";
import { Button, Modal, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

// NEW
import CameraCapture from "@/components/CameraCapture";

export default function TabTwoScreen() {
  const [cameraOpen, setCameraOpen] = useState(false);


  // multiple photo empty array 
  const [photos, setPhotos] = useState<string []>([]);
  const addPhoto = (uri: string) => setPhotos(prev => prev.concat(uri));

  function createPhotoArray(uri: string, idx: number) {

    // temp for React until we actually get the image ID's
    const key = `${uri}-${idx}`;
    return (
      <View key={key} 
        style = {styles.gridItem}>
          <Image source= {{ uri }}
            style={styles.preview}
            contentFit ="cover" />
        </View>
    );
  }



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

      {/* Your existing content... */}

      <Collapsible title="Camera demo">
        <View style={{ margin: 24, }}>
          <Button title="Add Photo(s)" onPress={() => setCameraOpen(true)} />
        </View>

      
        {photos.length > 0 && (

          <View style={styles.grid}>
            {photos.map(createPhotoArray)}
          </View>
        )}


        {photos.length > 0 && (
          <View style= {{ marginTop: 12, marginHorizontal: 24}}>

            <Button title= "Clear Photos"
                    onPress={() => {

                      // array clear with reset for additional grid map**
                      setPhotos([]);
                    }}
                    />
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


              addPhoto(uri);      // <- use this URI anywhere (upload/process/etc.)
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


grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  rowGap: 16,
  justifyContent: "space-between",

  
},

gridItem: {
  width: "50%",
  overflow: "hidden",
  paddingHorizontal: 12 / 2
},

preview: {
  width: "100%",
  aspectRatio: 1,
}



});
