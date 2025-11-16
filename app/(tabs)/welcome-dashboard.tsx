import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

export default function WelcomeDashboardScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#a265b4ff', dark: '#4a2556ff' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080ff"
                    name="chevron.left.forwardslash.chevron.right"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
                    Dashboard
                </ThemedText>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: { color: '#cd8ec2ff', bottom: -90, left: -35, position: 'absolute' },
    titleContainer: { flexDirection: 'row', gap: 8 },
});