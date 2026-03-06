import { View } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef, useEffect, useMemo } from "react";
import { useColorScheme } from "nativewind";

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
  const snapPoints = useMemo(() => ["90%"], []);
  const { colorScheme } = useColorScheme();

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
      keyboardBehavior="extend"
      onDismiss={onClose}
      handleIndicatorStyle={{
        backgroundColor: colorScheme === 'dark' ? "hsl(0 0% 50%)" : "hsl(0 0% 50%)",
      }}
      backgroundStyle={{ 
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? "hsl(0 0% 10%)" : "hsl(0 0% 95%)",
        backgroundColor: colorScheme === 'dark' ? "hsl(0 0% 5%)" : "hsl(0 0% 100%)",
      }}
    >
      <BottomSheetView className="bg-background">{children}</BottomSheetView>
    </BottomSheetModal>
  );
}

export default BottomSheet;