document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options to avoid duplicates on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Helpers to format participant display
        function formatName(email) {
          if (!email) return email;
          const local = email.split("@")[0];
          const parts = local.split(/[\.\-_]/).filter(Boolean);
          if (parts.length === 0) return email;
          return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        }
        function initials(email) {
          const local = email.split("@")[0];
          const parts = local.split(/[\.\-_]/).filter(Boolean);
          if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
          return (parts[0][0] + parts[1][0]).toUpperCase();
        }

        // Build participants HTML using CSS classes (no inline styles)
        const participantsHTML =
          details.participants && details.participants.length > 0
            ? `<div class="participants">
                <div class="participants-title">Participants</div>
                <ul class="participant-list">
                  ${details.participants
                    .map(email => {
                      const name = formatName(email);
                      const init = initials(email);
                      // include a delete button for unregistering
                      return `<li class="participant-item" data-email="${email}" data-activity="${name}">
                                <span class="avatar">${init}</span>
                                <span class="participant-info">
                                  <span class="participant-name">${name}</span>
                                  <small class="participant-email">${email}</small>
                                </span>
                                <button class="delete-btn" title="Unregister" data-email="${email}" data-activity="${name}">×</button>
                              </li>`;
                    })
                    .join("")}
                </ul>
              </div>`
            : `<p class="participants-empty">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4 style="margin:0 0 6px 0;">${name}</h4>
          <p style="margin:0 0 8px 0;color:#374151;">${details.description}</p>
          <p style="margin:0 0 4px 0;"><strong>Schedule:</strong> ${details.schedule}</p>
          <p style="margin:0 0 8px 0;"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly registered participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegated click handler for delete/unregister buttons (attach once)
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await resp.json();
      if (resp.ok) {
        messageDiv.textContent = result.message || 'Unregistered successfully';
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        // Refresh activities list to reflect change
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }

      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 4000);
    } catch (err) {
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
      console.error('Error unregistering:', err);
    }
  });

  // Initialize app
  fetchActivities();
});
