import { Pressable, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
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
            <ThemedText type="defaultSemiBold" style={styles.title}>
                {title}
            </ThemedText>
            
            {!!description && (
                <ThemedText style={styles.description} numberOfLines={2}>
                    {description}
                </ThemedText>
            )}
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
        borderColor: "#BEBDB8",
        backgroundColor: "#808588",
        borderRadius: 14,
        padding: 12,
        maxWidth: 320,
        gap: 7,

        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0, height: 6
        },
    },

    
    title: {
        fontSize: 16, 
        lineHeight: 18,
        color: "#D6CFC7",
        textAlign: "center",

    },

    cardHover: {
        transform: [{ translateY: -2}, {scale: 1.05}],
        shadowOpacity: 0.12,
        shadowRadius: 13,
        elevation: 4,
    },



    description: {
        fontSize: 10,
        fontStyle: "italic",
        opacity: 0.9,
        textAlign: "center",
    },
    
    pressable: {
        borderRadius: 16,
    },

    pressed: {
        opacity: 0.8,
        transform: [{ scale: 1.05}],
    }

});