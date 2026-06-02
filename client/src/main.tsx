import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import type { EventItem } from "../../shared/schema";

const API_URL = "https://cpp-coe-event-management.onrender.com/api/events";

function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [host, setHost] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [roomReserved, setRoomReserved] = useState(false);
  const [cateringNeeded, setCateringNeeded] = useState(false);
  const [cateringOrdered, setCateringOrdered] = useState(false);
  const [status, setStatus] = useState("");
  const [roomConfirmation, setRoomConfirmation] = useState("");
  const [description, setDescription] = useState("");

  const [hostFilter, setHostFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roomFilter, setRoomFilter] = useState("");
  const [cateringNeededFilter, setCateringNeededFilter] = useState("");
  const [cateringOrderedFilter, setCateringOrderedFilter] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);

  const todayLong = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadEvents = async () => {
    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const data: EventItem[] = await res.json();
      setEvents(data);
      setError("");
    } catch {
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setEventName("");
    setDate("");
    setLocation("");
    setHost("");
    setAudience([]);
    setRoomReserved(false);
    setCateringNeeded(false);
    setCateringOrdered(false);
    setStatus("");
    setRoomConfirmation("");
    setDescription("");
  };

  const handleAudienceChange = (value: string) => {
    setAudience((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleAudienceFilterChange = (value: string) => {
    setAudienceFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const clearFilters = () => {
    setHostFilter("");
    setAudienceFilter([]);
    setStatusFilter([]);
    setRoomFilter("");
    setCateringNeededFilter("");
    setCateringOrderedFilter("");
  };

  const downloadFilteredEventsCSV = () => {
    const headers = [
      "Date",
      "Event",
      "Days Left",
      "Location",
      "Host",
      "Audience",
      "Room Reserved",
      "Catering Needed",
      "Catering Ordered",
      "Status",
      "Notes",
    ];

    const rows = filteredEvents.map((event) => [
      formatDate(event.date),
      event.eventName,
      getDaysAway(event.date),
      event.location || "-",
      event.host || "-",
      event.audience || "-",
      event.roomReserved ? "Yes" : "No",
      event.cateringNeeded ? "Yes" : "No",
      event.cateringNeeded ? (event.cateringOrdered ? "Yes" : "No") : "-",
      event.status || "-",
      event.description || "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "filtered-events.csv";
    link.click();

    URL.revokeObjectURL(url);
  };  

  const getDaysAway = (eventDate: string) => {
    const today = new Date();
    const event = new Date(eventDate + "T00:00:00");

    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days < 0) return "Past due";
    if (days === 0) return "Today";
    if (days > 30) return ">30 days";
    if (days === 1) return "1 day";

    return `${days} days`;
  };

  const isPastEvent = (date: string) => {
    const today = new Date();
    const eventDate = new Date(date + "T00:00:00");

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate.getTime() < today.getTime();
  };

  const formatDate = (dateString: string) => {
    const formattedDate = new Date(dateString + "T00:00:00");

    return formattedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredEvents = sortedEvents.filter((event) => {
    const matchesStatus =
      statusFilter.length === 0 ||
      statusFilter.some((item) => event.status === item);
    const matchesHost = hostFilter === "" || event.host === hostFilter;

    const matchesAudience =
      audienceFilter.length === 0 ||
      audienceFilter.some((item) => (event.audience ?? "").includes(item));

    const matchesRoom =
      roomFilter === "" ||
      (roomFilter === "yes" && event.roomReserved === true) ||
      (roomFilter === "no" && event.roomReserved !== true);

    const matchesCateringNeeded =
      cateringNeededFilter === "" ||
      (cateringNeededFilter === "yes" && event.cateringNeeded === true) ||
      (cateringNeededFilter === "no" && event.cateringNeeded !== true);

    const matchesCateringOrdered =
      cateringOrderedFilter === "" ||
      (cateringOrderedFilter === "yes" && event.cateringOrdered === true) ||
      (cateringOrderedFilter === "no" && event.cateringOrdered !== true);

    return (
      matchesHost &&
      matchesAudience &&
      matchesStatus &&
      matchesRoom &&
      matchesCateringNeeded &&
      matchesCateringOrdered
    );
  });

  const upcomingEventsWithin15Days = sortedEvents.filter((event) => {
    const today = new Date();
    const eventDate = new Date(event.date + "T00:00:00");

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return days >= 0 && days <= 15;
  });

  const completedEvents = events.filter((event) => isPastEvent(event.date)).length;
  const eventsLeft = events.length - completedEvents;

  const handleSubmitEvent = async () => {
    if (!eventName || !date) {
      setError("Event name and date are required");
      return;
    }

    const eventData: EventItem = {
      id: editingId ?? Date.now(),
      eventName,
      date,
      location,
      host,
      audience: audience.join(", "),
      roomReserved,
      cateringNeeded,
      cateringOrdered,
      status,
      roomConfirmation,
      description,
    };

    try {
      const url = editingId === null ? API_URL : `${API_URL}/${editingId}`;
      const method = editingId === null ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        throw new Error("Failed to save event");
      }

      await loadEvents();
      resetForm();
      setError("");
    } catch {
      setError("Failed to save event");
    }
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingId(event.id);
    setEventName(event.eventName);
    setDate(event.date);
    setLocation(event.location ?? "");
    setHost(event.host ?? "");
    setAudience(event.audience ? event.audience.split(", ").filter(Boolean) : []);
    setRoomReserved(event.roomReserved ?? false);
    setCateringNeeded(event.cateringNeeded ?? false);
    setCateringOrdered(event.cateringOrdered ?? false);
    setStatus(event.status ?? "");
    setRoomConfirmation(event.roomConfirmation ?? "");
    setDescription(event.description ?? "");

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      await loadEvents();

      if (editingId === id) {
        resetForm();
      }

      setError("");
    } catch {
      setError("Failed to delete event");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={brandBlockStyle}>
          <div style={logoMarkStyle}>CPP</div>

          <div>
            <div style={brandTitleStyle}>Cal Poly Pomona</div>
            <div style={brandSubtitleStyle}>College of Engineering</div>
          </div>
        </div>

        <div style={titleCenterStyle}>
          <h1 style={mainTitleStyle}>Event Management</h1>
          <p style={dateStyle}>{todayLong}</p>
        </div>

        <div style={statsRowStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{events.length}</strong>
            <span>Total Events</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>
              {completedEvents}/{events.length}
            </strong>
            <span>Total Events Completed</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>
              {eventsLeft}/{events.length}
            </strong>
            <span>Total Events Left</span>
          </div>
        </div>
      </div>

      <div style={dashboardGridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Upcoming Events</h2>

          {upcomingEventsWithin15Days.length === 0 ? (
            <p style={emptyTextStyle}>No events within the next 15 days.</p>
          ) : (
            <div style={daysListStyle}>
              {upcomingEventsWithin15Days.map((event) => (
                <div key={event.id} style={daysItemStyle}>
                  <div>
                    <strong>{event.eventName}</strong>
                    <p style={smallTextStyle}>{formatDate(event.date)}</p>
                  </div>

                  <span style={badgeStyle}>{getDaysAway(event.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle} ref={formRef}>
          <h2 style={sectionTitleStyle}>
            {editingId === null ? "Add Event" : "Edit Event"}
          </h2>

          <div style={formGridStyle}>
            <input
              style={inputStyle}
              placeholder="Event Name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />

            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <input
              style={inputStyle}
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <select
              style={inputStyle}
              value={host}
              onChange={(e) => setHost(e.target.value)}
            >
              <option value="">Select Host</option>
              <option value="CoE">CoE</option>
              <option value="DLB">DLB</option>
              <option value="Other">Other</option>
            </select>

            <select
              style={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Tentative">Tentative</option>
            </select>

            <input
              style={inputStyle}
              placeholder="Room Confirmation #"
              value={roomConfirmation}
              onChange={(e) => setRoomConfirmation(e.target.value)}
            />

            <div style={audienceBoxStyle}>
              <strong>Audience</strong>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("Students")}
                  onChange={() => handleAudienceChange("Students")}
                />
                Students
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("SAB")}
                  onChange={() => handleAudienceChange("SAB")}
                />
                SAB
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("DLB")}
                  onChange={() => handleAudienceChange("DLB")}
                />
                DLB
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("Faculty")}
                  onChange={() => handleAudienceChange("Faculty")}
                />
                Faculty
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("Staff")}
                  onChange={() => handleAudienceChange("Staff")}
                />
                Staff
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={audience.includes("Other")}
                  onChange={() => handleAudienceChange("Other")}
                />
                Other
              </label>
            </div>

            <input
              style={inputStyle}
              placeholder="Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={checkboxRowStyle}>
            <label>
              <input
                type="checkbox"
                checked={roomReserved}
                onChange={(e) => setRoomReserved(e.target.checked)}
              />
              Room Reserved
            </label>

            <label>
              <input
                type="checkbox"
                checked={cateringNeeded}
                onChange={(e) => setCateringNeeded(e.target.checked)}
              />
              Catering Needed
            </label>

            <label>
              <input
                type="checkbox"
                checked={cateringOrdered}
                onChange={(e) => setCateringOrdered(e.target.checked)}
              />
              Catering Ordered
            </label>
          </div>

          <button style={buttonStyle} onClick={handleSubmitEvent}>
            {editingId === null ? "Add Event" : "Update Event"}
          </button>

          {editingId !== null && (
            <button style={cancelButtonStyle} onClick={resetForm}>
              Cancel Edit
            </button>
          )}

          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>All Events</h2>

        <div style={filterBoxStyle}>
          <select
            style={{
              ...filterInputStyle,
              textAlignLast: "center",
            }}
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
          >
            <option value="">All Hosts</option>
            <option value="CoE">CoE</option>
            <option value="DLB">DLB</option>
            <option value="Other">Other</option>
          </select>

          <div style={filterAudienceBoxStyle}>
            <strong>Audience Filter</strong>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("Students")}
                onChange={() => handleAudienceFilterChange("Students")}
              />
              Students
            </label>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("SAB")}
                onChange={() => handleAudienceFilterChange("SAB")}
              />
              SAB
            </label>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("DLB")}
                onChange={() => handleAudienceFilterChange("DLB")}
              />
              DLB
            </label>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("Faculty")}
                onChange={() => handleAudienceFilterChange("Faculty")}
              />
              Faculty
            </label>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("Staff")}
                onChange={() => handleAudienceFilterChange("Staff")}
              />
              Staff
            </label>

            <label>
              <input
                type="checkbox"
                checked={audienceFilter.includes("Other")}
                onChange={() => handleAudienceFilterChange("Other")}
              />
              Other
            </label>
          </div>

          <div style={filterAudienceBoxStyle}>
            <strong>Status Filter</strong>

            <label>
              <input
                type="checkbox"
                checked={statusFilter.includes("Not Started")}
                onChange={() => handleStatusFilterChange("Not Started")}
              />
              Not Started
            </label>

            <label>
              <input
                type="checkbox"
                checked={statusFilter.includes("In Progress")}
                onChange={() => handleStatusFilterChange("In Progress")}
              />
              In Progress
            </label>

            <label>
              <input
                type="checkbox"
                checked={statusFilter.includes("Complete")}
                onChange={() => handleStatusFilterChange("Complete")}
              />
              Complete
            </label>

            <label>
              <input
                type="checkbox"
                checked={statusFilter.includes("Tentative")}
                onChange={() => handleStatusFilterChange("Tentative")}
              />
              Tentative
            </label>
          </div>

          <select
            style={{
              ...filterInputStyle,
              textAlignLast: "center",
            }}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">Room Reserved: All</option>
            <option value="yes">Room Reserved: Yes</option>
            <option value="no">Room Reserved: No</option>
          </select>

          <select
            style={{
              ...filterInputStyle,
              textAlignLast: "center",
            }}
            value={cateringNeededFilter}
            onChange={(e) => setCateringNeededFilter(e.target.value)}
          >
            <option value="">Catering Needed: All</option>
            <option value="yes">Catering Needed: Yes</option>
            <option value="no">Catering Needed: No</option>
          </select>

          <select
            style={{
              ...filterInputStyle,
              textAlignLast: "center",
            }}
            value={cateringOrderedFilter}
            onChange={(e) => setCateringOrderedFilter(e.target.value)}
          >
            <option value="">Catering Ordered: All</option>
            <option value="yes">Catering Ordered: Yes</option>
            <option value="no">Catering Ordered: No</option>
          </select>

          <button style={clearFilterButtonStyle} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <p style={filterCountStyle}>
          Showing {filteredEvents.length} of {events.length} events
        </p>

        <button
          style={downloadButtonStyle}
          onClick={downloadFilteredEventsCSV}
        >
          Download Filtered Events
        </button>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Days Left</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Host</th>
                <th style={thStyle}>Audience</th>
                <th style={thStyle}>Room Reserved</th>
                <th style={thStyle}>Catering Needed</th>
                <th style={thStyle}>Catering Ordered</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Room Confirmation #</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map((e, index) => {
                const previousEvent = filteredEvents[index - 1];

                const shouldShowDivider =
                  index > 0 &&
                  previousEvent &&
                  isPastEvent(previousEvent.date) &&
                  !isPastEvent(e.date);

                return (
                  <tr
                    key={e.id}
                    style={{
                      ...(isPastEvent(e.date) ? pastEventRowStyle : {}),
                      ...(shouldShowDivider ? dividerRowStyle : {}),
                    }}
                  >
                    <td style={tdStyle}>{formatDate(e.date)}</td>
                    <td style={tdStyle}>{e.eventName}</td>
                    <td style={tdStyle}>{getDaysAway(e.date)}</td>
                    <td style={tdStyle}>{e.location || "-"}</td>
                    <td style={tdStyle}>{e.host || "-"}</td>
                    <td style={tdStyle}>{e.audience || "-"}</td>

                    <td
                      style={{
                        ...tdStyle,
                        color: e.roomReserved ? "green" : "red",
                        fontWeight: 700,
                      }}
                    >
                      {e.roomReserved ? "Yes" : "No"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        color: e.cateringNeeded ? "green" : "red",
                        fontWeight: 700,
                      }}
                    >
                      {e.cateringNeeded ? "Yes" : "No"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        color: e.cateringNeeded
                          ? e.cateringOrdered
                            ? "green"
                            : "red"
                          : "#777",
                        fontWeight: 700,
                      }}
                    >
                      {e.cateringNeeded ? (e.cateringOrdered ? "Yes" : "No") : "-"}
                    </td>

                    <td style={tdStyle}>{e.status || "-"}</td>
                    <td style={tdStyle}>{e.roomConfirmation || "-"}</td>
                    <td style={tdStyle}>{e.description || "-"}</td>

                    <td style={tdStyle}>
                      <button
                        style={smallButtonStyle}
                        onClick={() => handleEditEvent(e)}
                      >
                        Edit
                      </button>

                      <button
                        style={deleteButtonStyle}
                        onClick={() => handleDeleteEvent(e.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const green = "#174C2F";
const gold = "#C9B037";
const lightGreen = "#D7E3C5";

const pageStyle: React.CSSProperties = {
  padding: "28px",
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f4f6f1",
  minHeight: "100vh",
};

const heroStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderTop: `8px solid ${green}`,
  borderBottom: `8px solid ${green}`,
  padding: "28px 34px",
  marginBottom: "24px",
  display: "grid",
  gridTemplateColumns: "1fr 1.4fr 1fr",
  gap: "24px",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const brandBlockStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
};

const logoMarkStyle: React.CSSProperties = {
  width: "78px",
  height: "62px",
  borderRadius: "8px",
  backgroundColor: green,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: "24px",
};

const brandTitleStyle: React.CSSProperties = {
  color: green,
  fontWeight: 800,
  fontSize: "20px",
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#333",
  fontSize: "16px",
};

const titleCenterStyle: React.CSSProperties = {
  textAlign: "center",
};

const mainTitleStyle: React.CSSProperties = {
  margin: 0,
  color: green,
  fontSize: "44px",
};

const dateStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#555",
  fontSize: "18px",
};

const statsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: lightGreen,
  borderLeft: `6px solid ${gold}`,
  padding: "16px",
  borderRadius: "10px",
  textAlign: "center",
};

const statNumberStyle: React.CSSProperties = {
  display: "block",
  color: green,
  fontSize: "32px",
  fontWeight: 800,
};

const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: "24px",
  marginBottom: "24px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  borderTop: `6px solid ${green}`,
  overflowX: "auto",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  color: green,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const inputStyle: React.CSSProperties = {
  padding: "11px",
  borderRadius: "8px",
  border: "1px solid #c7c7c7",
};

const audienceBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "10px",
  border: "1px solid #c7c7c7",
  borderRadius: "8px",
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "20px",
  marginBottom: "16px",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: green,
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};

const cancelButtonStyle: React.CSSProperties = {
  marginLeft: "10px",
  padding: "12px 18px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
};

const daysListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const daysItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px",
  borderRadius: "10px",
  backgroundColor: "#f8faf6",
  borderLeft: `5px solid ${gold}`,
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: lightGreen,
  color: green,
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
};

const smallTextStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#777",
  fontSize: "13px",
};

const emptyTextStyle: React.CSSProperties = {
  color: "#777",
};

const filterBoxStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(160px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const filterInputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #c7c7c7",
  height: "100%",
  fontSize: "18px",
  fontWeight: 500,
  textAlign: "center",
};

const filterAudienceBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "8px",
  padding: "14px",
  border: "1px solid #c7c7c7",
  borderRadius: "8px",
  fontSize: "18px",
};

const clearFilterButtonStyle: React.CSSProperties = {
  backgroundColor: "white",
  color: green,
  border: `1px solid ${green}`,
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const filterCountStyle: React.CSSProperties = {
  color: "#555",
  marginBottom: "16px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #d9d9d9",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: green,
  color: "white",
  borderRight: "1px solid rgba(255,255,255,0.15)",
  borderBottom: "1px solid #cfcfcf",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #d9d9d9",
  borderRight: "1px solid #e5e5e5",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: `1px solid ${green}`,
  color: green,
  backgroundColor: "white",
  borderRadius: "6px",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  marginLeft: "8px",
  padding: "7px 10px",
  border: "1px solid #b91c1c",
  color: "#b91c1c",
  backgroundColor: "white",
  borderRadius: "6px",
  cursor: "pointer",
};

const downloadButtonStyle: React.CSSProperties = {
  backgroundColor: green,
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  marginBottom: "16px",
};

const dividerRowStyle: React.CSSProperties = {
  borderTop: `6px solid ${gold}`,
};

const pastEventRowStyle: React.CSSProperties = {
  backgroundColor: "#cfcfcf",
};

const root = document.getElementById("root");

if (!root) {
  throw new Error('Root element with id "root" was not found.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);