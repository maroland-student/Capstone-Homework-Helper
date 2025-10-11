import React from 'react';
import { StyleSheet, View } from "react-native";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';


// Expandable list in the future with more 'correct' info
const faq = [

    {
        question: "Question 1...",
        answer: "Answer 1..."
    },

    {
        question: "Question 2...",
        answer: "Answer 2..."
    },

    {
        question: "Question 3...",
        answer: "Answer 3..."
    },

    {
        question: "Question 4...",
        answer: "Answer 4..."
    },

    {
        question: "Question 5...",
        answer: "Answer 5..."
    },



];


export default function FAQ() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }} 
            headerImage={<View style={{ height: 200, width : 200}} />} >

        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">FAQ about the AI Homework Helper</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
            <ThemedText style={styles.body}> This is the body </ThemedText>
        </ThemedView>

        {faq.map((item) => (
            <Collapsible key={item.question} title={item.question}>
                <ThemedText style={styles.body}>{item.answer}</ThemedText>
            </Collapsible>
        ))}
        </ParallaxScrollView>
    );
}


///// CSS stuff 

const styles = StyleSheet.create( {


    titleContainer: {
        flexDirection: "row",
        gap: 10
    },

    section: {
        gap: 10
    },

    body: {
        lineHeight: 20
    }

});