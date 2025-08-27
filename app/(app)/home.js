import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import PageLayout from '../../components/PageLayout';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
         import { updateLeagueHomeContent } from '../../src/api';

         const HomePage = () => {
           const router = useRouter();
           const { api } = useAuth();
           const {
             leagues,
             loadingLeagues,
             selectedLeagueId,
             currentLeague,
             currentUserMembership,
             refreshInviteCode,
             leagueHomeContent,
             inviteCode,
             reloadHomeContent
           } = useLeague();
           const [editMode, setEditMode] = useState(false);
           const [editedContent, setEditedContent] = useState("");

           const { width } = Dimensions.get('window'); // Screen width

           // Define markdownStyles INSIDE the component using useMemo
           // so it can access 'width' and is memoized.
           const markdownStyles = useMemo(() => StyleSheet.create({
             text: {},
             heading1: {
               textAlign: 'center',
               fontSize: 24,
               fontWeight: 'bold',
               marginVertical: 10,
             },
             heading2: {
               textAlign: 'center',
               fontSize: 20,
               fontWeight: 'bold',
               marginVertical: 8,
             },
             heading3: {
               textAlign: 'center',
               fontSize: 18,
               fontWeight: 'bold',
               marginVertical: 6,
             },
             heading4: {
               textAlign: 'center',
               fontSize: 16,
               fontWeight: 'bold',
               marginVertical: 4,
             },
             heading5: {
               textAlign: 'center',
               fontSize: 14,
               fontWeight: 'bold',
               marginVertical: 2,
             },
             heading6: {
               textAlign: 'center',
               fontSize: 12,
               fontWeight: 'bold',
               marginVertical: 2,
             },
             markdownImage: { // Style for images rendered by Markdown
               width: width * 0.9,    // 90% of screen width
               height: width * 0.6,
               marginVertical: 10,
               alignSelf: 'center',
             },
           }), [width]); // Recalculate if screen width changes

           // Custom image renderer that uses the 'markdownImage' style from the component's markdownStyles
           const customImageRenderer = (node, children, parent, stylesFromMarkdownDisplay) => {
             // 'stylesFromMarkdownDisplay' are the default styles from react-native-markdown-display
             // We are overriding with our markdownStyles.markdownImage for consistency
             const { src, alt } = node.attributes;
             return (
               <Image
                 key={node.key}
                 source={{ uri: src }}
                 style={markdownStyles.markdownImage} // Apply our dynamically calculated style
                 contentFit="contain"
                 accessibilityLabel={alt || 'Markdown Image'}
               />
             );
           };

           const markdownRules = {
             image: customImageRenderer,
             heading1: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading1}>
                    {children}
                </Text>
             ),
             heading2: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading2}>
                    {children}
                </Text>
             ),
             heading3: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading3}>
                    {children}
                </Text>
             ),
             heading4: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading4}>
                    {children}
                </Text>
             ),
             heading5: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading5}>
                    {children}
                </Text>
             ),
             heading6: (node, children, parent, styles) => (
                <Text key={node.key} style={styles.heading6}>
                    {children}
                </Text>
             ),
           };

           const handleEdit = () => {
             setEditedContent(leagueHomeContent?.content || '');
             setEditMode(true);
           };

           const handleCancel = () => {
             setEditMode(false);
           };

           const handleSave = async () => {
             try {
               await api(updateLeagueHomeContent, selectedLeagueId, editedContent, leagueHomeContent?.logoImageUrl || null);
               await reloadHomeContent();
               setEditMode(false);
             } catch (error) {
               console.error("Failed to save home content:", error);
               Alert.alert("Error", "Failed to save content.");
             }
           };

           const handleCreateLeague = () => {
             router.push('/(app)/create-league');
           };

           const handleJoinLeague = () => {
             router.push('/(app)/join-league');
           };

           if (loadingLeagues) {
             return <ActivityIndicator size="large" color="#fb5b5a" />;
           }

           const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

           if (leagues && leagues.length > 0) {
             return (
               <PageLayout>
                 {currentLeague?.leagueName && (
                   <Text style={styles.leagueNameHeader}>{currentLeague.leagueName}</Text>
                 )}
                 <View style={styles.contentContainer}>
                   {editMode ? (
                     <TextInput
                       style={styles.textInput}
                       value={editedContent}
                       onChangeText={setEditedContent}
                       multiline
                       autoFocus
                     />
                   ) : (
                     // Pass the component's markdownStyles to the Markdown component
                     <Markdown style={markdownStyles} rules={markdownRules}>
                       {leagueHomeContent?.content || 'Welcome to your league! Admins can edit this message.'}
                     </Markdown>
                   )}
                 </View>

                 {isAdmin && (
                   <View style={styles.adminControlsContainer}>
                     {editMode ? (
                       <View style={styles.editButtons}>
                         <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                           <Text style={styles.buttonText}>Save</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                           <Text style={styles.buttonText}>Cancel</Text>
                         </TouchableOpacity>
                       </View>
                     ) : (
                       <>
                         <TouchableOpacity style={styles.button} onPress={handleEdit}>
                           <Text style={styles.buttonText}>Edit Content</Text>
                         </TouchableOpacity>
                         <View style={styles.inviteContainer}>
                           {inviteCode && (
                             <Text style={styles.inviteCodeText}>
                               {inviteCode}{' '}
                               <TouchableOpacity
                                 style={[styles.button, styles.copyButton]}
                                 onPress={() => Clipboard.setString(inviteCode)}
                               >
                                 <Text style={styles.buttonText}>Copy</Text>
                               </TouchableOpacity>
                             </Text>
                           )}
                           <TouchableOpacity style={styles.button} onPress={() => refreshInviteCode(selectedLeagueId)}>
                             <Text style={styles.buttonText}>Generate Invite Code</Text>
                           </TouchableOpacity>
                         </View>
                       </>
                     )}
                   </View>
                 )}
               </PageLayout>
             );
           }

           // Fallback for when there are no leagues
           return (
             <PageLayout>
               <View style={styles.centeredContent}>
                 <Text style={styles.title}>Welcome!</Text>
                 <Text style={styles.subtitle}>You're not in any leagues yet.</Text>

                 <TouchableOpacity style={styles.button} onPress={handleCreateLeague}>
                   <Text style={styles.buttonText}>Create a League</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={styles.button} onPress={handleJoinLeague}>
                   <Text style={styles.buttonText}>Join a League</Text>
                 </TouchableOpacity>
               </View>
             </PageLayout>
           );
         };

         // These are the general styles for the HomePage component,
         // NOT for the Markdown content specifically (unless passed explicitly).
         const styles = StyleSheet.create({
           container: {
             flex: 1,
             alignItems: 'center',
             padding: 20,
           },
           centeredContent: {
             flex: 1,
             justifyContent: 'center',
             alignItems: 'center',
             width: '100%',
           },
           title: {
             fontSize: 28,
             fontWeight: 'bold',
             marginBottom: 20,
             textAlign: 'center',
           },
           subtitle: {
             fontSize: 18,
             color: 'gray',
             marginBottom: 40,
             textAlign: 'center',
           },
           button: {
             backgroundColor: '#fb5b5a',
             borderRadius: 20,
             height: 40,
             alignItems: 'center',
             justifyContent: 'center',
             width: '60%', // Default button width
             marginVertical: 8,
           },
           buttonText: {
             color: 'white',
             fontSize: 16,
             fontWeight: 'bold',
             paddingHorizontal: 10,
           },
           adminControlsContainer: {
             width: '80%',
             alignItems: 'center',
             marginVertical: 10,
           },
           editButtons: {
             flexDirection: 'row',
             justifyContent: 'space-between',
             width: '100%',
           },
           saveButton: {
             flex: 1,
             marginRight: 5,
           },
           cancelButton: {
             backgroundColor: '#6c757d', // Gray color
             flex: 1,
             marginLeft: 5,
           },
           inviteContainer: {
             width: '100%',
             alignItems: 'center',
             marginTop: 10,
           },
           inviteCodeText: {
             fontSize: 16,
             fontWeight: 'bold',
             marginBottom: 10,
             textAlign: 'center',
           },
           copyButton: {
             width: 80,
             height: 30,
             marginLeft: 10,
             paddingVertical: 0,
             paddingHorizontal: 0,
             justifyContent: 'center',
             alignItems: 'center',
           },
           contentContainer: {
             width: '100%',
             padding: 15,
             borderWidth: 1,
             borderColor: '#ddd',
             borderRadius: 10,
             marginBottom: 20,
             minHeight: 150,
           },
           leagueNameHeader: {
             fontSize: 22,
             fontWeight: 'bold',
             textAlign: 'center',
             marginBottom: 10,
           },
           textInput: {
             flex: 1, // Make TextInput take available space in edit mode
             width: '100%',
             textAlignVertical: 'top',
             borderColor: '#ccc', // Added border for visibility
             borderWidth: 1,
             borderRadius: 5,
             padding: 10,
           },
         });

         export default HomePage;
