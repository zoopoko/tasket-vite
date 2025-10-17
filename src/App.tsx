import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';

// Auth pages
import LoginPage from '@/pages/auth/login/page';
import SignupPage from '@/pages/auth/signup/page';

// Main pages
import DashboardPage from '@/pages/dashboard/page';
import ProjectsPage from '@/pages/projects/page';
import ProjectDetailPage from '@/pages/projects/[id]/PageClient';
import ProjectChatPage from '@/pages/projects/[id]/chat/PageClient';
import ProjectAIChatPage from '@/pages/projects/[id]/ai-chat/PageClient';
import ProjectReviewPage from '@/pages/projects/[id]/review/PageClient';
import ProjectDepositPaymentPage from '@/pages/projects/[id]/payment/deposit/PageClient';
import ProjectFinalPaymentPage from '@/pages/projects/[id]/payment/final/PageClient';

import ProjectsNewPage from '@/pages/projects/new/page';
import ProjectsReviewPage from '@/pages/projects/review/page';

import ChatPage from '@/pages/chat/[projectId]/ChatPageClient';
import ContractPage from '@/pages/contracts/[id]/PageClient';

import ProposalsPage from '@/pages/dashboard/proposals/[projectId]/PageClient';
import MyProjectEditPage from '@/pages/my-projects/[id]/edit/PageClient';
import MyProjectProposalsPage from '@/pages/my-projects/[id]/proposals/PageClient';

import NotificationsPage from '@/pages/notifications/page';
import ProfilePage from '@/pages/profile/page';
import AdminPage from '@/pages/admin/page';

// 404 Page
const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-gray-600">ページが見つかりません</p>
      <a href="/" className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
        ホームに戻る
      </a>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Main routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Projects */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectsNewPage />} />
            <Route path="/projects/review" element={<ProjectsReviewPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/chat" element={<ProjectChatPage />} />
            <Route path="/projects/:id/ai-chat" element={<ProjectAIChatPage />} />
            <Route path="/projects/:id/review" element={<ProjectReviewPage />} />
            <Route path="/projects/:id/payment/deposit" element={<ProjectDepositPaymentPage />} />
            <Route path="/projects/:id/payment/final" element={<ProjectFinalPaymentPage />} />

            {/* Chat */}
            <Route path="/chat/:projectId" element={<ChatPage />} />

            {/* Contracts */}
            <Route path="/contracts/:id" element={<ContractPage />} />

            {/* Dashboard sub-pages */}
            <Route path="/dashboard/proposals/:projectId" element={<ProposalsPage />} />

            {/* My Projects */}
            <Route path="/my-projects/:id/edit" element={<MyProjectEditPage />} />
            <Route path="/my-projects/:id/proposals" element={<MyProjectProposalsPage />} />

            {/* Other pages */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
