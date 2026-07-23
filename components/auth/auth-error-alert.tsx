type AuthErrorAlertProps = {
  title?: string;
  message: string;
};

export function AuthErrorAlert({ title, message }: AuthErrorAlertProps) {
  return (
    <div
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left"
      role="alert"
    >
      {title ? <p className="text-sm font-medium text-destructive">{title}</p> : null}
      <p
        className={
          title
            ? "mt-1 break-words text-sm text-destructive/90"
            : "break-words text-sm text-destructive"
        }
      >
        {message}
      </p>
    </div>
  );
}
