import React from 'react';
import { StyleSheet, View } from "react-native";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';


//let  email = "AIHomeworkHelper@asu.edu";
//let phoneNumber = "123-456-7890";
//let website = "https://supportHelp@asu.edu";


export default function ContactScreen() {
    return(

        //// Titles

        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47'}}
            headerImage={<View style={{ height: 200}}    /> }
        >

        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title"> Contact Us: </ThemedText>
        </ThemedView>


        

        <ThemedView style={styles.section}>
            <ThemedText style={styles.subtitle}>
                Question? Comments? Concerns? Advice? Upset for no reason? 
            </ThemedText>
        </ThemedView>

        <ThemedView style={styles.trait}>
            <ThemedText type ="subtitle">Email:</ThemedText>
            <ThemedText style={styles.traitValue}>"AIHomeworkHelper@asu.edu"</ThemedText>
        </ThemedView>

        <ThemedView style={styles.trait}>
            <ThemedText type ="subtitle">Phone Number:</ThemedText>
            <ThemedText style={styles.traitValue}>"123-456-7890"</ThemedText>
        </ThemedView>

        <ThemedView style={styles.trait}>
            <ThemedText type ="subtitle">Website: </ThemedText>
            <ThemedText style={styles.traitValue}>"https://supportHelp@asu.edu"</ThemedText>
        </ThemedView>

        <ThemedView style={styles.trait}>
            <ThemedText type ="subtitle">Address: </ThemedText>
            <ThemedText style={styles.traitValue}>"999 Galaxy Way, Mars, Milky Way "</ThemedText>
        </ThemedView>

        <ThemedView style={styles.trait}>
            <ThemedText type ="subtitle">Hours of Operation: </ThemedText>
            <ThemedText style={styles.traitValue}>Mon - Thurs: 9:00 - 16:00 (PST) {'\n'} 
                Fri - Sun : Closed </ThemedText>
        </ThemedView>
        </ParallaxScrollView>



    )
}

////// CSS Constants / Decoration ///////
const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row', 
        gap: 10
    },
    section: {
        gap: 10, 
        padding: 3
    },
    subtitle: {
        lineHeight: 20,
        padding: 5
    },
    trait: {
        gap: 10,
        padding: 3
    },
    traitValue: {
        lineHeight: 15, 
        padding: 3
    },
    

});
