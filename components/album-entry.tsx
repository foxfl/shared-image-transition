import * as MediaLibrary from "expo-media-library";
import { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { SharableImage } from "./SharableImage/sharable-image";
import { useSharableImage } from "./SharableImage/sharable-image-context";


interface AlbumEntryProps {
  item: MediaLibrary.Asset;
}
function AlbumEntry({ item }: AlbumEntryProps) {
  const { selectedImageId, isAnimating, imageInformation } = useSharableImage();

  const opacity = useAnimatedStyle(() => {
    if (selectedImageId === item.id && imageInformation) {
      const calculatedOpacity = interpolate(isAnimating.value, [1, 0], [0, 1]);
      return {
        opacity: calculatedOpacity,
      };
    }

    return {
      opacity: 1,
    };
  });

  return (
    <View style={styles.imageContainer}>
      <Animated.View style={[styles.image, opacity]}>
        <SharableImage
          source={{ uri: item.uri }}
          contentFit="cover"
          asset={item}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    margin: 1,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: Dimensions.get("window").width / 3 - 1,
    height: 120,
    borderRadius: 10,
  },
});

export default memo(AlbumEntry);
