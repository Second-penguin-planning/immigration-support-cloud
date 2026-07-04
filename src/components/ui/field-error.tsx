export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-danger mt-1 text-sm">
      {children}
    </p>
  );
}
