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

        // Check if user is logged in
        console.log("📅 Calendar: Checking auth state...", {
          hasToken: !!authStore.token,
          hasUser: !!authStore.user,
          token: authStore.token?.substring(0, 20) + "...",
          userId: authStore.user?.id,
        });

        if (!authStore.token || !authStore.user) {
          console.warn(
            "⚠️ No auth token or user found, showing empty calendar"
          );
          bookings.value = [];
          loading.value = false;
          return;
        }

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
          // Don't show error toast, just show empty calendar
          bookings.value = [];
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        // Don't show error toast, just show empty calendar
        bookings.value = [];
      } finally {
        loading.value = false;
      }
    }

    function getEventColor(status) {
      if (status === "confirmed") return "#10b981"; // Green - professional
      if (status === "completed") return "#6366f1"; // Blue - professional
      if (status === "cancelled") return "#ef4444"; // Red - clear indication
      if (status === "pending") return "#f59e0b"; // Amber - attention
      return "#6b7280"; // Gray - default
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

    function handleBookingUpdated() {
      selectedBooking.value = null;
      fetchCalendarData();
      showToast("Booking updated successfully", "success");
    }

    // Lifecycle
    onMounted(async () => {
      console.log("📅 Calendar mounted, checking auth state...");
      console.log("📅 Auth token available:", !!authStore.token);
      console.log("📅 Auth user available:", !!authStore.user);

      // Wait for auth to be ready (max 3 seconds)
      const maxWaitTime = 3000; // 3 seconds
      const checkInterval = 100; // Check every 100ms
      let elapsed = 0;

      while (!authStore.token && elapsed < maxWaitTime) {
        console.log(`⏳ Waiting for auth... (${elapsed}ms)`);
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      }

      if (authStore.token) {
        console.log("✅ Auth ready, fetching calendar data");
      } else {
        console.warn(
          "⚠️ Auth not ready after timeout, will show empty calendar"
        );
      }

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
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-container {
  background: rgba(45, 45, 68, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 53, 0.1);
  padding: 2rem;
  border: 1px solid rgba(255, 107, 53, 0.2);
  min-height: 750px;
  transition: all 0.3s ease;
}

.calendar-container:hover {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 107, 53, 0.2);
  border-color: rgba(255, 107, 53, 0.3);
}

h1 {
  color: #ff6b35;
  font-weight: 800;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* FullCalendar custom styles */
:deep(.fc) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100% !important;
  font-size: 0.9rem;
}

:deep(.fc .fc-view-harness) {
  height: 650px !important;
  min-height: 650px;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.fc-toolbar-title) {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.875rem;
  letter-spacing: -0.02em;
  margin: 0 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.fc-button-primary) {
  background: linear-gradient(135deg, #ff6b35 0%, #e85a2a 100%) !important;
  border: none !important;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  transition: all 0.3s ease;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  font-family: 'Inter', sans-serif;
}

:deep(.fc-button-primary:hover) {
  background: linear-gradient(135deg, #e85a2a 0%, #d14a20 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
}

:deep(.fc-button-primary:disabled) {
  background: #4a4a4a !important;
  color: #9ca3af !important;
  box-shadow: none;
  transform: none;
  opacity: 0.6;
}

:deep(.fc-button-active) {
  background: linear-gradient(135deg, #d14a20 0%, #b83a10 100%) !important;
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

:deep(.fc-today-button) {
  background: linear-gradient(135deg, #4ecdc4 0%, #3dbdb5 100%) !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

:deep(.fc-today-button:hover) {
  background: linear-gradient(135deg, #3dbdb5 0%, #2ba39c 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

:deep(.booking-event) {
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.booking-event:hover) {
  opacity: 0.8;
}

:deep(.fc-event) {
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.875em;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.01em;
}

:deep(.fc-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

:deep(.fc-event-title) {
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:deep(.fc-daygrid-day-number) {
  color: #ffffff;
  font-weight: 600;
  padding: 12px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

:deep(.fc-col-header-cell) {
  background: linear-gradient(135deg, #3a3a52 0%, #2d2d44 100%);
  color: #ffffff;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.8rem;
  padding: 1.25rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.05em;
}

:deep(.fc-day-today) {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.1) 100%) !important;
  position: relative;
}

:deep(.fc-day-today::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #ff6b35 0%, #e85a2a 100%);
  border-radius: 8px 8px 0 0;
}

:deep(.fc-scrollgrid) {
  border-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background: #2d2d44;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.fc-daygrid-day) {
  background: #2d2d44;
  transition: all 0.2s ease;
}

:deep(.fc-daygrid-day:hover) {
  background: linear-gradient(135deg, #3a3a52 0%, #2d2d44 100%);
  transform: scale(1.01);
}

:deep(.fc-day-other .fc-daygrid-day-number) {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

/* More events popup */
:deep(.fc-more-popover) {
  background: rgba(45, 45, 68, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 107, 53, 0.3) !important;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 53, 0.1);
  font-family: 'Inter', sans-serif;
}

:deep(.fc-more-popover .fc-popover-header) {
  background: linear-gradient(135deg, #3a3a52 0%, #2d2d44 100%) !important;
  color: #ffffff !important;
  font-weight: 800;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 12px 12px 0 0;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

:deep(.fc-more-popover .fc-popover-body) {
  background: rgba(45, 45, 68, 0.98) !important;
  padding: 0.75rem;
  border-radius: 0 0 12px 12px;
}

:deep(.fc-more-popover .fc-popover-close) {
  color: rgba(255, 255, 255, 0.7) !important;
  opacity: 0.7;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

:deep(.fc-more-popover .fc-popover-close:hover) {
  opacity: 1;
  color: #ff6b35 !important;
  transform: scale(1.1);
}

:deep(.fc-more-popover .fc-event) {
  margin-bottom: 0.5rem;
  border-radius: 6px;
}

:deep(.fc-more-popover .fc-daygrid-event) {
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

:deep(.fc-more-popover .fc-daygrid-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* More link styling */
:deep(.fc-daygrid-more-link) {
  color: #ff6b35 !important;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.15) 100%);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 107, 53, 0.3);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

:deep(.fc-daygrid-more-link:hover) {
  background: linear-gradient(135deg, #ff6b35 0%, #e85a2a 100%);
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
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
