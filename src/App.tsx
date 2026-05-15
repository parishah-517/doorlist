import { Navigate, Route, Routes } from "react-router-dom";
import CreateEventScreen from "./screens/CreateEventScreen";
import { EventScreen } from "./screens/EventScreen";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/create" replace />} />
      <Route path="/create" element={<CreateEventScreen />} />
      <Route path="/events/:id" element={<EventScreen />} />
    </Routes>
  );
}
