import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInvitationByToken } from '../../services/invitationService';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { colors, gradients } from '../theme/colors';
import ModalWrapper from './shared/ModalWrapper';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: any;
};

export default function Landing({ navigation }: Props) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [inviteToken, setInviteToken] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);

  const extractToken = (input: string): string | null => {
    const trimmed = input.trim();
    const match = trimmed.match(/invitations\/([a-fA-F0-9-]+)/);
    if (match) return match[1];
    if (/^[a-fA-F0-9-]{36}$/.test(trimmed)) return trimmed;
    return null;
  };

  const handleLookupInvite = async () => {
    const token = extractToken(inviteLink);
    if (!token) {
      Alert.alert('Invalid Link', 'Please paste a valid invitation link or token');
      return;
    }
    setLoadingInvite(true);
    try {
      const res = await getInvitationByToken(token);
      if (res?.success && res.data) {
        if (res.data.is_expired) {
          Alert.alert('Expired', 'This invitation has expired');
          return;
        }
        setInviteToken(token);
        setInviteDetails(res.data);
      } else {
        Alert.alert('Not Found', res?.message ?? 'Invitation not found');
      }
    } catch {
      Alert.alert('Error', 'Failed to look up invitation');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleInviteNavigate = async (screen: 'Login' | 'SignUp') => {
    await AsyncStorage.setItem('pendingInviteToken', inviteToken);
    await AsyncStorage.setItem('pendingInviteBabyName', inviteDetails.baby_name);
    const email = inviteDetails.invited_email;
    setShowInviteModal(false);
    setInviteDetails(null);
    setInviteLink('');
    navigation.navigate(screen, { inviteEmail: email, inviteToken });
  };

  return (
    <LinearGradient
      colors={gradients.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Baby illustration */}
        <Image
          source={require('../images/landingPage/landingBaby.png')}
          style={styles.babyImage}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Welcome to Baby Steps!</Text>

        {/* Subtitle / description */}
        <Text style={styles.subtitle}>
          With Baby Steps you can track all the various things you would need
          for your child! With our simple one tap functionality you’ll have an
          ergonomic experience!
        </Text>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          {/* LOGIN */}
          <View style={styles.buttonWrapper}>
            {/* behind pill / shade */}
            <View style={styles.loginBehindPill} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Login')}
              style={styles.buttonTapArea}
            >
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <Image
                  source={require('../images/landingPage/loginIcon.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.loginText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* REGISTER */}
          <View style={[styles.buttonWrapper, { marginTop: verticalScale(18) }]}>
            {/* behind pill / shade */}
            <View style={styles.registerBehindPill} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SignUp')}
              style={styles.buttonTapArea}
            >
              <LinearGradient
                colors={['#e8e8e8', '#d4d4d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerButton}
              >
                <Image
                  source={require('../images/landingPage/notePad.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.registerText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invitation link */}
        <TouchableOpacity
          onPress={() => setShowInviteModal(true)}
          activeOpacity={0.7}
          style={styles.inviteLinkContainer}
        >
          <Text style={styles.inviteLinkText}>Have an invitation?</Text>
        </TouchableOpacity>

        {/* Store logos */}
        <LinearGradient
          colors={gradients.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storeContainer}
        >
          <Image
            source={require('../images/landingPage/github.png')}
            style={styles.storeIcon}
            resizeMode="contain"
          />
          <Image
            source={require('../images/landingPage/playStore.png')}
            style={styles.storeIcon}
            resizeMode="contain"
          />
          <Image
            source={require('../images/landingPage/appStore.png')}
            style={styles.storeIcon}
            resizeMode="contain"
          />
        </LinearGradient>
      </ScrollView>

      {/* Invitation Modal */}
      <ModalWrapper
        visible={showInviteModal}
        onClose={() => { setShowInviteModal(false); setInviteDetails(null); setInviteLink(''); }}
        title={!inviteDetails ? 'Accept Invitation' : "You're Invited!"}
      >
            {!inviteDetails ? (
              <>
                <Text style={styles.modalSubtext}>
                  Paste the invitation link you received
                </Text>
                <TextInput
                  value={inviteLink}
                  onChangeText={setInviteLink}
                  placeholder="babytracker://invitations/..."
                  style={styles.modalInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => { setShowInviteModal(false); setInviteLink(''); }}
                    style={styles.modalCancelBtn}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLookupInvite}
                    style={[styles.modalSaveBtn, loadingInvite && { opacity: 0.6 }]}
                    disabled={loadingInvite}
                  >
                    <Text style={styles.modalSaveText}>
                      {loadingInvite ? 'Looking up...' : 'Next'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inviteDetailRow}>
                  <Text style={styles.inviteDetailLabel}>Baby:</Text>
                  <Text style={styles.inviteDetailValue}>{inviteDetails.baby_name}</Text>
                </View>
                <View style={styles.inviteDetailRow}>
                  <Text style={styles.inviteDetailLabel}>Invited by:</Text>
                  <Text style={styles.inviteDetailValue}>{inviteDetails.inviter_name}</Text>
                </View>
                <View style={styles.inviteDetailRow}>
                  <Text style={styles.inviteDetailLabel}>Role:</Text>
                  <Text style={styles.inviteDetailValue}>
                    {inviteDetails.invited_role?.replace('_CAREGIVER', '')}
                  </Text>
                </View>
                <View style={styles.inviteDetailRow}>
                  <Text style={styles.inviteDetailLabel}>Your email:</Text>
                  <Text style={styles.inviteDetailValue}>{inviteDetails.invited_email}</Text>
                </View>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    onPress={() => handleInviteNavigate('Login')}
                    style={styles.modalSaveBtn}
                  >
                    <Text style={styles.modalSaveText}>I have an account — Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInviteNavigate('SignUp')}
                    style={styles.modalRegisterBtn}
                  >
                    <Text style={styles.modalSaveText}>I'm new — Register</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
      </ModalWrapper>

    </LinearGradient>
  );
}

const BUTTON_RADIUS = 100;
const BUTTON_WIDTH = width * 0.9;
const BUTTON_HEIGHT = verticalScale(40);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: verticalScale(65),
    paddingBottom: verticalScale(32),
    alignItems: 'center',
  },
  babyImage: {
    width: width * 0.9,
    height: height * 0.40, 
  },
  title: {
    fontFamily: 'RalewayBold',
    fontWeight: 'bold',
    fontSize: moderateScale(30), 
    color: colors.accent,
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  subtitle: {
    fontFamily: 'RalewayBold',
    fontSize: moderateScale(16),
    color: colors.textSubtitle,
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginHorizontal: width * 0.04,
    marginBottom: verticalScale(30),
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: verticalScale(28),
  },
  buttonWrapper: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT + verticalScale(10),
    justifyContent: 'center',
  },
  buttonTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loginBehindPill: {
    position: 'absolute',
    left: width * 0.03,
    right: width * 0.01,
    top: verticalScale(15),
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: '#bdd5ee',
  },
  registerBehindPill: {
    position: 'absolute',
    left: width * 0.03,
    right: width * 0.01,
    top: verticalScale(15),
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: '#e7e7e7',
  },
  loginButton: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: width * 0.02,
    borderRadius: BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_HEIGHT,
    paddingHorizontal: width * 0.08,
  },
  registerButton: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: width * 0.02,
    borderRadius: BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_HEIGHT,
    paddingHorizontal: width * 0.08,
  },
  buttonIcon: {
    width: BUTTON_HEIGHT * 0.7,
    height: BUTTON_HEIGHT * 0.7,
    marginRight: width * 0.04,
  },
  loginText: {
    fontFamily: 'Raleway',
    fontSize: moderateScale(18),
    color: '#ffffff',
    fontWeight: 'bold',
  },
  registerText: {
    fontFamily: 'Raleway',
    fontSize: moderateScale(18),
    color: colors.textSubtitle,
    fontWeight: 'bold',
  },
  storeContainer: {
    width: BUTTON_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: verticalScale(10),
    paddingHorizontal: width * 0.06,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    marginTop: 20,
  },
  storeIcon: {
    width: BUTTON_WIDTH * 0.18,
    height: verticalScale(36),
  },
  inviteLinkContainer: {
    marginTop: verticalScale(5),
    marginBottom: verticalScale(10),
  },
  inviteLinkText: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: colors.cancel,
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalRegisterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inviteActions: {
    marginTop: 16,
    gap: 10,
  },
  inviteDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inviteDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inviteDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
});
