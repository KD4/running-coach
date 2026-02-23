import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App'

// 디버깅용 에러 바운더리: 빈 화면 대신 에러 메시지를 표시
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red', whiteSpace: 'pre-wrap', fontSize: 14 }}>
          <h2>렌더링 에러 발생</h2>
          <p><b>{this.state.error.message}</b></p>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TDSMobileAITProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </TDSMobileAITProvider>
    </ErrorBoundary>
  </StrictMode>,
)
