import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { UrlInputPage } from "./components/UrlInputPage";
import "./App.css";

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="App">
        <Routes>
          {/* Route for cart display */}
          <Route path="/:cartId" element={<HomePage />} />

          {/* Default route for URL input */}
          <Route path="/" element={<UrlInputPage />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
