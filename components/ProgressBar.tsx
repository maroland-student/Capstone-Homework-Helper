import { useState } from "react";
import { DimensionValue, View } from "react-native";

interface ProgressBarProps {
    label: string,
    value: number,
    color: string,
    width?: number | DimensionValue;
    height?: number | DimensionValue;
    backgroundColor?: string,
    borderRadius?: number,
    useLabel?: boolean
}


export default function ProgressBar({
    label,
    value,
    color,
    width = 100,
    height = 8,
    backgroundColor = "#eee",
    borderRadius = 4,
    useLabel = true,
}: ProgressBarProps){
    // Data validation
    if (value < 0)
        value = 0;
    if (value > 100)
        value = 100;

    const [containerWidth, setContainerWidth] = useState(0);
    const [barWidth, setBarWidth] = useState(0);

    var displayValue = value;
    var midRadius = borderRadius;
    var opacity = 1;

    if(containerWidth - barWidth <= borderRadius)
        midRadius = borderRadius - containerWidth + barWidth;
    else
        midRadius = 0;

    if(value == 0)
        opacity = 0;
    else if(borderRadius / containerWidth * 100 > value){
        opacity = 1;
        displayValue = borderRadius / containerWidth * 100;
    }

    // Return component
    return (
        <View 
            style={{ width: width, backgroundColor: `${backgroundColor}`, borderRadius: borderRadius}}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
            <View
                style={{
                    width: `${displayValue}%`,
                    height: height,
                    backgroundColor: color,
                    borderRadius: borderRadius,
                    borderTopRightRadius: midRadius,
                    borderBottomRightRadius: midRadius,
                    opacity: opacity
                }}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
            />
        </View>
    );
}