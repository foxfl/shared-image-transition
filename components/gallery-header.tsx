import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";

interface GalleryHeaderProps {
  earliestDate: Date | null;
}

export default function GalleryHeader({ earliestDate }: GalleryHeaderProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <BlurView intensity={5} tint="dark" style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.title}>Photos</Text>
          <Text style={styles.subtitle}>
            {earliestDate ? formatDate(earliestDate) : "19.946 Objekte"}
          </Text>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: -1,
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
});
