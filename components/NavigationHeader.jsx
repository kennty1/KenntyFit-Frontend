import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function getSharedScreenOptions(theme) {
  return {
    headerShown: true,
    headerStyle: {
      backgroundColor: theme.surface,
      height: 46,
    },
    headerTintColor: theme.accent,
    headerTitleStyle: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 15,
      maxWidth: 180,
      marginTop: 0,
    },
    headerBackTitleVisible: false,
    headerLeft: ({ canGoBack, onPress, tintColor }) =>
      canGoBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onPress}
          style={{ marginLeft: 2, paddingHorizontal: 6, paddingVertical: 2 }}
        >
          <Ionicons name="chevron-back" size={24} color={tintColor || theme.accent} />
        </TouchableOpacity>
      ) : null,
  };
}
