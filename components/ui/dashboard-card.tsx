import { Pressable, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { useState } from "react";


type DashboardCardAtts = {
    title: string;
    description: string;
    onPress?: () => void;
    testID?: string;
    style?: ViewStyle;
};

export function DashboardCard({
    title,
    description,
    onPress,
    testID,
    style,

}: DashboardCardAtts) {

    const [isHovered, setIsHovered] = useState(false);
    
    const card = (
        <ThemedView
            testID={testID}
            lightColor="#ffffff"
            darkColor="#1C1C1E"
            style={[styles.card, isHovered && styles.cardHover, style]}
            accessibilityRole={onPress ? "button" : undefined}
        >

        <View style={styles.headerRow}>
            <View style={styles.accentDot} />
        
            <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
                {title}
            </ThemedText>

        </View>
            
            {!!description && (
                <ThemedText style={styles.description} numberOfLines={2}>
                    {description}
                </ThemedText>
            )}

            <View style={styles.footerRow}>
                <ThemedText style={styles.footerText}>
                    {onPress ? "Open ->" : ""}
                </ThemedText>
            </View>
            </ThemedView>
    );

    if (!onPress) {
        return card;
    }

    return (
        <Pressable
            onPress={onPress}


            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}


            style={({pressed}) => [
                styles.pressable, pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            >
                {card}
            </Pressable>
    )
}
       



const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: "rgba(10,126,164, 0.18)",
        backgroundColor: "rgba(10,126,164, 0.06)",
        borderRadius: 14,
        padding: 12,
        maxWidth: 320,
        gap: 7,

        justifyContent: "space-between",
        alignItems: "stretch",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0, height: 6
        },

        elevation: 2,
    },




    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    accentDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#0a7ea4",
        opacity: 0.85,
    },



    
    title: {
        fontSize: 16, 
        lineHeight: 18,
        color: "#0a7ea4",
        textAlign: "left",
        flexShrink: 1,

    },

    cardHover: {
        transform: [{ translateY: -2}, {scale: 1.05}],
        shadowOpacity: 0.12,
        shadowRadius: 13,
        elevation: 4,

        borderColor: "rgba(10,126,164,0.3)",
        backgroundColor:  "rgba(10,126,164,0.1)",
    },



    description: {
        fontSize: 10,
        fontStyle: "italic",
        opacity: 0.9,
        textAlign: "left",
        lineHeight: 18,
    },

    footerRow: {
        marginTop: 4,
        alignItems: "flex-end",
    },
    footerText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#34C759",
        opacity: 0.9,
    },
    
    pressable: {
        borderRadius: 16,
    },

    pressed: {
        opacity: 0.8,
        transform: [{ scale: 1.05}],
    }

});