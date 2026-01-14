import { StyleSheet } from "react-native";
import { DashboardCard } from "../components/ui/dashboard-card";
import { ThemedView } from "../components/themed-view";
import { ThemedText } from "../components/themed-text";

export default function DashboardCardTest() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">TESTING TESTING TESTING</ThemedText>
        
        <DashboardCard
            testID="testing"
            title="Profile"
            description="Here is a card for a personal profile."
            onPress={() => console.log("You pressed the button good job")}
            />
        </ThemedView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1, 
        padding: 20,
        gap: 10
    },

})