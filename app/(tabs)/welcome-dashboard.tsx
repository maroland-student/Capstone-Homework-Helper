import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {router} from "expo-router";

import { DashboardCard } from "@/components/ui/dashboard-card";


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
            headerBackgroundColor={{ light: '#E8F0FE', dark: '#0F172A' }}
            headerImage={
               <View />
            }>

        <ThemedView style={styles.container}>
            <ThemedView style={styles.titleContainer}>


                <ThemedText type="title" style={[styles.titleText, { fontFamily: Fonts.rounded }]}>
                    Welcome to your Dashboard, {formatString(session?.user?.name ?? 'User')}!
                </ThemedText>
            </ThemedView>

            <ThemedView style={styles.mainCard}>
                <ThemedView style={styles.mainHeader}>
                    <ThemedText type="subtitle" style={styles.mainTitle}>
                        YOUR ACCOUNT
                    </ThemedText>

                    <View style={styles.mainBadge}>
                        <ThemedText style={styles.mainBadgeText}>
                            {isRoleLoading ? "..." : ":)"}
                        </ThemedText>
                    </View>
                    </ThemedView>

                <ThemedText type="subtitle" style={styles.mainRoleText}>
                    {roleString}
                </ThemedText>



                <ThemedText style={styles.mainBodyText}>
                    This is your personalized dashboard where you can access all your courses, track your progress, and manage your account settings. Explore the features available to you and make the most out of your learning experience!
                </ThemedText>
            </ThemedView>



            <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    QUICK ACTIONS
                </ThemedText>
                <ThemedText style={styles.sectionSubtitle}>
                    JUMP RIGHT BACK IN
                </ThemedText>
        </ThemedView>

        <ThemedView style={styles.cardsGrid}>

       
                <DashboardCard
                    title = "My Courses"
                    description="Pick up where you left off"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/subjects")}
                />

                <DashboardCard
                    title = "Stats"
                    description="View information about your learning"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />

                <DashboardCard
                    title = "Account Settings"
                    description="Update Profile and Security Settings"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />

                <DashboardCard
                    title = "Subjects"
                    description="Manage your focus areas"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/subjects")}
                />

                <DashboardCard
                    title = "Practice"
                    description="Brush up on your skills"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/equations")}
                />

                <DashboardCard
                    title = "Announcements"
                    description="See Updates and Messages"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />

            </ThemedView>


            <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    SUPPORT
                </ThemedText>

                <ThemedText style={styles.sectionSubtitle}>
                    HELP AND RESOURCES
                </ThemedText>
            </ThemedView>

            <ThemedView style={styles.cardsGrid}>



                <DashboardCard
                    title = "Help Center"
                    description="Guides and Additional Troubleshooting"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />

                <DashboardCard
                    title = "Contact Instructor"
                    description="Reach out to your Teacher/Supervisor "
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />

                <DashboardCard
                    title = "Feedback"
                    description="Report Fixes"
                    style={styles.cardGridIndv}
                    onPress={() => router.push("/settings")}
                />







            </ThemedView>






        
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
    headerImage: { 
        bottom: -90, 
        left: -35, 
        position: 'absolute' 
    },

    container: {
        flex: 1,
        padding: 0, 
        gap: 16,
    },

    titleText: {
        letterSpacing: 0.2,
        textAlign: "center",
    },

    mainCard: {
        borderRadius: 14, 
        padding: 16,
        backgroundColor: "rgba(10,126,164,0.05)",
        borderWidth: 1,
        borderColor: "rgba(10,126,164,0.2)",

        width: "100%",
        maxWidth: 1020,
        marginBottom: 48,
        alignSelf: "center",


        shadowColor: "#000000",
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 2,},

        gap: 10,
        elevation: 2,
    },

    mainHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,


    },

    mainTitle: {

        fontSize: 18,
        fontWeight: "500",
        textAlign: "center",

    },

    mainBadge: {
        width: 28,
        height: 28,
        backgroundColor: "#0a7ea4",

        justifyContent: "center",
        alignItems: "center",
    },


    mainBadgeText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },

    mainRoleText: {
        color: "#0a7ea4",
        textAlign: "center",
    },

    titleContainer: { 
        flexDirection: 'row', 
        gap: 8,
        justifyContent: "center",
        alignItems: "center",

        paddingBottom: 24,
    },

    

    bodyContainer: { 
        marginTop: 20  
    },

    cardsContainer: {
        marginTop: 4,
        flexDirection: "row",
        flexWrap: "wrap",

        alignItems: "stretch",
        gap: 16,
       
        
    },

    cardItem: {
        width: 220,
        height: 110,
    },


    sectionHeader: {
        gap: 3,
        justifyContent: "center",
        alignItems: "center",
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 24,
    },

    sectionSubtitle: {
        fontSize: 13,
        opacity: 0.7,
    },

    mainBodyText: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },

    cardsGrid: {
        marginTop: 4,
        flexDirection: "row",
        flexWrap: "wrap",

        justifyContent: "center",
        alignSelf:"center",
        width: "100%",
        maxWidth: 900,

        paddingHorizontal: 12,
    },

    cardGridIndv: {
        width: 220,
        height: 110,

        marginHorizontal: 8,
        marginBottom: 12,
       
    }




});