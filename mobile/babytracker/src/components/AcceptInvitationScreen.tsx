import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getInvitationByToken,
  acceptInvitation,
} from "../../services/invitationService";
import { colors } from '../theme/colors';

interface InvitationDetails {
  baby_name: string;
  inviter_name: string;
  invited_role: string;
  expires_at: string;
  is_expired: boolean;
}

export default function AcceptInvitationScreen({ route, navigation }: any) {
  const { token } = route.params ?? {};
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getInvitationByToken(token);
        if (res?.success && res.data) {
          setInvitation(res.data);
          if (res.data.is_expired) {
            setError("This invitation has expired");
          }
        } else {
          setError(res?.message ?? "Invitation not found");
        }
      } catch {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await acceptInvitation(token);
      if (res?.success) {
        Alert.alert("Welcome!", `You now have access to ${invitation?.baby_name}`, [
          {
            text: "OK",
            onPress: () => navigation.navigate("Children"),
          },
        ]);
      } else {
        Alert.alert("Error", res?.message ?? "Failed to accept invitation");
      }
    } catch {
      Alert.alert("Error", "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  if (error && !invitation) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleDecline}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
        <Text style={styles.title}>You're Invited!</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Baby:</Text>
          <Text style={styles.detailValue}>{invitation?.baby_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Invited by:</Text>
          <Text style={styles.detailValue}>{invitation?.inviter_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role:</Text>
          <Text style={styles.detailValue}>
            {invitation?.invited_role?.replace("_CAREGIVER", "") ?? ""}
          </Text>
        </View>

        {error ? (
          <View style={styles.expiredSection}>
            <Text style={styles.expiredText}>{error}</Text>
            <TouchableOpacity style={styles.backButton} onPress={handleDecline}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptButton, accepting && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={accepting}
            >
              <Text style={styles.acceptButtonText}>
                {accepting ? "Accepting..." : "Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#aaa",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  expiredSection: {
    alignItems: "center",
    marginTop: 16,
  },
  expiredText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  declineButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: colors.cancel,
  },
  declineButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  acceptButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
