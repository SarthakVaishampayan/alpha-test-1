import { createContext, useContext, useEffect, useRef, useState } from 'react';

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  // 'stopwatch' counts up, 'timer' counts down
  const [mode, setMode] = useState('stopwatch');

  // For stopwatch: elapsed seconds
  // For timer: remaining seconds
  const [elapsedTime, setElapsedTime] = useState(0);

  // Only for timer mode: starting seconds (to compute studied)
  const [initialTime, setInitialTime] = useState(0);

  const [timerRunning, setTimerRunning] = useState(false);

  // Global "timer finished" popup state
  const [sessionEnded, setSessionEnded] = useState(false);

  const intervalRef = useRef(null);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const getTimeStudied = () => {
    if (mode === 'stopwatch') return elapsedTime;
    // countdown: studied = initial - remaining
    return Math.max(0, (initialTime || 0) - (elapsedTime || 0));
  };

  const stopAndAskToLog = () => {
    setTimerRunning(false);
    clearTick();
    setSessionEnded(true);
  };

  const discardSession = () => {
    setSessionEnded(false);
    setTimerRunning(false);
    clearTick();

    if (mode === 'stopwatch') {
      setElapsedTime(0);
    } else {
      // reset to full countdown
      setElapsedTime(initialTime || 0);
    }
  };

  const restartSession = () => {
    setSessionEnded(false);
    clearTick();

    if (mode === 'stopwatch') {
      setElapsedTime(0);
      setTimerRunning(true);
      return;
    }

    // countdown restart from full duration
    setElapsedTime(initialTime || 0);
    setTimerRunning(true);
  };

  // optional: small system notification when countdown ends
  const fireBrowserNotification = async (title, body) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
        return;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    } catch (e) {
      // ignore if blocked by browser
    }
  };

  useEffect(() => {
    if (!timerRunning) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => {
        if (mode === 'stopwatch') return prev + 1;

        // countdown
        if (prev <= 1) {
          // reaches 0 now
          // stop timer and open global popup
          setTimerRunning(false);
          setSessionEnded(true);

          // browser notification (optional)
          fireBrowserNotification(
            'Countdown finished',
            'Log your study time, restart, or discard this session.'
          );

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTick();
  }, [timerRunning, mode]);

  return (
    <TimerContext.Provider
      value={{
        // existing
        mode,
        setMode,
        elapsedTime,
        setElapsedTime,
        initialTime,
        setInitialTime,
        timerRunning,
        setTimerRunning,
        getTimeStudied,

        // new global-finish UX
        sessionEnded,
        setSessionEnded,
        stopAndAskToLog,
        restartSession,
        discardSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
