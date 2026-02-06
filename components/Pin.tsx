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
    dismiss,

}: {
    pinned: PinData | null;
    clear: () => void;
    dismiss: () => void;



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
                        Pinned Info: {pinned?.typeOfInfo ? ` ${pinned.typeOfInfo.toUpperCase()}` : ""}
                    </Text>

                    <Text style={styles.label}>
                        {pinned?.title ? pinned.title : "Press the 'Pin' Button to Pin something :)"}
                    </Text>
                </View>

                <View style ={styles.titleRight}>
                    <Pressable 
                        onPress={dismiss} 
                        style={styles.dismissButton}>
                            <Text style={styles.dismissButtonText}>
                                Dismiss
                            </Text>
                        </Pressable>
                

                <Pressable
                        onPress={clear}
                        disabled={empty}
                        style={[styles.clearButton, empty ? styles.clearButtonDisabled : null]}
                >
                    <Text style={styles.clearButtonText}> Clear </Text>
                </Pressable>
                </View>


            </View>

    <View style={styles.bodyScroll}>
        <Text style={styles.main}>
            {pinned?.body ? pinned.body : "Pin a Step to Keep it visible while you solve"}

            </Text>
            </View>

        </View>
    

    )


}

const styles = StyleSheet.create({

    container: {
        width: "100%",
        minWidth: 240,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.35)",
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.95)",

        shadowColor: "#7C3AED",
        shadowOffset: {width:0, height: 10},
        shadowRadius: 20,
        elevation: 5,

        maxHeight: 300,

        
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
        flexShrink: 1,
    },


    label:{
        fontSize: 7,
        fontWeight: "400",
        color: "rgba(107, 70, 193, 0.9)",
        marginBottom: 5,
    },


    main:{
        padding: 8,
        fontSize: 10,
        color: "#1D1D1F",
        lineHeight: 14,

    },

    clearButton: {
        marginLeft: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.3)",
        backgroundColor: "rgba(167, 139, 250, 0.15)",

        width: 50,
        height: 30,
        
        padding: 10,

        alignItems: "center",
        justifyContent: "center",
        


    },

    clearButtonDisabled: {
        opacity: 0.5,
    },

    clearButtonText: {
        color: "#7C3AED",
        fontSize: 5,
        fontWeight: "800",

    },
    bodyScroll: {
        overflow: "scroll",
        maxHeight: 220,
    },
    titleRight: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
    },
    dismissButton:{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.2)",
        backgroundColor: "rgba(167, 139, 250, 0.1)",

        width: 50,
        height: 30,

        padding: 10,

        alignItems: "center",
        justifyContent: "center",
    },
    dismissButtonText:{
        color: "rgba(107, 70, 193, 0.9)",
        fontSize: 5,
        fontWeight: "700",

    

    },








})