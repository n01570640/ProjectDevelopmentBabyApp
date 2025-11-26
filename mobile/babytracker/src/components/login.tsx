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

const { width, height } = Dimensions.get("window");

// Reference sizes for scaling
const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type Props = {
  navigation: any;
};

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log("Login pressed", { email, password, rememberMe });
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    console.log("Forgot password pressed");
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
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
            <Text style={styles.title}>Baby Steps</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>Sign in to continue</Text>
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
                  value={email}
                  onChangeText={setEmail}
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
                    color="#7a7a7a"
                  />
                </TouchableOpacity>
              </View>
            </View>

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
                      color="#81b6eb"
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
                style={styles.buttonTapArea}
              >
                <LinearGradient
                  colors={["#8ec6ff", "#81b6eb"]}
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
    paddingTop: verticalScale(80),
    paddingBottom: verticalScale(40),
  },
  header: {
    marginBottom: verticalScale(50),
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: "#81b6eb",
    textAlign: "center",
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: "#7a7a7a",
    fontWeight: "400",
    marginBottom: verticalScale(20),
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(30),
    marginTop: verticalScale(5),
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
    borderColor: "#81b6eb",
    marginRight: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  rememberMeText: {
    fontSize: moderateScale(14),
    color: "#5a5a5a",
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
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
  signInButton: {
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
    color: "#7a7a7a",
    fontWeight: "400",
  },
  signUpLink: {
    fontSize: moderateScale(14),
    color: "#81b6eb",
    fontWeight: "700",
  },
});
