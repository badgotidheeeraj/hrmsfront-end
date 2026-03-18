import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
const EMPLOYEE_API_URL = `${API_BASE_URL}/employee-register/`;
const ATTENDANCE_API_URL = `${API_BASE_URL}/attendance/`;
const attendanceStorageKey = "hrms-attendance-records";

const initialFormData = {
  full_name: "",
  email: "",
  department: "",
};

const attendanceStatuses = [
  {
    value: "Present",
    label: "Present",
    badgeClass: "bg-success-subtle text-success",
  },
  {
    value: "Absent",
    label: "Absent",
    badgeClass: "bg-danger-subtle text-danger",
  },
  {
    value: "On Leave",
    label: "On Leave",
    badgeClass: "bg-warning-subtle text-warning",
  },
];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const readStoredAttendance = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedRecords = window.localStorage.getItem(attendanceStorageKey);
    return storedRecords ? JSON.parse(storedRecords) : {};
  } catch (error) {
    console.error("Attendance Storage Read Error:", error);
    return {};
  }
};

const getEmployeeIdFromAttendance = (attendance) => {
  if (typeof attendance.employee === "object" && attendance.employee !== null) {
    return attendance.employee.id;
  }

  return attendance.employee;
};

const normalizeAttendanceRecord = (attendance) => ({
  id: attendance.id,
  employeeId: getEmployeeIdFromAttendance(attendance),
  date: attendance.date,
  status: attendance.status || "Pending",
  checkInTime: attendance.check_in_time || null,
  checkOutTime: attendance.check_out_time || null,
});

const getAttendanceBadgeClass = (status) => {
  if (status === "Present") {
    return "bg-success-subtle text-success";
  }

  if (status === "Absent") {
    return "bg-danger-subtle text-danger";
  }

  if (status === "On Leave") {
    return "bg-warning-subtle text-warning";
  }

  return "bg-secondary-subtle text-secondary";
};

function Home() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attendanceRecords, setAttendanceRecords] =
    useState(readStoredAttendance);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSuccess, setAttendanceSuccess] = useState("");
  const [savingAttendanceId, setSavingAttendanceId] = useState(null);

  const todayDate = getTodayDate();

  useEffect(() => {
    setAttendanceRecords((currentRecords) => {
      const nextRecords = {};

      employees.forEach((employee) => {
        nextRecords[employee.id] = currentRecords[employee.id] || {
          id: null,
          employeeId: employee.id,
          date: todayDate,
          status: "Pending",
          checkInTime: null,
          checkOutTime: null,
        };
      });

      return nextRecords;
    });
  }, [employees, todayDate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        attendanceStorageKey,
        JSON.stringify(attendanceRecords),
      );
    } catch (error) {
      console.error("Attendance Storage Save Error:", error);
    }
  }, [attendanceRecords]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEE_API_URL);
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

  useEffect(() => {
    const loadDashboardData = async () => {
      await fetchEmployees();

      try {
        const res = await axios.get(ATTENDANCE_API_URL);
        const attendanceList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.attendances)
            ? res.data.attendances
            : [];

        const todaysRecords = attendanceList
          .map(normalizeAttendanceRecord)
          .filter((record) => record.employeeId && record.date === todayDate);

        if (todaysRecords.length === 0) {
          return;
        }

        setAttendanceRecords((currentRecords) => {
          const nextRecords = { ...currentRecords };

          todaysRecords.forEach((record) => {
            nextRecords[record.employeeId] = record;
          });

          return nextRecords;
        });
      } catch (error) {
        console.error("Attendance Fetch Error:", error);
      }
    };

    loadDashboardData();
  }, [todayDate]);

  const handleChange = (e) => {
    if (errorMessage) {
      setErrorMessage("");
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
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

    return fallbackMessage;
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
      await axios.post(EMPLOYEE_API_URL, payload);
      await fetchEmployees();
      setFormData(initialFormData);
      setSuccessMessage("Employee added successfully.");
    } catch (error) {
      console.error("Create Error:", error);
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Employee was not added. Please check the form and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await axios.delete(`${EMPLOYEE_API_URL}${id}/`);
      setEmployees(employees.filter((emp) => emp.id !== id));
      setAttendanceRecords((currentRecords) => {
        const nextRecords = { ...currentRecords };
        delete nextRecords[id];
        return nextRecords;
      });
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const markAttendance = async (employeeId, status) => {
    const existingRecord = attendanceRecords[employeeId];
    const currentTime = getCurrentTime();
    const payload = {
      employee: employeeId,
      date: todayDate,
      status,
      check_in_time:
        status === "Present"
          ? existingRecord?.checkInTime || currentTime
          : null,
      check_out_time:
        status === "Absent" || status === "On Leave"
          ? null
          : existingRecord?.checkOutTime || null,
    };

    setAttendanceError("");
    setAttendanceSuccess("");
    setSavingAttendanceId(employeeId);

    try {
      let response;

      if (existingRecord?.id) {
        response = await axios.patch(
          `${ATTENDANCE_API_URL}${existingRecord.id}/`,
          payload,
        );
      } else {
        response = await axios.post(ATTENDANCE_API_URL, payload);
      }

      const savedRecord = normalizeAttendanceRecord(response.data);

      setAttendanceRecords((currentRecords) => ({
        ...currentRecords,
        [employeeId]: savedRecord,
      }));

      setAttendanceSuccess(`Attendance saved for employee ${employeeId}.`);
    } catch (error) {
      console.error("Attendance Save Error:", error);

      const fallbackRecord = {
        id: existingRecord?.id || null,
        employeeId,
        date: todayDate,
        status,
        checkInTime: payload.check_in_time,
        checkOutTime: payload.check_out_time,
      };

      setAttendanceRecords((currentRecords) => ({
        ...currentRecords,
        [employeeId]: fallbackRecord,
      }));

      setAttendanceError(
        getApiErrorMessage(
          error,
          "Attendance endpoint is not available yet. Status was saved only in this browser.",
        ),
      );
    } finally {
      setSavingAttendanceId(null);
    }
  };

  const attendanceSummary = employees.reduce(
    (summary, employee) => {
      const status = attendanceRecords[employee.id]?.status || "Pending";
      summary.total += 1;
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    },
    {
      total: 0,
      Present: 0,
      Absent: 0,
      "On Leave": 0,
      Pending: 0,
    },
  );

  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container py-4" id="home">
      <h1 className="text-center text-primary mb-4">
        🚀 Employee Management Dashboard
      </h1>

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
                        Delete
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
              Pending {attendanceSummary.Pending}
            </span>
          </div>

          <div className="card-body">
            {attendanceError ? (
              <div className="alert alert-warning py-2" role="alert">
                {attendanceError}
              </div>
            ) : null}

            {attendanceSuccess ? (
              <div className="alert alert-success py-2" role="status">
                {attendanceSuccess}
              </div>
            ) : null}

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
                    {attendanceSummary.Present}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-danger-subtle">
                  <div className="text-danger-emphasis small">Absent</div>
                  <div className="fs-3 fw-bold text-danger">
                    {attendanceSummary.Absent}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100 bg-warning-subtle">
                  <div className="text-warning-emphasis small">On Leave</div>
                  <div className="fs-3 fw-bold text-warning">
                    {attendanceSummary["On Leave"]}
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
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th className="text-center">Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => {
                      const record = attendanceRecords[employee.id] || {
                        status: "Pending",
                        date: todayDate,
                        checkInTime: null,
                        checkOutTime: null,
                      };

                      return (
                        <tr key={`attendance-${employee.id}`}>
                          <td>
                            <div className="fw-semibold">
                              {employee.full_name}
                            </div>
                            <div className="text-muted small">
                              {employee.employee_id || employee.email}
                            </div>
                          </td>
                          <td>{employee.department}</td>
                          <td>{record.date || todayDate}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${getAttendanceBadgeClass(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td>{record.checkInTime || "--"}</td>
                          <td>{record.checkOutTime || "--"}</td>
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
                                  disabled={savingAttendanceId === employee.id}
                                  onClick={() =>
                                    markAttendance(employee.id, status.value)
                                  }
                                >
                                  {savingAttendanceId === employee.id &&
                                  record.status !== status.value
                                    ? "Saving..."
                                    : status.label}
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
