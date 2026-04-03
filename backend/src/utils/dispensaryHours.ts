export interface DispensaryStatus {
  isOpen: boolean;
  message: string;
  opensAt?: string;
}

export const isDispensaryOpen = (): DispensaryStatus => {
  // 24/7 override requested by user
  return {
    isOpen: true,
    message: 'Open 24/7',
  };
  
  /*
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay(); // 0=Sun, 6=Sat

  // Closed on Sunday
  if (day === 0) {
    return {
      isOpen: false,
      message: 'Dispensary is closed on Sundays.',
      opensAt: 'Monday 8:00 AM',
    };
  }

  // Open 8:00 AM to 5:00 PM
  const openHour = 8;
  const closeHour = 17; // 5 PM

  const currentMinutes = hour * 60 + minute;
  const openMinutes = openHour * 60;
  const closeMinutes = closeHour * 60;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    // Calculate closing time remaining
    const remaining = closeMinutes - currentMinutes;
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return {
      isOpen: true,
      message:
        hours > 0
          ? `Open — closes in ${hours}h ${mins}m`
          : `Open — closes in ${mins} minutes`,
    };
  }

  // Before 8 AM
  if (currentMinutes < openMinutes) {
    const wait = openMinutes - currentMinutes;
    const hours = Math.floor(wait / 60);
    const mins = wait % 60;
    return {
      isOpen: false,
      message: 'Dispensary is not open yet.',
      opensAt:
        hours > 0
          ? `Opens in ${hours}h ${mins}m (8:00 AM)`
          : `Opens in ${mins} minutes`,
    };
  }

  // After 5 PM
  return {
    isOpen: false,
    message: 'Dispensary is closed for today.',
    opensAt: day === 6
      ? 'Monday 8:00 AM' // Saturday → Monday
      : 'Tomorrow 8:00 AM',
  };
  */
};
