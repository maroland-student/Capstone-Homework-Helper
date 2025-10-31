import { View } from "react-native";

type ProgressBarProps = {
    label: string,
    value: number,
    color: string,

}

export default function ProgressBar(props: ProgressBarProps) {
    // Data validation
    var value = props.value;
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
                    backgroundColor: `${props.color}`,
                    borderRadius: 4,
                }}
            />
        </View>
    );
}