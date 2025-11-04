import { View } from "react-native";

interface ProgressBarProps {
    label: string,
    value: number,
    color: string,
}

export default function ProgressBar({
    label,
    value,
    color
}: ProgressBarProps){
    // Data validation
    if (value < 0)
        value = 0;
    if (value > 100)
        value = 100;

    // Return component
    return (
        <View style={{ width: "100%", backgroundColor: "#eee" }}>
            <View
                style={{
                    width: `${value}%`,
                    height: 8,
                    backgroundColor: `${color}`,
                    borderRadius: 4,
                }}
            />
        </View>
    );
}