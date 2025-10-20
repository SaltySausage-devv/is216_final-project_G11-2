<template>
  <div class="calendar-page container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">My Calendar</h1>
        </div>

        <!-- Calendar Container -->
        <div class="calendar-container">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <FullCalendar v-else ref="calendarRef" :options="calendarOptions" />
        </div>
      </div>
    </div>

    <!-- Booking Details Modal -->
    <BookingDetailsModal
      v-if="selectedBooking"
      :booking="selectedBooking"
      @close="selectedBooking = null"
      @updated="handleBookingUpdated"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import BookingDetailsModal from "../components/calendar/BookingDetailsModal.vue";
import { useToast } from "../composables/useToast";

export default {
  name: "Calendar",
  components: {
    FullCalendar,
    BookingDetailsModal,
  },
  setup() {
    const authStore = useAuthStore();
    const { showToast } = useToast();

    // Reactive data
    const loading = ref(true);
    const bookings = ref([]);
    const selectedBooking = ref(null);
    const calendarRef = ref(null);

    // Computed properties
    const userType = computed(() => authStore.userType);
    const currentUserId = computed(() => authStore.user?.id);

    // Calendar configuration
    const calendarOptions = computed(() => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      events: bookings.value,
      eventClick: handleEventClick,
      select: handleDateSelect,
      eventDrop: handleEventDrop,
      eventResize: handleEventResize,
      eventDidMount: handleEventDidMount,
      height: "700px",
      aspectRatio: 1.5,
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
      views: {
        dayGridMonth: {
          titleFormat: { year: "numeric", month: "long" },
        },
        timeGridWeek: {
          titleFormat: { year: "numeric", month: "short", day: "numeric" },
        },
        timeGridDay: {
          titleFormat: { year: "numeric", month: "long", day: "numeric" },
        },
      },
    }));

    // Methods
    async function fetchCalendarData() {
      try {
        loading.value = true;

        // Fetch bookings for a wide date range (1 year back to 2 years forward)
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 2);

        const bookingsResponse = await fetch(
          `/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        if (bookingsResponse.ok) {
          const { data } = await bookingsResponse.json();
          console.log("📅 Received bookings from API:", data);
          console.log("📊 Total bookings received:", data?.length || 0);

          // Filter out cancelled bookings
          const allBookings = (data || []).filter(
            (booking) => booking.status !== "cancelled"
          );

          bookings.value = allBookings.map((booking) => {
            console.log(
              "Mapping booking:",
              booking.id,
              "Status:",
              booking.status,
              "Start:",
              booking.start
            );
            return {
              id: booking.id,
              title: booking.title || `${booking.subject} - ${booking.level}`,
              start: booking.start,
              end: booking.end,
              backgroundColor: getEventColor(booking.status),
              borderColor: getEventColor(booking.status),
              extendedProps: {
                type: "booking",
                ...booking,
              },
            };
          });
          console.log(
            "✅ Formatted bookings for FullCalendar:",
            bookings.value
          );
          console.log("📊 Total events to display:", bookings.value.length);
        } else {
          const errorText = await bookingsResponse.text();
          console.error("❌ Failed to fetch bookings:", errorText);
          showToast("Failed to load calendar data", "error");
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        showToast("Failed to load calendar data", "error");
      } finally {
        loading.value = false;
      }
    }

    function getEventColor(status) {
      if (status === "confirmed") return "#ff6b35"; // Orange - matches theme
      if (status === "completed") return "#4ecdc4"; // Teal - nice contrast
      if (status === "cancelled") return "#6c757d"; // Grey
      if (status === "pending") return "#ffa726"; // Light orange
      return "#8e8ea0"; // Default grey
    }

    function handleEventClick(info) {
      const { event } = info;
      const { type } = event.extendedProps;

      if (type === "booking") {
        selectedBooking.value = event.extendedProps;
      }
    }

    function handleDateSelect(info) {
      // Future: Could allow booking request creation
      console.log("Date selected:", info.start, info.end);
    }

    function handleEventDrop(info) {
      // Handle event drag and drop
      updateEventTiming(info.event);
    }

    function handleEventResize(info) {
      // Handle event resize
      updateEventTiming(info.event);
    }

    async function updateEventTiming(event) {
      const { type } = event.extendedProps;

      try {
        let endpoint = "";
        let payload = {};

        if (type === "booking") {
          endpoint = `/api/calendar/bookings/${event.id}`;
          payload = {
            start_time: event.start.toISOString(),
            end_time: event.end.toISOString(),
          };
        }

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          showToast("Event updated successfully", "success");
        } else {
          // Revert the change if it failed
          event.revert();
          showToast("Failed to update event", "error");
        }
      } catch (error) {
        event.revert();
        console.error("Error updating event:", error);
        showToast("Failed to update event", "error");
      }
    }

    function handleEventDidMount(info) {
      // Add custom styling or tooltips
      const { event } = info;
      const { type } = event.extendedProps;

      if (type === "booking") {
        // Add booking status indicator
        info.el.classList.add("booking-event");
      }
    }

    async function handleBookingUpdated() {
      // Refresh calendar data first
      await fetchCalendarData();

      // Update the selectedBooking with fresh data if it exists
      if (selectedBooking.value) {
        const updatedBooking = bookings.value.find(
          (booking) => booking.id === selectedBooking.value.id
        );
        if (updatedBooking) {
          selectedBooking.value = updatedBooking;
        }
      }

      showToast("Booking updated successfully", "success");
    }

    // Lifecycle
    onMounted(() => {
      fetchCalendarData();
    });

    return {
      loading,
      calendarOptions,
      calendarRef,
      bookings,
      selectedBooking,
      userType,
      handleEventClick,
      handleDateSelect,
      handleEventDrop,
      handleEventResize,
      handleEventDidMount,
      handleBookingUpdated,
    };
  },
};
</script>

<style scoped>
.calendar-page {
  min-height: calc(100vh - 200px);
  background: #1a1a2e;
}

.calendar-container {
  background: #2d2d44;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border: 1px solid rgba(255, 107, 53, 0.2);
  min-height: 750px;
}

h1 {
  color: #ff6b35;
  font-weight: 700;
}

/* FullCalendar custom styles */
:deep(.fc) {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  height: 100% !important;
}

:deep(.fc .fc-view-harness) {
  height: 650px !important;
  min-height: 650px;
}

:deep(.fc-toolbar-title) {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.75rem;
}

:deep(.fc-button-primary) {
  background: #ff6b35 !important;
  border: 1px solid #ff6b35 !important;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #ffffff !important;
}

:deep(.fc-button-primary:hover) {
  background: #e85a2a !important;
  border-color: #e85a2a !important;
}

:deep(.fc-button-primary:disabled) {
  background: #4a4a4a !important;
  border-color: #4a4a4a !important;
  opacity: 0.5;
}

:deep(.fc-button-active) {
  background: #d14a20 !important;
  border-color: #d14a20 !important;
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.fc-today-button) {
  background: #4ecdc4 !important;
  border: 1px solid #4ecdc4 !important;
}

:deep(.fc-today-button:hover) {
  background: #3dbdb5 !important;
  border-color: #3dbdb5 !important;
}

:deep(.booking-event) {
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.booking-event:hover) {
  opacity: 0.8;
}

:deep(.fc-event) {
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.875em;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.fc-event-title) {
  font-weight: 600;
}

:deep(.fc-daygrid-day-number) {
  color: #ffffff;
  font-weight: 600;
  padding: 8px;
}

:deep(.fc-col-header-cell) {
  background: #3a3a52;
  color: #ffffff;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.875rem;
  padding: 1rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.fc-day-today) {
  background-color: rgba(255, 107, 53, 0.1) !important;
}

:deep(.fc-scrollgrid) {
  border-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  background: #2d2d44;
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.fc-daygrid-day) {
  background: #2d2d44;
}

:deep(.fc-daygrid-day:hover) {
  background: rgba(255, 107, 53, 0.05);
}

:deep(.fc-day-other .fc-daygrid-day-number) {
  color: rgba(255, 255, 255, 0.3);
}

/* More events popup */
:deep(.fc-more-popover) {
  background: #2d2d44 !important;
  border: 1px solid rgba(255, 107, 53, 0.3) !important;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

:deep(.fc-more-popover .fc-popover-header) {
  background: #3a3a52 !important;
  color: #ff6b35 !important;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
}

:deep(.fc-more-popover .fc-popover-body) {
  background: #2d2d44 !important;
  padding: 0.5rem;
}

:deep(.fc-more-popover .fc-popover-close) {
  color: #ffffff !important;
  opacity: 0.7;
  font-size: 1.5rem;
}

:deep(.fc-more-popover .fc-popover-close:hover) {
  opacity: 1;
  color: #ff6b35 !important;
}

:deep(.fc-more-popover .fc-event) {
  margin-bottom: 0.25rem;
}

:deep(.fc-more-popover .fc-daygrid-event) {
  padding: 4px 8px;
  border-radius: 4px;
}

/* More link styling */
:deep(.fc-daygrid-more-link) {
  color: #ff6b35 !important;
  font-weight: 600;
  background: rgba(255, 107, 53, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

:deep(.fc-daygrid-more-link:hover) {
  background: rgba(255, 107, 53, 0.2);
  color: #ff8c5a !important;
}

/* Loading spinner */
.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
    border-radius: 12px;
  }

  .btn-group .btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1.25rem;
  }

  :deep(.fc-button-primary) {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  :deep(.fc-col-header-cell) {
    font-size: 0.75rem;
    padding: 0.75rem 0.25rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
