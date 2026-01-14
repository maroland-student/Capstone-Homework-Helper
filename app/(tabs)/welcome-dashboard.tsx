import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";


import { useSession } from '@/lib/auth-client';

const formatString = (str: string): string => {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function WelcomeDashboardScreen() {
    const { data: session } = useSession();
    const [ roleString, setRoleString ] = useState<string>("Unknown");
    const [ isRoleLoading, setRoleLoading] = useState<boolean>(true);

    useEffect(() => {
        setRoleString("");
        setRoleLoading(true);

        let fetchRole = (async () => {
            const role = await getRole();
            if(role === "unknown" || role === "") {
                setRoleString("There was an error retrieving your user role. Please contact support.");
            }else{
                setRoleString(`You are logged in as a ${formatString(role)}`);
            }

            setRoleLoading(false);
        });
        fetchRole();
    }, [session]);
        

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#a265b4ff', dark: '#4a2556ff' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080ff"
                    name="chevron.left.forwardslash.chevron.right"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
                    Welcome to your Dashboard, {formatString(session?.user?.name ?? 'User')}!
                </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.bodyContainer}>
                <ThemedText type="subtitle">
                    {roleString}
                </ThemedText>
                <ThemedText>
                    This is your personalized dashboard where you can access all your courses, track your progress, and manage your account settings. Explore the features available to you and make the most out of your learning experience!
                </ThemedText>
            </ThemedView>
            
        </ParallaxScrollView>
    );
}

const getRole = async (): Promise<string> => {
    try {
        //Log.log("Fetching user role...", LogLevel.INFO);
        console.log("Fetching user role...");
        // Stubbing out for now
        return Promise.resolve("teacher");
    } catch (error: any) {
        return ''
    }
}

const styles = StyleSheet.create({
    headerImage: { color: '#cd8ec2ff', bottom: -90, left: -35, position: 'absolute' },
    titleContainer: { flexDirection: 'row', gap: 8 },
    bodyContainer: { marginTop: 20  },
});