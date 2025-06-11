import { Image, ImageContentFit, ImageSource, useImage } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { GestureResponderEvent, Pressable } from "react-native";
import { MeasuredDimensions } from "react-native-reanimated";
import { calculateVisibleImageDimensions } from "./helper";

import { useSharableImage } from "./sharable-image-context";

interface SharableImageProps {
  source: ImageSource;
  placeholder?: ImageSource;
  contentFit?: ImageContentFit;
  asset: MediaLibrary.Asset;
}

export function SharableImage({
  source,
  placeholder,
  contentFit = "contain",
  asset,
}: SharableImageProps) {
  const { onSetImageInformation } = useSharableImage();

  const imageRef = useImage(source, {
    onError: (error) => {
      //      console.log(error);
    },
  });

  const prepareImageInformation = (measurement: MeasuredDimensions) => {
    const imagePosition = calculateVisibleImageDimensions({
      containerWidth: measurement.width,
      containerHeight: measurement.height,
      containerX: measurement.pageX,
      containerY: measurement.pageY,
      imageWidth: imageRef?.width ?? measurement.width,
      imageHeight: imageRef?.height ?? measurement.height,
      contentFit: contentFit,
    });
    onSetImageInformation({
      imageInformation: {
        source,
        asset,
        position: imagePosition,
        contentFit: contentFit,
        image: {
          width: imageRef?.width ?? measurement.width,
          height: imageRef?.height ?? measurement.height,
        },
        container: {
          width: measurement.width,
          height: measurement.height,
        },
      },
      selectedImageId: asset.id,
    });
  };

  const onPress = (event: GestureResponderEvent) => {
    if (!imageRef) {
      return;
    }
    event.target.measure((_x, _y, width, height, pageX, pageY) => {
      prepareImageInformation({
        height,
        width,
        pageX,
        pageY,
        x: pageX,
        y: pageY,
      });
    });
  };

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Image
        source={imageRef}
        contentFit={contentFit}
        placeholder={placeholder}
        placeholderContentFit={contentFit}
        allowDownscaling
        style={{
          flex: 1,
        }}
      />
    </Pressable>
  );
}
