import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../../services/authService";
import { registerForPushNotifications } from "../../services/notificationService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors, gradients } from '../theme/colors';

const { width, height } = Dimensions.get("window");

type Props = {
  navigation: any;
  route?: any;
};

export default function SignUp({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const inviteEmail = route?.params?.inviteEmail ?? "";
  const inviteToken = route?.params?.inviteToken ?? "";
  const [formData, setFormData] = useState({
    fullName: "",
    email: inviteEmail,
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setError("");

    // Validate required fields
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      return;
    }

    // Validate password length (min 8 characters)
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check terms accepted
    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy");
      return;
    }

    // All validation passed, call API
    setLoading(true);
    try {
      const response = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      setLoading(false);

      if (response.success) {
        // Register device for push notifications (non-blocking)
        registerForPushNotifications();
        // Registration successful - show in-page message
        setSuccessMessage("Your account has been created successfully!");
        setError("");
        setTimeout(() => {
          navigation.navigate("Login", inviteEmail ? { inviteEmail } : undefined);
        }, 2000);
      } else {
        // Show error from backend
        if (response.errors && Array.isArray(response.errors)) {
          const details = response.errors.map((e: any) => e.message).join("\n");
          setError(details);
        } else {
          setError(response.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
      console.error("Registration error:", err);
    }
  };

  const handleSignIn = () => {
    navigation.navigate("Login");
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
              source={require("../images/register/registerIcons.png")}
              style={styles.headerImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>Sign Up with Us!</Text>
            <Text style={styles.welcomeText}>
              Create a Baby Steps account
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={moderateScale(20)}
                  color={colors.inputIcon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.placeholder}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange("fullName", value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

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
                  value={formData.email}
                  onChangeText={inviteEmail ? undefined : (value) => handleInputChange("email", value)}
                  editable={!inviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={moderateScale(20)}
                  color={colors.inputIcon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (optional)"
                  placeholderTextColor={colors.placeholder}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  keyboardType="phone-pad"
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
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
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

            {/* Confirm Password Input */}
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
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.placeholder}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={moderateScale(20)}
                    color={colors.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {acceptTerms && (
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(16)}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Success Message Display */}
            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Error Message Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign Up Button */}
            <View style={styles.buttonWrapper}>
              <View style={styles.buttonBehindPill} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSignUp}
                disabled={loading}
                style={[styles.buttonTapArea, loading && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signUpButton}
                >
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Go Back at bottom */}
            <TouchableOpacity
              style={styles.goBackContainer}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={moderateScale(20)}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
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
    paddingBottom: verticalScale(80),
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
  title: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  welcomeText: {
    fontSize: moderateScale(16),
    color: colors.inputIcon,
    fontWeight: "400",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: verticalScale(18),
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
  termsContainer: {
    marginBottom: verticalScale(30),
    marginTop: verticalScale(10),
  },
  termsCheckboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(5),
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
    marginTop: moderateScale(2),
  },
  termsText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textMuted,
    fontWeight: "400",
    lineHeight: moderateScale(20),
  },
  termsLink: {
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
  signUpButton: {
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
  signUpButtonText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  signInPrompt: {
    fontSize: moderateScale(14),
    color: colors.inputIcon,
    fontWeight: "400",
  },
  signInLink: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: "700",
  },
  goBackContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: verticalScale(20),
  },
  goBackText: {
    fontSize: moderateScale(16),
    color: colors.primary,
    fontWeight: "600",
  },
  successContainer: {
    backgroundColor: colors.successLight,
    borderLeftColor: colors.successBorder,
    borderLeftWidth: 4,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(15),
  },
  successText: {
    fontSize: moderateScale(13),
    color: colors.successDark,
    fontWeight: "500",
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
