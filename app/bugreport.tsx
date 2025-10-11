/*
 For Future Ref/ Template: 
    WIRED the same way as FAQ and Contact.
    1) Updated Stack Screen in _layout.tsx (not the app one)
    2) settings.tsx uses Router to push the file locally 
            - Placeholder for now
*/

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';




///////// VARS Inits

export default function ReportBug() {
    const [open, setOpen] = useState(false);
    const [bugType, setBugType] = useState<string>('UI');
    const [details, setDetails] = useState('');


    const selections = (option: string) => {
        setBugType(option);
        setOpen(false);
    };


    const submit = () => {
        console.log('Your message has been sent. \n Thank you. We appreciate it ', 
            { bugType, details}
        );
    };


/// HTML SKELLY 

    return ( 
        <ParallaxScrollView
            headerBackgroundColor= {{ light : '#A1CEDC', dark: '#1D3D47'}}
            headerImage={<View style={{ height: 200 }} /> }
        > 

            <ThemedView style= {styles.titlearea}>
                <ThemedText type="title"> REPORT A BUG : </ThemedText>
            </ThemedView>

            <ThemedView style ={styles.subtitlearea}>
                <ThemedText type ="subtitle"> Type Of Bug</ThemedText>
           

            <Pressable onPress={() => setOpen(e => !e)} 
                       style = {styles.select}>
                <ThemedText>{bugType}</ThemedText>
                
                
            </Pressable>


    { /*  DROPDOWN STUFF - can add later for Other Real Bugs That come up  */  }      


            { open && (
                <View style = {styles.dropdown}>
                    <Pressable style={styles.option} onPress={() => selections('UI')}>
                        <ThemedText> UI </ThemedText>
                    </Pressable>
                    <Pressable style={styles.option} onPress={() => selections('Crashes')}>
                        <ThemedText> Crashes </ThemedText>
                    </Pressable>
                    <Pressable style={styles.option} onPress={() => selections('Notifications')}>
                        <ThemedText> Notifications </ThemedText>
                    </Pressable>
                    <Pressable style={styles.option} onPress={() => selections('Other')}>
                        <ThemedText> Other </ThemedText>
                    </Pressable>
                </View>
                )}
</ThemedView>

{ /*  Other checks  */}


        <ThemedView style={styles.subtitlearea}>
            <ThemedText type="subtitle"> Details </ThemedText>
            <TextInput
                    value={details}
                    onChangeText={setDetails}
                    placeholder= "Your Response..."
                    multiline
                    textAlignVertical= "top"
                    style={[styles.input, { minHeight: 200}]}
                    />
        </ThemedView>

    
{ /* Simple Button 4 now  */}

        <ThemedView style={styles.subtitlearea}>
            <Pressable onPress={submit} style ={styles.button}>
                <ThemedText> SUBMIT </ThemedText>
            </Pressable>
        </ThemedView>
        </ParallaxScrollView>
        );
        }


///////////// CSS / JSX STYLING  : TODO: *** 





const styles = StyleSheet.create( {

    titlearea: {
        flexDirection: 'row',
        margin: 10, 
        padding: 3
    },

    subtitlearea: {
        margin: 10, 
        padding: 3
    },

    dropdown: {

        margin: 10,
        backgroundColor: '#FFFFFF',


    },
    input: {

        borderWidth: 1,
        borderColor: '#FFFFFF'

    },
    button: {

        alignItems: 'center',
        padding: 10,

    },

    option: {

        padding: 10,


    },

    select: {
        padding: 10,
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#FFFFFF'

    },


});
