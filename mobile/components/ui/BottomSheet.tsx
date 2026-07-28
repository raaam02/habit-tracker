import {
  BottomSheetModal,
  BottomSheetFooter,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRef, useEffect, useCallback } from "react";
import { useColorScheme } from "nativewind";
import { View } from "react-native";
import themes from "../../app/themes";

function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: {
    content: React.ReactNode;
    footer?: React.ReactNode;
  };
}) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { colorScheme } = useColorScheme();

  const themeStyle = colorScheme === "dark" ? themes.main.dark : themes.main.light;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  useEffect(() => {
    if (open) {
      if (!isPresentedRef.current) {
        isPresentedRef.current = true;
        ref.current?.present();
      }
    } else {
      if (isPresentedRef.current) {
        isPresentedRef.current = false;
        ref.current?.dismiss();
      }
    }
  }, [open]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={true} // Enable content-height dynamic sizing
      keyboardBehavior="interactive"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "hsl(0, 0%, 50%)",
      }}
      backgroundStyle={{
        borderRadius: 24,
        backgroundColor: colorScheme === 'dark' ? "hsl(0, 0%, 8%)" : "hsl(0, 0%, 100%)",
      }}
      footerComponent={children.footer ? ({ animatedFooterPosition }) => (
        <BottomSheetFooter
          animatedFooterPosition={animatedFooterPosition}
          bottomInset={10}
        >
          <View style={themeStyle}>
            {children.footer}
          </View>
        </BottomSheetFooter>
      ) : undefined}
    >
      <BottomSheetView style={[{ paddingBottom: children.footer ? 80 : 20 }, themeStyle]}>
        {children.content}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default BottomSheet;
