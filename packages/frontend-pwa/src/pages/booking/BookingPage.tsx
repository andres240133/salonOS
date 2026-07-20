import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import StepIndicator from '../../components/booking/StepIndicator';
import ServicePicker from '../../components/booking/ServicePicker';
import CalendarView from '../../components/booking/CalendarView';
import BookingForm from '../../components/booking/BookingForm';
import ConfirmationScreen from '../../components/booking/ConfirmationScreen';
import SlotTakenScreen from '../../components/booking/SlotTakenScreen';

function BookingPage() {
  const step = useBookingStore((s) => s.step);
  const confirmedBooking = useBookingStore((s) => s.confirmedBooking);
  const slotTakenAlternatives = useBookingStore((s) => s.slotTakenAlternatives);

  const renderStep = (): React.ReactNode => {
    switch (step) {
      case 1:
        return <ServicePicker />;
      case 2:
        return <CalendarView />;
      case 3:
        return <BookingForm />;
      case 4:
        if (confirmedBooking !== null) return <ConfirmationScreen />;
        if (slotTakenAlternatives !== null) return <SlotTakenScreen />;
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-40 bg-bg-base/95 backdrop-blur-sm border-b border-light/10 h-16 px-4 flex items-center justify-between">
        <span className="font-serif text-xl text-gold tracking-wide">
          Rosi Salon
        </span>
        <span className="text-xs text-text-muted italic hidden sm:block">
          Tu estilo, tu mejor versión.
        </span>
      </header>

      {step < 4 && <StepIndicator currentStep={step} />}

      <main className="flex-1 overflow-y-auto">
        {renderStep()}
      </main>
    </div>
  );
}

export default BookingPage;
