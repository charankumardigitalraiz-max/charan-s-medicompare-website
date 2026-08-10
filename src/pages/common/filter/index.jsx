import { useState } from "react";
import { Link } from "react-router-dom";

export const Filter = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const HandleFilterClick = () => {
    setIsFilterOpen(!isFilterOpen); // Toggle the state value
  };

  return (
    <div>
      <div
        className={`form-sorts dropdown ${
          isFilterOpen ? "table-filter-show" : ""
        }`}
      >
        <Link
          to="#"
          className="dropdown-toggle"
          id="table-filter"
          onClick={HandleFilterClick}
        >
          <i className="fa-solid fa-filter me-2" />
          Filter By
        </Link>
        <div className="filter-dropdown-menu">
          <div className="filter-set-view">
            <div className="accordion" id="accordionExample">
              <div className="filter-set-content">
                <div className="filter-set-content-head">
                  <Link
                    to="#"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseTwo"
                    aria-expanded="false"
                    aria-controls="collapseTwo"
                  >
                    Name
                    <i className="fa-solid fa-chevron-right" />
                  </Link>
                </div>
                <div
                  className="filter-set-contents accordion-collapse collapse show"
                  id="collapseTwo"
                  data-bs-parent="#accordionExample"
                >
                  <ul>
                    <li>
                      <div className="input-block dash-search-input w-100">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search"
                        />
                        <span className="search-icon">
                          <i className="fa-solid fa-magnifying-glass" />
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="filter-set-content">
                <div className="filter-set-content-head">
                  <Link
                    to="#"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseOne"
                    aria-expanded="true"
                    aria-controls="collapseOne"
                  >
                    Appointment Type
                    <i className="fa-solid fa-chevron-right" />
                  </Link>
                </div>
                <div
                  className="filter-set-contents accordion-collapse collapse show"
                  id="collapseOne"
                  data-bs-parent="#accordionExample"
                >
                  <ul>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" defaultChecked />
                          <span className="checkmarks" />
                          <span className="check-title">All Type</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Video Call</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Audio Call</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Chat</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Direct Visit</span>
                        </label>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="filter-set-content">
                <div className="filter-set-content-head">
                  <Link
                    to="#"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseThree"
                    aria-expanded="false"
                    aria-controls="collapseThree"
                  >
                    Visit Type
                    <i className="fa-solid fa-chevron-right" />
                  </Link>
                </div>
                <div
                  className="filter-set-contents accordion-collapse collapse show"
                  id="collapseThree"
                  data-bs-parent="#accordionExample"
                >
                  <ul>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" defaultChecked />
                          <span className="checkmarks" />
                          <span className="check-title">All Visit</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">General</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Consultation</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Follow-up</span>
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="filter-checks">
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                          <span className="check-title">Direct Visit</span>
                        </label>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="filter-reset-btns">
              <Link to="#" className="btn btn-light">
                Reset
              </Link>
              <Link to="#" className="btn btn-primary">
                Filter Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const initialSettings = {
  endDate: new Date("2020-08-11T12:30:00.000Z"),
  ranges: {
    "Last 30 Days": [
      new Date("2020-07-12T04:57:17.076Z"),
      new Date("2020-08-10T04:57:17.076Z"),
    ],
    "Last 7 Days": [
      new Date("2020-08-04T04:57:17.076Z"),
      new Date("2020-08-10T04:57:17.076Z"),
    ],
    "Last Month": [
      new Date("2020-06-30T18:30:00.000Z"),
      new Date("2020-07-31T18:29:59.999Z"),
    ],
    "This Month": [
      new Date("2020-07-31T18:30:00.000Z"),
      new Date("2020-08-31T18:29:59.999Z"),
    ],
    Today: [
      new Date("2020-08-10T04:57:17.076Z"),
      new Date("2020-08-10T04:57:17.076Z"),
    ],
    Yesterday: [
      new Date("2020-08-09T04:57:17.076Z"),
      new Date("2020-08-09T04:57:17.076Z"),
    ],
  },
  startDate: new Date("2020-08-04T04:57:17.076Z"), // Set "Last 7 Days" as default
  timePicker: false,
};
