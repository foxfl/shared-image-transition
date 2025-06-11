import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { ImageInformation } from "./types";

import { SharedValue, useSharedValue } from "react-native-reanimated";
import { SharableImageModal } from "./sharable-image-modal";

const SharableImageContext = createContext<
  | {
      imageInformation: ImageInformation | null;
      onClose: () => void;
      onSetImageInformation: (props: {
        imageInformation: ImageInformation;
        selectedImageId: string;
      }) => void;
      selectedImageId: string | null;
      isAnimating: SharedValue<number>;
    }
  | undefined
>(undefined);

export function useSharableImage() {
  const value = useContext(SharableImageContext);
  if (value === undefined) {
    throw new Error(
      "usePieSliceContext must be used within a PieSliceProvider"
    );
  }


  return value;
}

export function SharableImageProvider({ children }: PropsWithChildren) {
  const [imageInformation, setImageInformation] =
    useState<ImageInformation | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const isAnimating = useSharedValue(0);
  const onClose = () => {
    setImageInformation(null);
    setSelectedImageId(null);
  };

  const onSetImageInformation = (props: {
    imageInformation: ImageInformation;
    selectedImageId: string;
  }) => {
    setImageInformation(props.imageInformation);
    setSelectedImageId(props.selectedImageId);
  };

  return (
    <SharableImageContext.Provider
      value={{
        imageInformation,
        onClose,
        onSetImageInformation,
        selectedImageId,
        isAnimating,
      }}
    >
      <>
        <SharableImageModal />
        {children}
      </>
    </SharableImageContext.Provider>
  );
}
