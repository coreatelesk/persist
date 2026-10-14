export type ActionState = {
  ok?: boolean;
  error?: string;
  /** Success text to show after saving. */
  message?: string;
  fieldErrors?: Record<string, string>;
};
