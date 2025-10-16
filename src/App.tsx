import { Route, Routes } from 'react-router-dom';

import DashboardLayout from './pages/DashboardLayout';
import Details from './pages/Details';
import Home from './pages/Home';
import Login from './pages/Login';
import NewStatement from './pages/NewStatement';
import NotFound from './pages/NotFound';
import { SavedStatements } from './pages/SavedStatements';
import ProtectedRoute from './routes/ProtectedRoute';
import UnProtectedRoute from './routes/UnprotectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<DashboardLayout />}>
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path='/new-statement'
          element={
            <ProtectedRoute>
              <NewStatement />
            </ProtectedRoute>
          }
        />
        <Route
          path='/details/:id'
          element={
            <ProtectedRoute>
              <Details />
            </ProtectedRoute>
          }
        />
        <Route
          path='/saved-statements'
          element={
            <ProtectedRoute>
              <SavedStatements />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path='/login'
        element={
          <UnProtectedRoute>
            <Login />
          </UnProtectedRoute>
        }
      />
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
};

export default App;
