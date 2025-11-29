import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import PageLayout from '../../components/PageLayout';
import Markdown from 'react-native-markdown-display';
import HelpIcon from '../../components/HelpIcon';
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
             leagueHomeContent,
             reloadHomeContent,
             switchLeague
           } = useLeague();
           const [editMode, setEditMode] = useState(false);
           const [editedContent, setEditedContent] = useState("");

           const { width } = Dimensions.get('window'); // Screen width

           // Themed colors
           const textColor = useThemeColor({}, 'text');
           const backgroundColor = useThemeColor({}, 'background');
           const borderColor = useThemeColor({}, 'icon'); // General border color
           const buttonBgColor = useThemeColor({}, 'tint');
           const buttonTextColor = useThemeColor({}, 'background'); // Text color on primary buttons
           const mutedTextColor = useTheme_color({}, 'icon'); // For gray-like colors
           const activityIndicatorColor = useThemeColor({}, 'tint'); // For ActivityIndicator
           const cancelButtonBgColor = useThemeColor({ light: '#6c757d', dark: '#495057' }, 'background'); // Themed gray for cancel button

            const styles = useMemo(() => StyleSheet.create({
                container: {
                    flex: 1,
                    alignItems: 'center',
                    padding: 20,
                    backgroundColor: backgroundColor,
                },
                centeredContent: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    backgroundColor: backgroundColor,
                },
                title: {
                    fontSize: 28,
                    fontWeight: 'bold',
                    marginBottom: 20,
                    textAlign: 'center',
                    color: textColor,
                },
                subtitle: {
                    fontSize: 18,
                    color: mutedTextColor,
                    marginBottom: 40,
                    textAlign: 'center',
                },
                button: {
                    backgroundColor: buttonBgColor,
                    borderRadius: 20,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60%', // Default button width
                    marginVertical: 8,
                },
                buttonText: {
                    color: buttonTextColor,
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
                    backgroundColor: buttonBgColor,
                },
                cancelButton: {
                    backgroundColor: cancelButtonBgColor, // Gray color
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
                    color: textColor,
                },
                copyButton: {
                    width: 80,
                    height: 30,
                    marginLeft: 10,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: buttonBgColor,
                },
                contentContainer: {
                    width: '100%',
                    padding: 15,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 10,
                    marginBottom: 20,
                    minHeight: 150,
                    backgroundColor: backgroundColor,
                },
                leagueNameHeader: {
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 10,
                    color: textColor,
                },
                textInput: {
                    flex: 1, // Make TextInput take available space in edit mode
                    width: '100%',
                    textAlignVertical: 'top',
                    borderColor: borderColor,
                    borderWidth: 1,
                    borderRadius: 5,
                    padding: 10,
                    color: textColor,
                },
                editHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                },
                editHeaderText: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    marginRight: 5,
                    color: textColor,
                },
                }), [width, textColor, backgroundColor, borderColor, buttonBgColor, buttonTextColor, mutedTextColor, activityIndicatorColor, cancelButtonBgColor]);

           // Define markdownStyles INSIDE the component using useMemo
           // so it can access 'width' and is memoized.
           const markdownStyles = useMemo(() => StyleSheet.create({
             text: { color: textColor },
             heading1: {
               textAlign: 'center',
               fontSize: 24,
               fontWeight: 'bold',
               marginVertical: 10,
               color: textColor,
             },
             heading2: {
               textAlign: 'center',
               fontSize: 20,
               fontWeight: 'bold',
               marginVertical: 8,
               color: textColor,
             },
             heading3: {
               textAlign: 'center',
               fontSize: 18,
               fontWeight: 'bold',
               marginVertical: 6,
               color: textColor,
             },
             heading4: {
               textAlign: 'center',
               fontSize: 16,
               fontWeight: 'bold',
               marginVertical: 4,
               color: textColor,
             },
             heading5: {
               textAlign: 'center',
               fontSize: 14,
               fontWeight: 'bold',
               marginVertical: 2,
               color: textColor,
             },
             heading6: {
               textAlign: 'center',
               fontSize: 12,
               fontWeight: 'bold',
               marginVertical: 2,
               color: textColor,
             },
             markdownImage: { // Style for images rendered by Markdown
               width: width * 0.9,    // 90% of screen width
               height: width * 0.6,
               marginVertical: 10,
               alignSelf: 'center',
             },
           }), [width, textColor]); // Recalculate if screen width changes or theme changes

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
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save content.' });
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
                     <>
                       <View style={styles.editHeader}>
                         <Text style={styles.editHeaderText}>Edit Home Page Content</Text>
                         <HelpIcon topicKey="HOME_PAGE_CONTENT_EDIT" />
                       </View>
                       <TextInput
                         style={styles.textInput}
                         value={editedContent}
                         onChangeText={setEditedContent}
                         multiline
                         autoFocus
                       />
                     </>
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
                       <View style={{flexDirection: 'column', alignItems: 'center'}}>
                         <TouchableOpacity style={styles.button} onPress={handleEdit}>
                           <Text style={styles.buttonText}>     Edit Content     </Text>
                         </TouchableOpacity>
                       </View>
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

         export default HomePage;
