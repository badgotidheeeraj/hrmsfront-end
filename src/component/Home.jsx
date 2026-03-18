import React, { useEffect, useState } from "react";
import axios from "axios";

const initialFormData = {
  full_name: "",
  email: "",
  department: "",
};

const attendanceStatuses = [
  { value: "present", label: "Present", badgeClass: "bg-success-subtle text-success" },
  { value: "absent", label: "Absent", badgeClass: "bg-danger-subtle text-danger" },
  { value: "leave", label: "On Leave", badgeClass: "bg-warning-subtle text-warning" },
];

function Home() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/employee-register/",
      );
      const employeeList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.employees)
          ? res.data.employees
          : [];

      setEmployees(employeeList);
    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorMessage("Unable to load employees. Please refresh the page.");
    }
  };

  const handleChange = (e) => {
    if (errorMessage) {
      setErrorMessage("");
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getApiErrorMessage = (error) => {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.detail) {
      return data.detail;
    }

    if (typeof data === "object" && data !== null) {
      const firstError = Object.entries(data).find(([, value]) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      );

      if (firstError) {
        const [field, value] = firstError;
        const message = Array.isArray(value) ? value[0] : value;
        return `${field}: ${message}`;
      }
    }

    return "Employee was not added. Please check the form and try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      department: formData.department.trim(),
    };

    if (!payload.full_name || !payload.email || !payload.department) {
      setErrorMessage("Full name, email, and department are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        "http://localhost:8000/api/employee-register/",
        payload,
      );

      await fetchEmployees();
      setFormData(initialFormData);
      setSuccessMessage("Employee added successfully.");
    } catch (error) {
      console.error("Create Error:", error);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/employee-register/${id}/`);

      setEmployees(employees.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  useEffect(() => {
    setAttendanceRecords((currentRecords) => {
      const nextRecords = {};

      employees.forEach((employee) => {
        nextRecords[employee.id] = currentRecords[employee.id] || {
          status: "pending",
          markedAt: null,
        };
      });

      return nextRecords;
    });
  }, [employees]);

  const markAttendance = (employeeId, status) => {
    setAttendanceRecords((currentRecords) => ({
      ...currentRecords,
      [employeeId]: {
        status,
        markedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    }));
  };

  const attendanceSummary = employees.reduce(
    (summary, employee) => {
      const status = attendanceRecords[employee.id]?.status || "pending";
      summary.total += 1;
      summary[status] += 1;
      return summary;
    },
    {
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      pending: 0,
    },
  );

  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getAttendanceBadgeClass = (status) => {
    if (status === "present") {
      return "bg-success-subtle text-success";
    }

    if (status === "absent") {
      return "bg-danger-subtle text-danger";
    }

    if (status === "leave") {
      return "bg-warning-subtle text-warning";
    }

    return "bg-secondary-subtle text-secondary";
  };

  const getAttendanceLabel = (status) => {
    const match = attendanceStatuses.find((item) => item.value === status);
    return match ? match.label : "Pending";
  };

  return (
    <div className="container py-4" id="home">
      <h1 className="text-center text-primary mb-4">
        🚀 Employee Management Dashboard
      </h1>

      {/* Add Employee */}

      <div className="card shadow mb-4" id="add-employee">
        <div className="card-header bg-primary text-white">Add Employee</div>

        <div className="card-body">
          {errorMessage ? (
            <div className="alert alert-danger py-2" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="alert alert-success py-2" role="status">
              {successMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                name="full_name"
                className="form-control"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <input
                type="text"
                name="department"
                className="form-control"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <button className="btn btn-success" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Employee Table */}

      <div className="card shadow" id="employees">
        <div className="card-header bg-dark text-white">
          Employees ({employees.length})
        </div>

        <div className="card-body">
          <table className="table table-hover table-bordered text-center">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th width="120">Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6">No Employees Found</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>

                    <td className="text-primary fw-bold">{emp.employee_id}</td>

                    <td>{emp.full_name}</td>

                    <td>{emp.email}</td>

                    <td>
                      <span className="badge bg-info text-dark">
                        {emp.department}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteEmployee(emp.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-4" id="attendance">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header bg-info text-dark d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
            <div>
              <h2 className="h5 mb-1">Attendance Board</h2>
              <p className="mb-0 small">{todayLabel}</p>
            </div>
            <span className="badge bg-dark fs-6">
              Pending {attendanceSummary.pending}
            </span>
          </div>

          <div className="card-body">
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-light">
                  <div className="text-muted small">Total Employees</div>
                  <div className="fs-3 fw-bold text-dark">
                    {attendanceSummary.total}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-success-subtle">
                  <div className="text-success-emphasis small">Present</div>
                  <div className="fs-3 fw-bold text-success">
                    {attendanceSummary.present}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-danger-subtle">
                  <div className="text-danger-emphasis small">Absent</div>
                  <div className="fs-3 fw-bold text-danger">
                    {attendanceSummary.absent}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-warning-subtle">
                  <div className="text-warning-emphasis small">On Leave</div>
                  <div className="fs-3 fw-bold text-warning">
                    {attendanceSummary.leave}
                  </div>
                </div>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="alert alert-secondary mb-0">
                Add employees first, then mark their attendance here.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Marked Time</th>
                      <th className="text-center">Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => {
                      const record = attendanceRecords[employee.id] || {
                        status: "pending",
                        markedAt: null,
                      };

                      return (
                        <tr key={`attendance-${employee.id}`}>
                          <td>
                            <div className="fw-semibold">{employee.full_name}</div>
                            <div className="text-muted small">
                              {employee.employee_id || employee.email}
                            </div>
                          </td>
                          <td>{employee.department}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${getAttendanceBadgeClass(record.status)}`}
                            >
                              {getAttendanceLabel(record.status)}
                            </span>
                          </td>
                          <td>{record.markedAt || "--"}</td>
                          <td className="text-center">
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                              {attendanceStatuses.map((status) => (
                                <button
                                  key={`${employee.id}-${status.value}`}
                                  type="button"
                                  className={`btn btn-sm ${
                                    record.status === status.value
                                      ? "btn-dark"
                                      : "btn-outline-dark"
                                  }`}
                                  onClick={() => markAttendance(employee.id, status.value)}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
