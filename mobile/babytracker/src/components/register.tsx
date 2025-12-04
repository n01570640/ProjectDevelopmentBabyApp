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
  Image, // ✅ added so we can show the header icon
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Reference sizes for scaling (same as login)
const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type Props = {
  navigation: any;
};

export default function SignUp({ navigation }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = () => {
    // TODO: Implement registration logic
    console.log("Sign up pressed", { ...formData, acceptTerms });
  };

  const handleSignIn = () => {
    navigation.navigate("Login");
  };

  return (
    <LinearGradient
      colors={["#fdfdfd", "#fafafa", "#f1f1f1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
                  color="#7a7a7a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#a0a0a0"
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
                  color="#7a7a7a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#a0a0a0"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
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
                  color="#7a7a7a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#a0a0a0"
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
                    color="#7a7a7a"
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
                  color="#7a7a7a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#a0a0a0"
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
                    color="#7a7a7a"
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
                      color="#81b6eb"
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

            {/* Sign Up Button */}
            <View style={styles.buttonWrapper}>
              <View style={styles.buttonBehindPill} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSignUp}
                style={styles.buttonTapArea}
              >
                <LinearGradient
                  colors={["#8ec6ff", "#81b6eb"]}
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
                color="#81b6eb"
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
    paddingTop: verticalScale(60),
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
  title: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: "#81b6eb",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  welcomeText: {
    fontSize: moderateScale(16),
    color: "#7a7a7a",
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
    backgroundColor: "#ffffff",
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
    color: "#2c2c2c",
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
    borderColor: "#81b6eb",
    marginRight: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginTop: moderateScale(2),
  },
  termsText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#5a5a5a",
    fontWeight: "400",
    lineHeight: moderateScale(20),
  },
  termsLink: {
    color: "#81b6eb",
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
    shadowColor: "#81b6eb",
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
    color: "#7a7a7a",
    fontWeight: "400",
  },
  signInLink: {
    fontSize: moderateScale(14),
    color: "#81b6eb",
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
    color: "#81b6eb",
    fontWeight: "600",
  },
});
