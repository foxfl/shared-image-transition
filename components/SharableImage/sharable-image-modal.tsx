import { Modal } from "react-native";

import { SharableFullScreenImage } from "./sharable-fullscreen-image";
import { useSharableImage } from "./sharable-image-context";

export function SharableImageModal() {
  const { imageInformation, onClose, isAnimating } = useSharableImage();

  return (
    <Modal visible={!!imageInformation} transparent>
      {!!imageInformation ? (
        <SharableFullScreenImage
          image={imageInformation}
          onPinchEndCallback={onClose}
          isAnimating={isAnimating}
        />
      ) : null}
    </Modal>
  );
}
