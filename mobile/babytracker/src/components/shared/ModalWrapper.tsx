import React from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export default function ModalWrapper({
  visible,
  onClose,
  title,
  children,
  width = 300,
}: ModalWrapperProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { width }]}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: colors.textPrimary,
  },
});
