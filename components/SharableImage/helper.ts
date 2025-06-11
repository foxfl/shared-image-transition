import { ImageContentFit } from "expo-image";

interface ImageDimensions {
  width: number;
  height: number;
}

interface ImagePosition extends ImageDimensions {
  x: number; // actual screen x coordinate of the image
  y: number; // actual screen y coordinate of the image
}

export const clamp = (value: number, max: number): number => {
  "worklet";

  return Math.min(value, max);
};

export const calculateVisibleImageDimensions = (params: {
  containerWidth: number;
  containerHeight: number;
  containerX: number;
  containerY: number;
  imageWidth: number;
  imageHeight: number;
  contentFit: ImageContentFit;
}): ImagePosition => {
  const {
    containerWidth,
    containerHeight,
    containerX,
    containerY,
    imageWidth,
    imageHeight,
    contentFit,
  } = params;

  let width: number;
  let height: number;

  // For fill and none, the visible dimensions are the same as the container
  if (contentFit === "fill") {
    width = containerWidth;
    height = containerHeight;
  } else if (contentFit === "none") {
    width = Math.min(imageWidth, containerWidth);
    height = Math.min(imageHeight, containerHeight);
  } else {
    // For cover, contain, and scale-down, we need to calculate based on aspect ratio
    const wr = containerWidth / imageWidth;
    const hr = containerHeight / imageHeight;

    if (contentFit === "cover") {
      const ratio = Math.max(wr, hr);
      width = imageWidth * ratio;
      height = imageHeight * ratio;
    } else {
      // For contain and scale-down (when scaled down)
      const ratio = Math.min(wr, hr);
      width = imageWidth * ratio;
      height = imageHeight * ratio;
    }
  }

  return {
    x: containerX,
    y: containerY,
    width,
    height,
  };
};
