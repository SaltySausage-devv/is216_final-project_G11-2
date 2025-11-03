<template>
  <div class="calendar-page container-fluid p-0 m-0">
    <div class="row g-0">
      <div class="col-12 px-3 pt-4 pt-lg-5 pb-4 pb-lg-5">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h1 class="h3 mb-0">My Calendar</h1>
        </div>

        <!-- Calendar Container -->
        <div class="calendar-container">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" style="color: var(--cyber-orange)" role="status">
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
      :show-reschedule-request="showRescheduleRequestModal"
      @close="handleBookingModalClose"
      @updated="handleBookingUpdated"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRoute } from "vue-router";
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
    const route = useRoute();

    // Reactive data
    const loading = ref(true);
    const bookings = ref([]);
    const selectedBooking = ref(null);
    const calendarRef = ref(null);
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const showRescheduleRequestModal = ref(false); // Track if reschedule modal should be shown

    // Track window width for responsive moreLinkText
    const updateWindowWidth = () => {
      windowWidth.value = window.innerWidth;
    };

    // Computed properties
    const userType = computed(() => authStore.userType);
    const currentUserId = computed(() => authStore.user?.id);
    const isMobile = computed(() => windowWidth.value <= 768);

    // Custom event renderer
    function renderEventContent(info) {
      const event = info.event;
      const extendedProps = event.extendedProps || {};
      const subject = extendedProps.subject || '';
      const level = extendedProps.level || '';
      const view = info.view.type;
      
      // For week and day views, show more details
      if (view === 'timeGridWeek' || view === 'timeGridDay') {
        const time = info.timeText || '';
        return {
          html: `
            <div class="fc-event-content-custom">
              <div class="fc-event-time">${time}</div>
              <div class="fc-event-title">${subject || event.title}</div>
              ${level ? `<div class="fc-event-level">${level}</div>` : ''}
            </div>
          `
        };
      }
      
      // For month view, show concise version
      return {
        html: `
          <div class="fc-event-content-custom fc-event-month">
            <div class="fc-event-title">${subject || event.title}</div>
          </div>
        `
      };
    }

    // Calendar configuration
    const calendarOptions = computed(() => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: "dayGridMonth",
      // Use human-friendly, capitalized labels for the view buttons
      buttonText: {
        month: 'Month',
        week: 'Week',
        day: 'Day',
  today: 'Current'
      },
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: false, // Don't limit events globally - use dayMaxEventRows per view instead
      weekends: true,
      events: bookings.value,
      eventContent: renderEventContent,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
      select: handleDateSelect,
      eventDrop: handleEventDrop,
      eventResize: handleEventResize,
      eventDidMount: handleEventDidMount,
      height: "630px",
      aspectRatio: 1.5,
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
      views: {
        dayGridMonth: {
          titleFormat: { year: "numeric", month: "long" },
          dayMaxEvents: 1, // Show exactly 1 event fully, then "+X more" for the rest
          moreLinkText: (num) => {
            // num is the count of events that are hidden (not shown)
            // With dayMaxEvents: 1, if there are 5 total events:
            //   - 1 event is shown fully
            //   - 4 events are hidden
            //   - num will be 4
            // So we show: 1 event + "+4 more"
            // Desktop/wide view: "+X more", Mobile/compact view: "+X"
            return isMobile.value ? `+${num}` : `+${num} more`;
          },
        },
        timeGridWeek: {
          titleFormat: { year: "numeric", month: "short", day: "numeric" },
          slotMinTime: "00:00:00",
          slotMaxTime: "24:00:00",
          slotLabelInterval: "01:00:00",
        },
        timeGridDay: {
          titleFormat: { year: "numeric", month: "long", day: "numeric" },
          slotMinTime: "00:00:00",
          slotMaxTime: "24:00:00",
          slotLabelInterval: "01:00:00",
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
      // All bookings use the same dark color - no color coding by status
      // Match the calendar day background color (dark grey/black)
      return "rgba(26, 26, 26, 0.9)"; // Dark grey/black to match calendar day cells
    }

    function handleEventClick(info) {
      const { event } = info;
      const { type } = event.extendedProps;

      if (type === "booking") {
        selectedBooking.value = event.extendedProps;
      }
    }

    function handleDateClick(info) {
      // When a date cell is clicked, open the booking details for the first event on that day (if any)
      const clickedDate = info.date; // Date object
      // Find events that start on the same calendar date
      const matching = bookings.value.find((ev) => {
        try {
          const evDate = new Date(ev.start);
          return evDate.toDateString() === clickedDate.toDateString();
        } catch (e) {
          return false;
        }
      });

      if (matching && matching.extendedProps) {
        selectedBooking.value = matching.extendedProps;
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
        // Make the whole event clickable (not just inner elements) to open booking details
        info.el.style.cursor = 'pointer'
        info.el.addEventListener('click', () => {
          selectedBooking.value = event.extendedProps
        })
      }
    }

    async function handleBookingUpdated(updateData) {
      // If updateData contains attendance_status, update selectedBooking immediately
      // This ensures the "Mark as Completed" button appears without needing a refresh
      if (updateData && updateData.attendance_status && selectedBooking.value) {
        // Create a new reactive object to trigger Vue's reactivity system
        // This ensures computed properties like canComplete recalculate immediately
        selectedBooking.value = {
          ...selectedBooking.value,
          attendance_status: updateData.attendance_status,
          // Also update session_notes if provided
          ...(updateData.session_notes && { session_notes: updateData.session_notes }),
        };
        console.log("✅ Updated selectedBooking with attendance_status:", updateData.attendance_status);
      }

      // Refresh calendar data to get the latest from backend (in background)
      fetchCalendarData().then(() => {
        // Update the selectedBooking with fresh data if it exists
        if (selectedBooking.value) {
          const updatedEvent = bookings.value.find(
            (booking) => booking.id === selectedBooking.value.id
          );
          if (updatedEvent && updatedEvent.extendedProps) {
            // Update with the fresh booking data from extendedProps
            selectedBooking.value = updatedEvent.extendedProps;
          }
        }
      });

      showToast("Booking updated successfully", "success");
    }

    // Handle query params to open booking and reschedule modal
    async function handleQueryParams() {
      const bookingId = route.query.bookingId;
      const reschedule = route.query.reschedule === 'true';

      if (bookingId && reschedule) {
        // Wait for bookings to load
        await nextTick();
        
        // Find the booking event - need to access extendedProps
        const bookingEvent = bookings.value.find((b) => b.id === bookingId);
        if (bookingEvent && bookingEvent.extendedProps) {
          console.log('📅 Opening booking and reschedule modal from query params:', bookingId);
          selectedBooking.value = bookingEvent.extendedProps;
          showRescheduleRequestModal.value = true;
          
          // Clean up URL
          window.history.replaceState({}, '', '/calendar');
        } else {
          console.warn('📅 Booking not found for bookingId:', bookingId);
        }
      }
    }

    // Watch for route changes (e.g., when navigating from notifications)
    watch(() => route.query, async (newQuery) => {
      if (newQuery.bookingId && newQuery.reschedule === 'true') {
        // Fetch fresh data to ensure we have the latest booking info including reschedule request
        console.log('📅 Route changed with bookingId, fetching fresh data...');
        await fetchCalendarData();
        await handleQueryParams();
      }
    }, { immediate: false });

    function handleBookingModalClose() {
      selectedBooking.value = null;
      showRescheduleRequestModal.value = false;
    }

    // Lifecycle
    onMounted(async () => {
      await fetchCalendarData();
      // Add window resize listener for responsive moreLinkText
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateWindowWidth);
        updateWindowWidth(); // Set initial width
      }
      
      // Handle query params after data loads
      await handleQueryParams();
    });

    onUnmounted(() => {
      // Clean up resize listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateWindowWidth);
      }
    });

    return {
      loading,
      calendarOptions,
      calendarRef,
      bookings,
      selectedBooking,
      showRescheduleRequestModal,
      userType,
      handleEventClick,
      handleDateSelect,
      handleEventDrop,
      handleEventResize,
      handleEventDidMount,
      handleBookingUpdated,
      handleBookingModalClose,
    };
  },
};
</script>

<style>
/* Override main padding for calendar page only - removed excessive padding */
main:has(.calendar-page) {
  padding-top: 0 !important;
}
</style>

<style scoped>
.calendar-page {
  min-height: calc(100vh - 200px);
  background: transparent;
}

.calendar-container {
  background: rgba(26, 26, 26, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border: 2px solid var(--cyber-orange);
  min-height: 675px;
  backdrop-filter: blur(10px);
}

h1 {
  color: var(--cyber-orange);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

/* FullCalendar custom styles */
:deep(.fc) {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  height: 100% !important;
}

/* Override any blue colors from FullCalendar */
:deep(.fc a) {
  color: inherit !important;
  text-decoration: none !important;
}

:deep(.fc a:not(.fc-event):hover) {
  color: var(--cyber-orange) !important;
}

:deep(.fc .fc-view-harness) {
  height: 585px !important;
  min-height: 585px;
}

:deep(.fc-toolbar-title) {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Responsive title for mobile */
@media (max-width: 768px) {
  :deep(.fc-toolbar-title) {
    font-size: 1.2rem;
  }
}

@media (max-width: 576px) {
  :deep(.fc-toolbar-title) {
    font-size: 1rem;
  }
  
  :deep(.fc-toolbar-chunk:first-child) {
    flex-wrap: wrap;
  }
}

:deep(.fc-button-primary) {
  background: var(--cyber-orange) !important;
  border: 2px solid var(--cyber-orange) !important;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
}

:deep(.fc-button-primary:hover) {
  background: #e85a2a !important;
  border-color: #e85a2a !important;
  color: #ffffff !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

:deep(.fc-button-primary:disabled) {
  background: #4a4a4a !important;
  border-color: #4a4a4a !important;
  opacity: 0.5;
}

:deep(.fc-button-active) {
  background: var(--cyber-orange) !important;
  border-color: var(--cyber-orange) !important;
  color: #ffffff !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.fc-today-button) {
  background: var(--cyber-orange) !important;
  border: 2px solid var(--cyber-orange) !important;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
}

:deep(.fc-today-button:hover) {
  background: #e85a2a !important;
  border-color: #e85a2a !important;
  color: #ffffff !important;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.5);
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
  min-height: 20px;
}

/* Custom event content styling */
:deep(.fc-event-content-custom) {
  overflow: hidden;
  word-break: break-word;
}

:deep(.fc-event-content-custom.fc-event-month) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.fc-event-time) {
  font-size: 0.75em;
  font-weight: 700;
  margin-bottom: 2px;
  opacity: 0.95;
}

:deep(.fc-event-title) {
  font-size: 0.9em;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 2px;
}

:deep(.fc-event-level) {
  font-size: 0.75em;
  opacity: 0.9;
  font-weight: 500;
}

/* Week/Day view specific styling */
:deep(.fc-timegrid-event .fc-event-content-custom) {
  padding: 2px 4px;
}

:deep(.fc-timegrid-event) {
  font-size: 0.9rem !important;
  padding: 4px 8px !important;
}

/* Ensure events have proper height in time grid */
:deep(.fc-timegrid-slot-lane .fc-event) {
  min-height: 35px;
}

/* Month view event text handling */
:deep(.fc-daygrid-event .fc-event-content-custom) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.fc-daygrid-day-number) {
  color: #ffffff !important;
  font-weight: 600;
  padding: 6px;
  font-size: 0.9rem;
  text-decoration: none !important;
}

:deep(.fc-daygrid-day-number:hover) {
  color: var(--cyber-orange) !important;
}

:deep(.fc-col-header-cell) {
  background: rgba(255, 140, 66, 0.1);
  color: var(--cyber-orange) !important;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid rgba(255, 140, 66, 0.2);
}

:deep(.fc-col-header-cell-cushion) {
  color: var(--cyber-orange) !important;
  text-decoration: none !important;
}

:deep(.fc-col-header-cell a) {
  color: var(--cyber-orange) !important;
  text-decoration: none !important;
}

:deep(.fc-day-today) {
  background-color: rgba(255, 140, 66, 0.15) !important;
  border: 1px solid rgba(255, 140, 66, 0.3) !important;
}

:deep(.fc-scrollgrid) {
  border-color: rgba(255, 140, 66, 0.2);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(42, 42, 42, 0.8);
}

:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.fc-daygrid-day) {
  background: rgba(26, 26, 26, 0.6);
  transition: all 0.2s ease;
}

:deep(.fc-daygrid-day:hover) {
  background: rgba(255, 140, 66, 0.08);
  border-color: rgba(255, 140, 66, 0.3) !important;
}

:deep(.fc-day-other .fc-daygrid-day-number) {
  color: rgba(255, 255, 255, 0.3);
}

/* More events popup */
:deep(.fc-more-popover) {
  background: rgba(26, 26, 26, 0.95) !important;
  border: 2px solid var(--cyber-orange) !important;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

:deep(.fc-more-popover .fc-popover-header) {
  background: rgba(42, 42, 42, 0.9) !important;
  color: #ffffff !important;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.fc-more-popover .fc-popover-body) {
  background: rgba(26, 26, 26, 0.9) !important;
  padding: 0.5rem;
}

:deep(.fc-more-popover .fc-popover-close) {
  color: var(--cyber-text-muted) !important;
  opacity: 0.7;
  font-size: 1.5rem;
  transition: all 0.2s ease;
}

:deep(.fc-more-popover .fc-popover-close:hover) {
  opacity: 1;
  color: var(--cyber-orange) !important;
}

:deep(.fc-more-popover .fc-event) {
  margin-bottom: 0.25rem;
  background: rgba(42, 42, 42, 0.9) !important;
}

:deep(.fc-more-popover .fc-daygrid-event) {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(42, 42, 42, 0.9) !important;
  color: #ffffff !important;
}

:deep(.fc-more-popover .fc-daygrid-event:hover) {
  background: rgba(58, 58, 82, 0.9) !important;
  color: #ffffff !important;
}

/* More link styling */
:deep(.fc-daygrid-more-link) {
  color: var(--cyber-orange) !important;
  font-weight: 600;
  background: rgba(255, 140, 66, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 140, 66, 0.2);
}

:deep(.fc-daygrid-more-link:hover) {
  background: rgba(255, 140, 66, 0.2);
  color: #ffffff !important;
  border-color: var(--cyber-orange);
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.3);
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
