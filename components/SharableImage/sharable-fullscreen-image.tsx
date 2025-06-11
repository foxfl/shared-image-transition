import React, { useEffect, useState } from "react";

import { Image } from "expo-image";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { calculateVisibleImageDimensions, clamp } from "./helper";
import { ImageInformation } from "./types";

interface SharableFullScreenImageProps {
  image: ImageInformation;
  onPinchEndCallback: () => void;
  isAnimating: SharedValue<number>;
}
const { height: windowHeight, width: windowWidth } = Dimensions.get("window");

export function SharableFullScreenImage({
  image: { source, position, image, contentFit = "contain", container, asset },
  onPinchEndCallback,
  isAnimating,
}: SharableFullScreenImageProps) {
  // Calculate dimensions that respect aspect ratio and screen constraints
  const imageAspectRatio = image.width / image.height;
  let finalWidth = windowWidth;
  let finalHeight = windowWidth / imageAspectRatio;

  // If height exceeds max height, scale down based on height
  if (finalHeight > windowHeight) {
    finalHeight = windowHeight;
    finalWidth = windowHeight * imageAspectRatio;
  }

  const { width: visibleWidth, height: visibleHeight } =
    calculateVisibleImageDimensions({
      containerWidth: windowWidth,
      containerHeight: windowHeight,
      containerX: position.x,
      containerY: position.y,
      imageWidth: image.width,
      imageHeight: image.height,
      contentFit: contentFit,
    });

  // Take the minimum of calculated dimensions and visible dimensions
  finalWidth = Math.min(finalWidth, visibleWidth);
  finalHeight = Math.min(finalHeight, visibleHeight);

  const { width, height } = {
    width: useSharedValue(container.width),
    height: useSharedValue(container.height),
  };

  // Center the image in the screen
  const TARGET_TRANSLATE_Y = (windowHeight - finalHeight) / 2;
  const TARGET_TRANSLATE_X = (windowWidth - finalWidth) / 2;

  const translate = {
    x: useSharedValue(position.x),
    y: useSharedValue(position.y),
  };

  const [isLoaded, setIsLoaded] = useState(false);

  const savedDimensions = {
    width: useSharedValue(container.width),
    height: useSharedValue(container.height),
  };
  const savedTranslate = { x: useSharedValue(0), y: useSharedValue(0) };

  useEffect(() => {
    if (isLoaded) {
      runOnUI(() => {
        isAnimating.value = 1;
        // Ensure we animate to the centered position
        translate.x.value = withTiming(TARGET_TRANSLATE_X, { duration: 200 });
        translate.y.value = withTiming(TARGET_TRANSLATE_Y, { duration: 200 });
        width.value = withTiming(finalWidth, { duration: 200 });
        height.value = withTiming(finalHeight, { duration: 200 });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const runExitAnimation = () => {
    "worklet";

    translate.x.value = withTiming(position.x, { duration: 200 });
    translate.y.value = withTiming(position.y, { duration: 200 });

    width.value = withTiming(container.width, { duration: 200 });
    height.value = withTiming(container.height, { duration: 200 }, () => {
      runOnJS(onPinchEndCallback)();
      isAnimating.value = 0;
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslate.x.value = translate.x.value;
      savedTranslate.y.value = translate.y.value;
      savedDimensions.width.value = width.value;
      savedDimensions.height.value = height.value;
    })
    .onUpdate((event) => {
      // Handle pan movement
      const newTranslateY = savedTranslate.y.value + event.translationY;
      // Scale down dimensions when dragging down
      const scale = interpolate(
        newTranslateY,
        [
          TARGET_TRANSLATE_Y,
          TARGET_TRANSLATE_Y + 100,
          TARGET_TRANSLATE_Y + 200,
        ],
        [1, 0.8, 0.6],
        Extrapolation.CLAMP
      );

      // Calculate new dimensions
      const newWidth = savedDimensions.width.value * scale;
      const newHeight = savedDimensions.height.value * scale;

      // Calculate center point
      const centerX = savedTranslate.x.value + savedDimensions.width.value / 2;
      const centerY = savedTranslate.y.value + savedDimensions.height.value / 2;

      // Update dimensions and adjust translation to maintain center
      width.value = newWidth;
      height.value = newHeight;

      // Apply pan movement while maintaining center
      translate.x.value = centerX - newWidth / 2 + event.translationX;
      translate.y.value = centerY - newHeight / 2 + event.translationY;
    })
    .onEnd(() => {
      // Check if the top border of the image has moved past half the screen height
      const isExitTransition = translate.y.value > windowHeight / 2.2;

      if (isExitTransition) {
        runExitAnimation();
      } else {
        translate.x.value = withTiming(TARGET_TRANSLATE_X);
        translate.y.value = withTiming(TARGET_TRANSLATE_Y);
        width.value = withTiming(finalWidth);
        height.value = withTiming(finalHeight);
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedDimensions.width.value = width.value;
      savedDimensions.height.value = height.value;
      savedTranslate.x.value = translate.x.value;
      savedTranslate.y.value = translate.y.value;
    })
    .onUpdate((event) => {
      // Check if the user pinches out
      if (event.scale < 1) {
        const scaleFactor = event.scale;

        const heightScale = interpolate(
          event.scale,
          [0, 0.2, 0.4, 0.6, 0.8, 1],
          [0, 0.1, 0.2, 0.4, 0.7, 1],
          Extrapolation.EXTEND
        );

        const newWidth =
          savedDimensions.width.value *
          (imageAspectRatio < 0.5 ? Math.max(scaleFactor, 0.3) : scaleFactor);
        const newHeight =
          savedDimensions.height.value *
          (imageAspectRatio < 0.5 ? heightScale : scaleFactor);

        width.value = clamp(newWidth, savedDimensions.width.value);
        height.value = clamp(newHeight, savedDimensions.height.value);

        // When zooming out, maintain the focal point between fingers on y-axis
        const centerX = savedTranslate.x.value + event.focalX;
        const centerY = event.focalY;

        // Calculate focal ratio based on relative position within the image
        const focalRatio = event.focalX / savedDimensions.width.value;

        // Calculate new position to maintain focal point
        // This ensures the image shrinks exactly at the point where user pinched
        translate.x.value = centerX - newWidth * focalRatio;
        translate.y.value = centerY - newHeight / 2;
      }
    })
    .onEnd(() => {
      // Calculate how much smaller the current dimensions are compared to final dimensions
      const widthRatio = width.value / finalWidth;
      const heightRatio = height.value / finalHeight;
      const minRatio = Math.min(widthRatio, heightRatio);

      // Exit if dimensions are significantly smaller than final dimensions
      const isExitTransition = minRatio < 0.9;

      if (isExitTransition) {
        runExitAnimation();
        return;
      } else {
        // Reset dimensions and translation to original when releasing
        width.value = withTiming(finalWidth);
        height.value = withTiming(finalHeight);
        translate.x.value = withTiming(TARGET_TRANSLATE_X);
        translate.y.value = withTiming(TARGET_TRANSLATE_Y);
      }
    });

  const animationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translate.x.value },
        { translateY: translate.y.value },
      ],
      width: width.value,
      height: height.value,
    };
  });

  const opacity = useAnimatedStyle(() => {
    const oZoom = interpolate(
      width.value,
      [finalWidth * 0.6, finalWidth * 0.7, finalWidth * 0.8, finalWidth * 0.9, finalWidth],
      [0, 0.5, 0.7, 0.9, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: oZoom,
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, pinchGesture)}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "transparent",
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              backgroundColor: "white",
            },
            {
              ...StyleSheet.absoluteFillObject,
            },
            opacity,
          ]}
        />

        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "transparent",
          }}
        >
          <Animated.View style={[animationStyle]}>
            <Image
              cachePolicy={"memory-disk"}
              source={source}
              contentFit={contentFit}
              style={{ flex: 1 }}
              allowDownscaling
              onLoadEnd={() => {
                setIsLoaded(true);
              }}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
