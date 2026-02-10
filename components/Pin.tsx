import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';

const BASE_WIDTH = 320;

export type PinData = {
    title: string;
    body: string;
    typeOfInfo?: 'step' | 'hint';
};

export default function Pin({
    pinned,
    clear,
    dismiss,
}: {
    pinned: PinData | null;
    clear: () => void;
    dismiss: () => void;
}) {
    const [scale, setScale] = useState(1);

    const onLayout = useCallback((e: any) => {
        const { width } = e.nativeEvent?.layout ?? {};
        if (typeof width === 'number' && width > 0) {
            setScale(width / BASE_WIDTH);
        }
    }, []);

    const empty = pinned === null;

    const s = scale;
    const scaled = {
        accentHeight: Math.round(10 * s),
        titlePadding: Math.round(16 * s),
        titleRightPadding: Math.round(10 * s),
        labelFontSize: Math.max(10, Math.round(14 * s)),
        labelMarginBottom: Math.round(5 * s),
        mainPadding: Math.round(12 * s),
        mainFontSize: Math.max(12, Math.round(16 * s)),
        mainLineHeight: Math.round(20 * s),
        buttonMarginLeft: Math.round(8 * s),
        buttonBorderRadius: Math.round(12 * s),
        buttonWidth: Math.round(56 * s),
        buttonHeight: Math.round(34 * s),
        buttonPadding: Math.round(10 * s),
        buttonFontSize: Math.max(10, Math.round(14 * s)),
        containerBorderRadius: Math.round(24 * s),
        containerBorderWidth: Math.max(1, Math.round(1.5 * s)),
    };

    return (
        <View
            style={[
                styles.container,
                {
                    borderRadius: scaled.containerBorderRadius,
                    borderWidth: scaled.containerBorderWidth,
                },
            ]}
            onLayout={onLayout}
        >
            <View style={[styles.accent, { height: scaled.accentHeight }]} />
            <View style={[styles.title, { padding: scaled.titlePadding }]}>
                <View style={[styles.titleLeft, { paddingRight: scaled.titleRightPadding }]}>
                    <Text style={[styles.label, { fontSize: scaled.labelFontSize, marginBottom: scaled.labelMarginBottom }]}>
                        Pinned Info: {pinned?.typeOfInfo ? ` ${pinned.typeOfInfo.toUpperCase()}` : ""}
                    </Text>
                    <Text style={[styles.label, { fontSize: scaled.labelFontSize, marginBottom: scaled.labelMarginBottom }]}>
                        {pinned?.title ? pinned.title : "Press the 'Pin' Button to Pin something :)"}
                    </Text>
                </View>
                <View style={styles.titleRight}>
                    <Pressable
                        onPress={dismiss}
                        style={[
                            styles.dismissButton,
                            {
                                borderRadius: scaled.buttonBorderRadius,
                                width: scaled.buttonWidth,
                                height: scaled.buttonHeight,
                                padding: scaled.buttonPadding,
                            },
                        ]}
                    >
                        <Text style={[styles.dismissButtonText, { fontSize: scaled.buttonFontSize }]}>
                            Dismiss
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={clear}
                        disabled={empty}
                        style={[
                            styles.clearButton,
                            {
                                marginLeft: scaled.buttonMarginLeft,
                                borderRadius: scaled.buttonBorderRadius,
                                width: scaled.buttonWidth,
                                height: scaled.buttonHeight,
                                padding: scaled.buttonPadding,
                            },
                            empty ? styles.clearButtonDisabled : null,
                        ]}
                    >
                        <Text style={[styles.clearButtonText, { fontSize: scaled.buttonFontSize }]}>
                            Clear
                        </Text>
                    </Pressable>
                </View>
            </View>
            <View style={styles.bodyScroll}>
                <Text style={[styles.main, { padding: scaled.mainPadding, fontSize: scaled.mainFontSize, lineHeight: scaled.mainLineHeight }]}>
                    {pinned?.body ? pinned.body : "Pin a Step to Keep it visible while you solve"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        width: "100%",
        minWidth: 240,
        minHeight: 200,
        height: "100%",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(167, 139, 250, 0.35)",
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        shadowColor: "#7C3AED",
        shadowOffset: {width:0, height: 10},
        shadowRadius: 20,
        elevation: 5,
        display: "flex",
        flexDirection: "column",
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
        textAlign: "center",
    },
    bodyScroll: {
        overflow: "scroll",
        flex: 1,
        minHeight: 120,
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
        textAlign: "center",
    },








})