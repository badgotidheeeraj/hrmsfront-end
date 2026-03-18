import React, { useEffect, useState } from "react";

function Home() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    fetch("http://localhost:8000/employees/")
      .then((response) => response.json())
      .then((data) => setEmployees(data.employees || []))
      .catch((error) => console.error("Error:", error));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:8000/employees/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then(() => {
        fetchEmployees();
        setFormData({ full_name: "", email: "", department: "" });
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🚀 Employee Management Dashboard</h1>

      {/* Employee Form */}
      <h2>Add Employee</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
          style={{ marginRight: "10px", padding: "5px" }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ marginRight: "10px", padding: "5px" }}
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          required
          style={{ marginRight: "10px", padding: "5px" }}
        />

        <button type="submit" style={{ padding: "6px 15px" }}>
          Add Employee
        </button>
      </form>

      {/* Employee Table */}
      <h3>Total Employees: {employees.length}</h3>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.employee_id}</td>
              <td>{emp.full_name}</td>
              <td>{emp.email}</td>
              <td>{emp.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Home;
