import React from "react";

const Nav = () => {
  return (
    <nav className="bg-primary shadow-sm sticky-top">
      <div className="container py-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <a className="navbar-brand text-white fw-bold mb-0" href="#home">
            HRMS
          </a>

          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-4">
            <a className="text-white text-decoration-none fw-medium" href="#home">
              Home
            </a>
            <a
              className="text-white text-decoration-none fw-medium"
              href="#add-employee"
            >
              Add Employee
            </a>
            <a
              className="text-white text-decoration-none fw-medium"
              href="#employees"
            >
              Employees
            </a>
            <a
              className="text-white text-decoration-none fw-medium"
              href="#attendance"
            >
              Attendance
            </a>
            <a className="btn btn-light text-primary fw-semibold" href="#add-employee">
              New Employee
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
