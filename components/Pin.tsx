import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';


export type PinData = {
    title: string;
    body: string;
    typeOfInfo?: 'step' | 'hint';


}


export default function Pin({

    pinned,
    clear,

}: {
    pinned: PinData | null;
    clear: () => void;



}) {

    let empty: boolean;

    if (pinned === null) {
        empty = true;
    }
    else {
        empty = false;
    }


   return (

        <View style={styles.container}>
        <View style={styles.accent} />

            <View style={styles.title}>
                <View style={styles.titleLeft}>
                    <Text style={styles.label}>
                        Pinned: {pinned?.typeOfInfo ? ` ${pinned.typeOfInfo.toUpperCase()}` : ""}
                    </Text>

                    <Text style={styles.label}>
                        {pinned?.title ? pinned.title : "No Pins. Press the 'Pin' Button to Pin something :)"}
                    </Text>

                </View>

                <Pressable
                        onPress={clear}
                        disabled={empty}
                        style={[styles.clearButton, empty ? styles.clearButtonDisabled : null]}
                >
                    <Text style={styles.clearButtonText}> X </Text>
                </Pressable>


            </View>


        <Text style={styles.main}>
            {pinned?.body ? pinned.body : "Pin a Step to Keep it visible while you solve"}

            </Text>

        </View>
    

    )


}

const styles = StyleSheet.create({

    container: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.35)",
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.95)",

        shadowColor: "#7C3AED",
        shadowOffset: {width:0, height: 10},
        shadowRadius: 20,
        elevation: 5,

        
    },
    accent: {
        height: 10,
        backgroundColor: "#7C3AED",
    },
    title: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",

        padding: 16,
    },
    titleLeft: {
        paddingRight: 10,
    },


    label:{
        fontSize: 12,
        fontWeight: "600",
        color: "rgba(107, 70, 193, 0.9)",
        marginBottom: 5,
    },


    main:{
        padding: 10,
        fontSize: 14,
        color: "#1D1D1F",

    },

    clearButton: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.3)",
        backgroundColor: "rgba(167, 139, 250, 0.15)",
        
        padding: 10,
        


    },

    clearButtonDisabled: {
        opacity: 0.5,
    },

    clearButtonText: {
        color: "#7C3AED",
        fontSize: 16,
        fontWeight: "800",
        

        lineHeight: 10,

    },








})