import { useEffect, useState } from "react";
import Header from "./components/Header";

function App() {
  const [message, setMessage] = useState("Loading...");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Test connection to Odoo through our backend API
    fetch("http://111.111.111.120:30001/api/odoo")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to API");
        }

        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to connect to Odoo");
      });

    // Get Odoo users through our backend API
    fetch("http://111.111.111.120:30001/api/odoo/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to retrieve Odoo users");
        }

        return response.json();
      })
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to retrieve Odoo users");
      });
  }, []);

  return (
    <div>
      <Header />

      <h2>{message}</h2>

      {error && <p>{error}</p>}

      <h3>Odoo Users</h3>

      {users.length === 0 ? (
        <p>Loading users...</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <strong>{user.name}</strong> - {user.login}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
