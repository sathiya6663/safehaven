import { useEffect, useRef, useState } from 'react';
import { useStealth } from '@/contexts/StealthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const HOLD_MS = 2000;

/**
 * Full-screen calculator UI shown when stealth mode is active.
 * Exit gesture: long-press the "=" button for 2 seconds.
 * If the user's session is missing/expired, they must re-authenticate
 * with their password before the app is revealed.
 */
export function StealthCalculator() {
  const { stealthActive, disableStealth } = useStealth();
  const { toast } = useToast();

  // ---- Calculator state ----
  // We track: current display value, the stored operand, the pending operator,
  // and whether the next digit press should start a fresh number.
  const [display, setDisplay]               = useState('0');
  const [storedValue, setStoredValue]       = useState<number | null>(null);
  const [pendingOp, setPendingOp]           = useState<string | null>(null);
  const [freshEntry, setFreshEntry]         = useState(false);   // next digit starts new number
  const [justEvaled, setJustEvaled]         = useState(false);  // = was just pressed

  useEffect(() => {
    if (!stealthActive) {
      setDisplay('0');
      setStoredValue(null);
      setPendingOp(null);
      setFreshEntry(false);
      setJustEvaled(false);
    }
  }, [stealthActive]);

  if (!stealthActive) return null;

  // ---- Arithmetic ----
  const applyOp = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default:  return b;
    }
  };

  /** Format a number for display — avoid floating-point noise */
  const fmt = (n: number): string => {
    if (!isFinite(n)) return n === Infinity ? '∞' : 'Error';
    // Round to 10 significant figures to kill floating-point noise
    const rounded = parseFloat(n.toPrecision(10));
    // Show up to 9 decimal places but strip trailing zeros
    return String(rounded);
  };

  // ---- Button handlers ----
  const inputDigit = (d: string) => {
    if (freshEntry || justEvaled) {
      setDisplay(d);
      setFreshEntry(false);
      setJustEvaled(false);
    } else {
      // Max 12 visible digits
      if (display.replace(/[^0-9]/g, '').length >= 12) return;
      setDisplay(display === '0' ? d : display + d);
    }
  };

  const inputDot = () => {
    if (freshEntry || justEvaled) {
      setDisplay('0.');
      setFreshEntry(false);
      setJustEvaled(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const inputBackspace = () => {
    if (freshEntry || justEvaled || display.length === 1) {
      setDisplay('0');
      return;
    }
    const next = display.slice(0, -1);
    setDisplay(next === '-' || next === '' ? '0' : next);
  };

  const clearAll = () => {
    setDisplay('0');
    setStoredValue(null);
    setPendingOp(null);
    setFreshEntry(false);
    setJustEvaled(false);
  };

  const toggleSign = () => {
    if (display === '0') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  };

  const percent = () => {
    const v = parseFloat(display);
    // If there's a stored value + pending op, % means (stored * v / 100)
    const result = storedValue !== null && (pendingOp === '+' || pendingOp === '−')
      ? (storedValue * v) / 100
      : v / 100;
    setDisplay(fmt(result));
    setFreshEntry(true);
  };

  /**
   * Called when the user presses an operator key (+, −, ×, ÷).
   * If there is already a pending operation and a stored value,
   * evaluate it first (chained operations: 3 + 4 × ...).
   */
  const pressOperator = (op: string) => {
    const current = parseFloat(display);

    if (storedValue !== null && pendingOp !== null && !freshEntry) {
      // Chain: evaluate the pending operation first
      const result = applyOp(storedValue, current, pendingOp);
      setDisplay(fmt(result));
      setStoredValue(result);
    } else {
      setStoredValue(current);
    }

    setPendingOp(op);
    setFreshEntry(true);
    setJustEvaled(false);
  };

  /**
   * Called when the user taps "=".
   * Evaluates the pending operation and shows the result.
   */
  const equalsTap = () => {
    if (pendingOp === null || storedValue === null) return;
    const current = parseFloat(display);
    const result = applyOp(storedValue, current, pendingOp);
    setDisplay(fmt(result));
    // Don't clear pendingOp/storedValue so repeated = repeats the last op
    setStoredValue(result);
    setPendingOp(null);
    setFreshEntry(false);
    setJustEvaled(true);
  };

  // Long-press tracking
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const progressTimer = useRef<number | null>(null);

  // Re-auth dialog
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!stealthActive) {
      // reset state when leaving stealth
      setDisplay('0');
      setPrevious(null);
      setOperator(null);
      setWaitingForOperand(false);
    }
  }, [stealthActive]);

  if (!stealthActive) return null;

  // ---- Calculator logic ----
  const inputDigit = (d: string) => {
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? d : display + d);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const compute = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const performOperator = (next: string) => {
    const value = parseFloat(display);
    if (previous === null) {
      setPrevious(value);
    } else if (operator) {
      const result = compute(previous, value, operator);
      setPrevious(result);
      setDisplay(String(result));
    }
    setOperator(next);
    setWaitingForOperand(true);
  };

  const equalsTap = () => {
    if (operator !== null && previous !== null) {
      const value = parseFloat(display);
      const result = compute(previous, value, operator);
      setDisplay(String(result));
      setPrevious(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  // ---- Long-press on "=" to exit stealth ----
  const holdCompleted = useRef(false);

  const startHold = () => {
    holdCompleted.current = false;
    holdStart.current = Date.now();
    setHoldProgress(0);
    progressTimer.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / HOLD_MS) * 100);
      setHoldProgress(pct);
    }, 30);
    holdTimer.current = window.setTimeout(async () => {
      holdCompleted.current = true;
      cancelHold();
      // Long-press fired — attempt to exit
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        disableStealth();
        document.title = 'SafeHaven';
        toast({ title: 'Welcome back', description: 'Stealth mode disabled.' });
      } else {
        setAuthError(null);
        setAuthOpen(true);
      }
    }, HOLD_MS);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setHoldProgress(0);
  };

  const handleEqualsPointerUp = () => {
    const wasShortPress = !holdCompleted.current;
    cancelHold();
    if (wasShortPress) {
      equalsTap();
    }
  };

  const handleReauth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) {
      setAuthError('Invalid credentials. Please try again.');
      return;
    }
    setAuthOpen(false);
    setEmail('');
    setPassword('');
    disableStealth();
    document.title = 'SafeHaven';
    toast({ title: 'Welcome back', description: 'Stealth mode disabled.' });
  };

  // ---- UI ----
  const Btn = ({
    children,
    onClick,
    variant = 'num',
    wide = false,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'num' | 'op' | 'fn';
    wide?: boolean;
  }) => {
    const base =
      'h-16 rounded-full text-2xl font-medium transition active:scale-95 select-none';
    const styles =
      variant === 'op'
        ? 'bg-orange-500 text-white hover:bg-orange-400'
        : variant === 'fn'
        ? 'bg-zinc-400 text-black hover:bg-zinc-300'
        : 'bg-zinc-700 text-white hover:bg-zinc-600';
    return (
      <button
        onClick={onClick}
        className={`${base} ${styles} ${wide ? 'col-span-2 text-left pl-7' : ''}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col"
      // Prevent the rest of the app from receiving input
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Display */}
      <div className="flex-1 flex flex-col justify-end p-6">
        <div
          className="text-right text-7xl font-light truncate"
          aria-label="Calculator display"
        >
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-3 grid grid-cols-4 gap-3 pb-8">
        <Btn variant="fn" onClick={clearAll}>AC</Btn>
        <Btn variant="fn" onClick={toggleSign}>+/−</Btn>
        <Btn variant="fn" onClick={percent}>%</Btn>
        <Btn variant="op" onClick={() => pressOperator('÷')}>÷</Btn>

        <Btn onClick={() => inputDigit('7')}>7</Btn>
        <Btn onClick={() => inputDigit('8')}>8</Btn>
        <Btn onClick={() => inputDigit('9')}>9</Btn>
        <Btn variant="op" onClick={() => pressOperator('×')}>×</Btn>

        <Btn onClick={() => inputDigit('4')}>4</Btn>
        <Btn onClick={() => inputDigit('5')}>5</Btn>
        <Btn onClick={() => inputDigit('6')}>6</Btn>
        <Btn variant="op" onClick={() => pressOperator('−')}>−</Btn>

        <Btn onClick={() => inputDigit('1')}>1</Btn>
        <Btn onClick={() => inputDigit('2')}>2</Btn>
        <Btn onClick={() => inputDigit('3')}>3</Btn>
        <Btn variant="op" onClick={() => pressOperator('+')}>+</Btn>

        <Btn wide onClick={() => inputDigit('0')}>0</Btn>
        <Btn onClick={inputDot}>.</Btn>

        {/* "=" with long-press to exit stealth */}
        <button
          onPointerDown={startHold}
          onPointerUp={handleEqualsPointerUp}
          onPointerLeave={() => cancelHold()}
          onPointerCancel={() => cancelHold()}
          className="relative h-16 rounded-full text-2xl font-medium bg-orange-500 text-white hover:bg-orange-400 transition active:scale-95 select-none overflow-hidden"
          aria-label="Equals. Hold for 2 seconds to exit calculator."
        >
          <span className="relative z-10">=</span>
          {holdProgress > 0 && (
            <span
              className="absolute inset-0 bg-white/25 transition-[width] duration-75 ease-linear"
              style={{ width: `${holdProgress}%` }}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Re-auth dialog (secure fallback) */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="z-[10000]">
          <DialogHeader>
            <DialogTitle>Confirm it's you</DialogTitle>
            <DialogDescription>
              Your session has expired. Sign in to exit stealth mode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {authError && (
              <p className="text-sm text-destructive" role="alert">{authError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAuthOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReauth}
              disabled={authLoading || !email || !password}
            >
              {authLoading ? 'Verifying…' : 'Unlock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
