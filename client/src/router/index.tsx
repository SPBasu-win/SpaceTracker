import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { DashboardPage } from '../pages/DashboardPage'
import { GlobePage } from '../pages/GlobePage'
import { AssetsPage } from '../pages/AssetsPage'
import { AssetDetailPage } from '../pages/AssetDetailPage'
import { TrackedPage } from '../pages/TrackedPage'
import { SettingsPage } from '../pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'globe', element: <GlobePage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/:catalogNumber', element: <AssetDetailPage /> },
      { path: 'tracked', element: <TrackedPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
