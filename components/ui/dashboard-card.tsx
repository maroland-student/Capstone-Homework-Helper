import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";


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
    
    const card = (
        <ThemedView
            testID={testID}
            lightColor="#ffffff"
            style={[styles.card, style]}
            accessibilityRole={onPress ? "button" : undefined}
        >
            <ThemedView
                lightColor="transparent"
                style={styles.header}
            >
            <ThemedText type="defaultSemiBold" style={styles.title}>
                {title}
            </ThemedText>
            </ThemedView>

            {description ? (
                <ThemedText style={styles.description}>
                    {description}
                </ThemedText>
            ) : null}
            </ThemedView>
    );


    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                {card}
            </TouchableOpacity>
        )
    }

    return card;

}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1, 
        borderColor: "red",
        borderRadius: 14,
        padding: 12,
        gap: 7,

        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0, height: 6
        },
    },

    header: {
        flexDirection: "row", 
        alignItems: "center",
        gap: 10,
    },
    title: {
        fontSize: 16, 
        lineHeight: 18,

    },
    description: {
        opacity: 0.9,
    },

});