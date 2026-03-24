declare module "@supabase/phoenix/priv/static/types/timer" {
  export default class Timer {
    constructor(callback: () => void, timerCalc: (tries: number) => number);
    callback: () => void;
    timerCalc: (tries: number) => number;
    timer: ReturnType<typeof setTimeout> | undefined;
    tries: number;
    reset(): void;
    scheduleTimeout(): void;
  }
}

declare module "@supabase/phoenix/priv/static/types/types" {
  export type Vsn = "1.0.0" | "2.0.0";
}
