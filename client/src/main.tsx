import React, { useEffect, useState } from "react";
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
  const [roomReserved, setRoomReserved] = useState(false);
  const [cateringNeeded, setCateringNeeded] = useState(false);
  const [cateringOrdered, setCateringOrdered] = useState(false);
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");

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
    setRoomReserved(false);
    setCateringNeeded(false);
    setCateringOrdered(false);
    setStatus("");
    setDescription("");
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

  const formatDate = (dateString: string) => {
    const formattedDate = new Date(dateString + "T00:00:00");

    return formattedDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const isMissingValue = (value: string | boolean | undefined) => {
    return (
      value === "-" ||
      value === "No" ||
      value === false ||
      value === undefined ||
      value === ""
    );
  };

  const isEventComplete = (event: EventItem) => {
    const hasLocation = !!event.location;
    const hasHost = !!event.host;
    const hasStatus = !!event.status;
    const hasDescription = !!event.description;
    const hasRoom = event.roomReserved === true;

    const cateringOk =
      event.cateringNeeded === false ||
      (event.cateringNeeded === true && event.cateringOrdered === true);

    return hasLocation && hasHost && hasStatus && hasDescription && hasRoom && cateringOk;
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingEventsWithin10Days = sortedEvents.filter((event) => {
    const today = new Date();
    const eventDate = new Date(event.date + "T00:00:00");

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return days >= 0 && days <= 10;
  });

  const completedEvents = events.filter((event) => {
    const today = new Date();
    const eventDate = new Date(event.date + "T00:00:00");

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate.getTime() < today.getTime();
  }).length;

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
      roomReserved,
      cateringNeeded,
      cateringOrdered,
      status,
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
    setRoomReserved(event.roomReserved ?? false);
    setCateringNeeded(event.cateringNeeded ?? false);
    setCateringOrdered(event.cateringOrdered ?? false);
    setStatus(event.status ?? "");
    setDescription(event.description ?? "");
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
          <h2 style={sectionTitleStyle}>
            Upcoming Events (Days Left)
          </h2>

          {upcomingEventsWithin10Days.length === 0 ? (
            <p style={emptyTextStyle}>
              No events within the next 10 days.
            </p>
          ) : (
            <div style={daysListStyle}>
              {upcomingEventsWithin10Days.map((event) => (
                <div key={event.id} style={daysItemStyle}>
                  <div>
                    <strong>{event.eventName}</strong>
                    <p style={smallTextStyle}>{formatDate(event.date)}</p>
                  </div>

                  <span style={badgeStyle}>
                    {getDaysAway(event.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId === null ? "Add Event" : "Edit Event"}
          </h2>

          <div style={formGridStyle}>
            <input style={inputStyle} placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input style={inputStyle} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <input style={inputStyle} placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} />
            <input style={inputStyle} placeholder="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
            <input style={inputStyle} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
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

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Days Left</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Host</th>
                <th style={thStyle}>Room</th>
                <th style={thStyle}>Catering Needed</th>
                <th style={thStyle}>Catering Ordered</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedEvents.map((e) => (
                <tr key={e.id}>
                  <td
                    style={{
                      ...tdStyle,

                      ...(getDaysAway(e.date) === "Past due"
                        ? pastDueEventStyle
                        : {}),

                      ...(isEventComplete(e)
                        ? completeEventStyle
                        : {}),
                    }}
                  >
                    {e.eventName}
                  </td>

                  <td style={tdStyle}>{formatDate(e.date)}</td>

                  <td style={tdStyle}>{getDaysAway(e.date)}</td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(isMissingValue(e.location) ? missingCellStyle : {}),
                    }}
                  >
                    {e.location || "-"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(isMissingValue(e.host) ? missingCellStyle : {}),
                    }}
                  >
                    {e.host || "-"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(e.roomReserved ? {} : missingCellStyle),
                    }}
                  >
                    {e.roomReserved ? "Yes" : "No"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(e.cateringNeeded ? {} : missingCellStyle),
                    }}
                  >
                    {e.cateringNeeded ? "Yes" : "No"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(e.cateringOrdered ? {} : missingCellStyle),
                    }}
                  >
                    {e.cateringOrdered ? "Yes" : "No"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(isMissingValue(e.status) ? missingCellStyle : {}),
                    }}
                  >
                    {e.status || "-"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      ...(isMissingValue(e.description) ? missingCellStyle : {}),
                    }}
                  >
                    {e.description || "-"}
                  </td>

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
              ))}
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

const pastDueEventStyle: React.CSSProperties = {
  backgroundColor: "#f6e7a8",
  fontWeight: 700,
};

const missingCellStyle: React.CSSProperties = {
  backgroundColor: "#fde8e8",
};

const completeEventStyle: React.CSSProperties = {
  backgroundColor: "#dcfce7",
  fontWeight: 700,
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

const root = document.getElementById("root");

if (!root) {
  throw new Error('Root element with id "root" was not found.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);