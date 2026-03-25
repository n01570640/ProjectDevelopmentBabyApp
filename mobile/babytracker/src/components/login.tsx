import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../../services/authService";
import { registerForPushNotifications } from "../../services/notificationService";
import { acceptInvitation } from "../../services/invitationService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors, gradients } from '../theme/colors';

const { width, height } = Dimensions.get("window");

type Props = {
  navigation: any;
  route?: any;
};

export default function Login({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const inviteEmail = route?.params?.inviteEmail ?? "";
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate email format
  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setError("");

    // Validate required fields
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    // All validation passed, call API
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      setLoading(false);

      if (response.success) {
        // Register device for push notifications (non-blocking)
        registerForPushNotifications();

        // Clear any stale invite data if not in invite flow
        if (!inviteEmail) {
          await AsyncStorage.removeItem("pendingInviteToken");
          await AsyncStorage.removeItem("pendingInviteBabyName");
        }

        // Accept pending invitation only if user came through invite flow
        let inviteMessage: { type: "success" | "error"; message: string } | undefined;
        if (inviteEmail) {
          try {
            const pendingToken = await AsyncStorage.getItem("pendingInviteToken");
            const babyName = await AsyncStorage.getItem("pendingInviteBabyName") ?? "the baby";
            if (pendingToken) {
              await AsyncStorage.removeItem("pendingInviteToken");
              await AsyncStorage.removeItem("pendingInviteBabyName");
              const acceptRes = await acceptInvitation(pendingToken);
              if (acceptRes?.success) {
                inviteMessage = { type: "success", message: `You now have access to ${babyName}'s profile!` };
              } else {
                inviteMessage = { type: "error", message: acceptRes?.message ?? "Could not accept invitation. It may have expired." };
              }
            }
          } catch (e) {
            console.error("Error processing pending invite:", e);
          }
        }

        navigation.replace("MainTabs", inviteMessage ? { inviteMessage } : undefined);
      } else {
        // Show error from backend
        if (response.errors && Array.isArray(response.errors)) {
          const details = response.errors.map((e: any) => e.message).join("\n");
          setError(details);
        } else {
          setError(response.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <LinearGradient
      colors={gradients.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + verticalScale(20) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Image
              source={require("../images/login/loginIcons.png")}
              style={styles.headerImage}
              resizeMode="contain"
            />

            {/* Updated text section */}
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Log back into your Baby Steps account
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={moderateScale(20)}
                  color={colors.inputIcon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, inviteEmail ? { color: colors.textTertiary } : null]}
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={inviteEmail ? undefined : setEmail}
                  editable={!inviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={moderateScale(20)}
                  color={colors.inputIcon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={moderateScale(20)}
                    color={colors.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(16)}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <View style={styles.buttonWrapper}>
              <View style={styles.buttonBehindPill} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={loading}
                style={[styles.buttonTapArea, loading && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signInButton}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Go Back Button */}
            <View style={styles.goBackContainer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={styles.goBackInner}
              >
                <Ionicons
                  name="arrow-back"
                  size={moderateScale(18)}
                  color={colors.primary}
                />
                <Text style={styles.goBackText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

    </LinearGradient>
  );
}

const BUTTON_RADIUS = 100;
const BUTTON_WIDTH = width * 0.85;
const BUTTON_HEIGHT = verticalScale(50);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.08,
    paddingBottom: verticalScale(40),
  },
  header: {
    marginBottom: verticalScale(40),
    alignItems: "center",
  },
  headerImage: {
    width: width * 0.55,
    height: height * 0.22,
    marginBottom: verticalScale(10),
  },

  /* NEW TEXT STYLES (matches mockup) */
  welcomeTitle: {
    fontFamily: "RalewayBold",
    fontSize: moderateScale(30),
    color: colors.accent,
    fontWeight: "bold",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontFamily: "Quicksand",
    fontSize: moderateScale(15),
    color: colors.textSubtitle,
    textAlign: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(6),
  },

  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: verticalScale(20),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: moderateScale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: colors.textInput,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: moderateScale(4),
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(5),
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
  },
  rememberMeText: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: "600",
  },
  buttonWrapper: {
    alignItems: "center",
    marginBottom: verticalScale(25),
  },
  buttonBehindPill: {
    position: "absolute",
    bottom: -verticalScale(4),
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: "rgba(129, 182, 235, 0.3)",
  },
  buttonTapArea: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  signInButton: {
    width: "100%",
    height: "100%",
    borderRadius: BUTTON_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  signUpPrompt: {
    fontSize: moderateScale(14),
    color: colors.inputIcon,
    fontWeight: "400",
  },
  signUpLink: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: "700",
  },

  goBackContainer: {
    marginTop: verticalScale(30),
    alignItems: "flex-start",
  },
  goBackInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  goBackText: {
    fontSize: moderateScale(15),
    color: colors.primary,
    fontWeight: "700",
    marginLeft: moderateScale(6),
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderLeftColor: colors.errorBorder,
    borderLeftWidth: 4,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(15),
  },
  errorText: {
    fontSize: moderateScale(13),
    color: colors.errorDark,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
