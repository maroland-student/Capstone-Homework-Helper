import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet } from "react-native";

import Log, { LogLevel } from "@/server/utilities/toggle_logs";
import {  useSession } from '@/lib/auth-client';

export default function WelcomeDashboardScreen() {
    const { data: session, isLoading } = useSession();
    const [ role, setRole ] = useState<string>("Unknown");

    useEffect(() => {
        if (session?.user?.role ))

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

const getRole = async (): Promise<string> => {
    try {
        Log.log("Fetching user role...", LogLevel.INFO);

        const { data: session } = useSession();
        // Finish the method...

        return '';
    } catch (error: any) {
        // Don't worry about error checking for now
        return ''
    }
}

const styles = StyleSheet.create({
    headerImage: { color: '#cd8ec2ff', bottom: -90, left: -35, position: 'absolute' },
    titleContainer: { flexDirection: 'row', gap: 8 },
});