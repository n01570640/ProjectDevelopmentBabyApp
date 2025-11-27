import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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

export default function Landing({ navigation }: Props) {
  return (
    <LinearGradient
      colors={['#fdfdfd', '#fafafa', '#f1f1f1']}
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
                colors={['#8ec6ff', '#81b6eb']}
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

        {/* Store logos */}
        <LinearGradient
          colors={['#fdfdfd', '#fafafa', '#f1f1f1']}
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
    color: '#57a8f8',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  subtitle: {
    fontFamily: 'RalewayBold',
    fontSize: moderateScale(16),
    color: '#606162',
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
    color: '#606162',
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
});
