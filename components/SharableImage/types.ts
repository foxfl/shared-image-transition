import { ImageProps, ImageSource, ImageStyle } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { StyleProp } from "react-native";

export interface ImageDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface SharableImageContextType {
  showFullscreen: (imageUrl: ImageSource, dimensions: ImageDimensions) => void;
  hideFullscreen: () => void;
  isFullscreenVisible: boolean;
  currentImageUrl: ImageSource | null;
  sourceDimensions: ImageDimensions | null;
}

export interface SharableImageProps {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export interface SharableImageModalProps {
  children: React.ReactNode;
}

export type SharedImageProps = Pick<
  ImageProps,
  "contentFit" | "contentPosition" | "placeholder" | "placeholderContentFit"
>;

export type ImageInformation = {
  source: ImageSource | null;
  asset: MediaLibrary.Asset;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  image: {
    width: number;
    height: number;
  };
  contentFit?: ImageProps["contentFit"];
  container: {
    width: number;
    height: number;
  };
};

