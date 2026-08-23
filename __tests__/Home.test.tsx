import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardPage from '@/app/page'

// Mock the child components to isolate the page render
jest.mock('@/components/layout/Header', () => () => <div data-testid="mock-header" />)
jest.mock('@/components/dashboard/TrendGrid', () => () => <div data-testid="mock-trend-grid" />)
jest.mock('@/components/dashboard/PostFeed', () => () => <div data-testid="mock-post-feed" />)
jest.mock('@/components/dashboard/SkeletonGrid', () => () => <div data-testid="mock-skeleton-grid" />)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: () => <div data-testid="mock-pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}))

// Mock window.matchMedia since Recharts needs it internally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Dashboard Page', () => {
  it('renders a heading', () => {
    render(<DashboardPage />)
    
    // Check if the "Trending Now" text is in the document
    const heading = screen.getByText(/Trending Now/i)
    expect(heading).toBeInTheDocument()
  })
})
