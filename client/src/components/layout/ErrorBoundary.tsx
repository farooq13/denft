import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
          <Card variant="elevated" className="max-w-md w-full border-error-500/20 bg-error-500/5">
            <CardBody className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-error-500/20 flex items-center justify-center mb-6 animate-pulse">
                <AlertTriangle className="h-8 w-8 text-error-400" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-50 mb-2">Something went wrong</h1>
              <p className="text-sm text-neutral-400 mb-6">
                An unexpected error occurred in the application. We apologize for the inconvenience.
              </p>
              

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  variant="primary" 
                  fullWidth 
                  leftIcon={<RefreshCcw className="h-4 w-4" />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  leftIcon={<Home className="h-4 w-4" />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
