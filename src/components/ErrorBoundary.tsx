import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback heading */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — catches unhandled render exceptions in its subtree
 * and displays a friendly fallback UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.label ?? "Page"} crashed:`, error);
    console.error("Component stack:", info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.label ?? "Ushbu bo'lim";
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full shadow-elevated">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Ma'lumotlarni yuklashda xatolik yuz berdi</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {label} da texnik xatolik yuz berdi. Iltimos qayta urinib ko'ring yoki sahifani yangilang.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Qayta urinish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Sahifani yangilash
                </Button>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Texnik ma'lumot
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-secondary/60 p-3 text-[11px] font-mono text-muted-foreground">
                    {this.state.error.stack ?? this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
