import {
  BottomSheetModal,
  BottomSheetFooter,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRef, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "nativewind";

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
  // Guard: tracks whether the sheet is currently in a presented state.
  // Without this, mounting with open=false immediately calls dismiss(),
  // which sets gorhom's internal status to DISMISSING and corrupts the
  // state machine — so later present() calls silently fail.
  const isPresentedRef = useRef(false);
  const snapPoints = useMemo(() => ["90%"], []);
  const { colorScheme } = useColorScheme();

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

  // Called when sheet is dismissed via swipe or backdrop tap.
  // Must sync isPresentedRef so the guard stays accurate.
  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={snapPoints}
      keyboardBehavior="extend"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "hsl(0, 0%, 50%)",
      }}
      backgroundStyle={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? "hsl(0 0% 10%)" : "hsl(0 0% 95%)",
        backgroundColor: colorScheme === 'dark' ? "hsl(0 0% 5%)" : "hsl(0 0% 100%)",
      }}
      footerComponent={({ animatedFooterPosition }) => (
        <BottomSheetFooter
          animatedFooterPosition={animatedFooterPosition}
          bottomInset={10}
        >
          {children.footer}
        </BottomSheetFooter>
      )}
    >
      <BottomSheetView style={{ flex: 1 }}>{children.content}</BottomSheetView>
    </BottomSheetModal>
  );
}

export default BottomSheet;
