import { View } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef, useEffect, useMemo } from "react";

function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], []);

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backgroundStyle={{ 
        borderRadius: 24,
        borderColor: "#E5E7EB",
        borderWidth: 1,
      }}
    >
      <BottomSheetView className="px-6 py-4">{children}</BottomSheetView>
    </BottomSheetModal>
  );
}

export default BottomSheet;