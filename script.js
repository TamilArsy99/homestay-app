let historyStack = [];
let selectedHomestay = null;

/* -------------------------------
   Navigation
--------------------------------- */
function goTo(sectionId) {
  document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');

  if (!historyStack.length || historyStack[historyStack.length - 1] !== sectionId) {
    historyStack.push(sectionId);
  }

  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => {
    if (btn.textContent.includes('Home') && sectionId === 'home') btn.classList.add('active');
    if (btn.textContent.includes('Bookings') && sectionId === 'myBookings') {
      btn.classList.add('active');
      renderBookings();
    }
    if (btn.textContent.includes('Favorites') && sectionId === 'favorites') {
      btn.classList.add('active');
      renderFavorites();
    }
    if (btn.textContent.includes('Messages') && sectionId === 'messages') btn.classList.add('active');
    if (btn.textContent.includes('Profile') && sectionId === 'profile') btn.classList.add('active');
  });

  if(sectionId === 'results') {
    document.getElementById('loadingMsg').style.display = 'block';
    setTimeout(() => {
      document.getElementById('loadingMsg').style.display = 'none';
      populateResults();
      document.getElementById('resultsList').classList.remove('hidden');

      const filters = {
        price: document.getElementById("filterPrice").value,
        location: document.getElementById("filterLocation").value,
        rating: document.getElementById("filterRating").value,
        keyword: ""
      };
      filterResults(filters);
    }, 1000);
  }
}

function goBack() {
  if (historyStack.length > 1) {
    historyStack.pop();
    const prev = historyStack.pop();
    goTo(prev);
  } else {
    goTo('home');
  }
}

/* -------------------------------
   Reserve Homestay
--------------------------------- */
function reserveHomestay(name, location, pricePerNight) {
  selectedHomestay = { name, location, pricePerNight };
  goTo('booking');
}

function validateBooking(event) {
  event.preventDefault();
  const fromDate = document.getElementById('fromDate').value;
  const toDate = document.getElementById('toDate').value;
  const guests = document.getElementById('guests').value;

  if(!fromDate || !toDate || !guests) {
    showToast("Please enter dates and guests before proceeding.");
  } else {
    const nights = (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24);
    if(nights <= 0) {
      showToast("To Date must be after From Date.");
      return;
    }

    const total = nights * selectedHomestay.pricePerNight;
    document.getElementById("paymentAmount").textContent = 
      `Total to pay: RM${total} (${nights} nights × RM${selectedHomestay.pricePerNight})`;

    selectedHomestay.fromDate = fromDate;
    selectedHomestay.toDate = toDate;
    selectedHomestay.guests = guests;
    selectedHomestay.total = total;

    goTo('payment');
  }
}

/* -------------------------------
   Payment Validation
--------------------------------- */
function validatePayment(event) {
  event.preventDefault();

  const cardNumber = document.getElementById("cardNumber").value.trim();
  const expiryDate = document.getElementById("expiryDate").value.trim();
  const cvv = document.getElementById("cvv").value.trim();
  const errorMsg = document.getElementById("paymentError");
  const successMsg = document.getElementById("paymentSuccess");

  let valid = true;

  if(!/^\d{16}$/.test(cardNumber)) valid = false;
  if(!/^\d{3}$/.test(cvv)) valid = false;
  if(!expiryDate) valid = false;

  if(!valid) {
    errorMsg.classList.remove("hidden");
    successMsg.classList.add("hidden");
  } else {
    errorMsg.classList.add("hidden");
    successMsg.innerHTML = `<span class="spinner"></span> ✅ Payment details valid, processing...`;
    successMsg.classList.remove("hidden");

    setTimeout(() => {
      addBookingToMyBookings(
        selectedHomestay.name,
        selectedHomestay.location,
        selectedHomestay.pricePerNight,
        selectedHomestay.fromDate,
        selectedHomestay.toDate,
        selectedHomestay.total
      );
      clearBookingData();
      goTo("success");
    }, 1500);
  }
}

/* -------------------------------
   Clear Booking & Payment Data
--------------------------------- */
function clearBookingData() {
  ["fromDate","toDate","guests","cardNumber","expiryDate","cvv"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
}

/* -------------------------------
   My Bookings Persistence with Details
--------------------------------- */
function addBookingToMyBookings(name, location, price, fromDate, toDate, total) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  const booking = {
    id: Date.now(),
    name,
    location,
    price,
    fromDate,
    toDate,
    total,
    bookedOn: new Date().toLocaleDateString(),
    status: "Active"
  };

  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  renderBookings();
}

function renderBookings() {
  const list = document.getElementById("myBookingsList");
  const clearBtn = document.getElementById("clearBookingsBtn");
  if(!list) return;

  list.innerHTML = "";
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  if(bookings.length === 0) {
    list.innerHTML = "<p>No bookings yet.</p>";
    if(clearBtn) clearBtn.style.display = "none";
  } else {
    bookings.forEach(booking => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${booking.name}</strong><br>
        📍 ${booking.location}<br>
        💰 RM${booking.total} (RM${booking.price}/night)<br>
        🗓️ ${booking.fromDate} → ${booking.toDate}<br>
        📅 Booked on: ${booking.bookedOn}
      `;

      const statusBadge = document.createElement("span");
      statusBadge.textContent = booking.status;
      statusBadge.className = "badge";
      statusBadge.style.background = booking.status === "Active" ? "#27ae60" : "#e74c3c";
      statusBadge.style.color = "white";
      statusBadge.style.marginLeft = "10px";
      div.appendChild(statusBadge);

      if(booking.status === "Active") {
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "❌ Cancel Booking";
        cancelBtn.onclick = () => cancelBooking(booking.id, booking.total);
        div.appendChild(cancelBtn);
      }

      list.appendChild(div);
    });
    if(clearBtn) clearBtn.style.display = "block";
  }
}

function cancelBooking(id, refundAmount) {
  if(confirm("Are you sure you want to cancel this booking?")) {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings = bookings.map(b => {
      if(b.id === id) {
        b.status = "Cancelled";
      }
      return b;
    });
    localStorage.setItem("bookings", JSON.stringify(bookings));

    renderBookings();
    showToast(`❌ Booking cancelled. Refund of RM${refundAmount} will be processed.`);
  }
}

function clearAllBookings() {
  if(confirm("Are you sure you want to clear all bookings?")) {
    localStorage.removeItem("bookings");
    renderBookings();
    showToast("🗑 All bookings cleared!");
  }
}

/* -------------------------------
   Toast Notification
--------------------------------- */
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => toast.remove(), 3000);
}

/* -------------------------------
   Favorites Feature
--------------------------------- */
function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if(!favorites.includes(item)) {
    favorites.push(item);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    showToast("Added to Favorites!");
  } else {
    showToast("Already in Favorites!");
  }
  renderFavorites();
}

function removeFromFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(fav => fav !== item);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

function clearAllFavorites() {
  if(confirm("Are you sure you want to clear all favorites?")) {
    localStorage.removeItem("favorites");
    renderFavorites();
    showToast("All favorites cleared!");
  }
}

function renderFavorites() {
  const list = document.getElementById("favoritesList");
  if(!list) return;
  list.innerHTML = "";
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if(favorites.length === 0) {
    list.innerHTML = "<p>No favorites yet.</p>";
  } else {
    favorites.forEach(fav => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = fav;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "🗑 Remove";
      removeBtn.onclick = () => removeFromFavorites(fav);

      div.appendChild(removeBtn);
      list.appendChild(div);
    });

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "❌ Clear All Favorites";
    clearBtn.onclick = clearAllFavorites;
    list.appendChild(clearBtn);
  }
}

/* -------------------------------
   Saved Filters Feature
--------------------------------- */
function saveFilters() {
  const filters = {
    price: document.getElementById("filterPrice").value,
    location: document.getElementById("filterLocation").value,
    rating: document.getElementById("filterRating").value,
    keyword: "" 
  };
  localStorage.setItem("savedFilters", JSON.stringify(filters));
  showToast("Filters saved! (will persist until you save a new one)");
}

function applyFilters() {
  const saved = localStorage.getItem("savedFilters");
  if(saved) {
    const filters = JSON.parse(saved);

    document.getElementById("filterPrice").value = filters.price;
    document.getElementById("filterLocation").value = filters.location;
    document.getElementById("filterRating").value = filters.rating;

    showToast(`Applying saved filters: 
      Price ${filters.price || "Any"}, 
      Location ${filters.location || "Any"}, 
      Rating ${filters.rating || "Any"}`);

    filterResults(filters);

    const badge = document.getElementById("savedFiltersBadge");
    if(badge) {
      badge.style.display = "inline-block";
      badge.textContent = "✅ Saved Filters Active";
    }
  } else {
    showToast("No filters saved yet.");
  }
}

function clearFilters() {
  document.getElementById("filterPrice").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterRating").value = "";

  const cards = document.querySelectorAll("#resultsList .card");
  cards.forEach(card => card.style.display = "block");

  const noResults = document.getElementById("noResultsMsg");
  if(noResults) noResults.style.display = "none";

  updateResultsCounter(cards.length);

  showToast("Filters cleared! Saved filter still available.");
}

/* -------------------------------
   Populate Results with Home cards
--------------------------------- */
function populateResults() {
  const homeCards = document.querySelectorAll("#home .card");
  const resultsList = document.getElementById("resultsList");
  if(!resultsList) return;

  resultsList.innerHTML = "";

  homeCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.dataset.location = card.dataset.location;
    clone.dataset.price = card.dataset.price;
    clone.dataset.rating = card.dataset.rating;
    clone.onclick = card.onclick;
    resultsList.appendChild(clone);
  });
}

/* -------------------------------
   Filtering
--------------------------------- */
function filterResults(filters) {
  const cards = document.querySelectorAll("#resultsList .card");
  let visibleCount = 0;

  cards.forEach(card => {
    let show = true;

    const location = card.dataset.location.toLowerCase();
    const price = parseInt(card.dataset.price);
    const rating = parseFloat(card.dataset.rating);

    if(filters.location) {
      if(filters.location.toLowerCase() === "nearby") {
        if(!location.includes("kuala lumpur")) show = false;
      } else {
        if(!location.includes(filters.location.toLowerCase())) show = false;
      }
    }

    if(show && filters.price) {
      if(filters.price === "Under RM200" && price >= 200) show = false;
      if(filters.price === "Under RM500" && price >= 500) show = false;
      if(filters.price === "Under RM1000" && price >= 1000) show = false;
    }

    if(show && filters.rating) {
      if(filters.rating === "3+ stars" && rating < 3) show = false;
      if(filters.rating === "4+ stars" && rating < 4) show = false;
      if(filters.rating === "5 stars" && rating < 5) show = false;
    }

    card.style.display = show ? "block" : "none";
    if(show) visibleCount++;
  });

  const noResults = document.getElementById("noResultsMsg");
  if(noResults) noResults.style.display = visibleCount === 0 ? "block" : "none";

  updateResultsCounter(visibleCount, filters);
}

/* -------------------------------
   Results Counter
--------------------------------- */
function updateResultsCounter(count, filters = {}) {
  const counter = document.getElementById("resultsCounter");
  if(counter) {
    if(count > 0) {
      let summary = [];
      if(filters.location) summary.push(filters.location);
      if(filters.price) summary.push(filters.price);
      if(filters.rating) summary.push(filters.rating);
      counter.textContent = `${count} result(s) found${summary.length ? " — " + summary.join(", ") : ""}`;
    } else {
      counter.textContent = "";
    }
  }
}

/* -------------------------------
   Auto-filter when dropdown changes
--------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  ["filterPrice", "filterLocation", "filterRating"].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener("change", () => {
        const filters = {
          price: document.getElementById("filterPrice").value,
          location: document.getElementById("filterLocation").value,
          rating: document.getElementById("filterRating").value,
          keyword: ""
        };
        filterResults(filters);
      });
    }
  });

  // enforce future-only dates
  const today = new Date().toISOString().split("T")[0];
  const fromEl = document.getElementById("fromDate");
  if(fromEl) fromEl.setAttribute("min", today);

  const toEl = document.getElementById("toDate");
  if(toEl) toEl.setAttribute("min", today);

  const now = new Date();
  const minMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const expiryEl = document.getElementById("expiryDate");
  if(expiryEl) expiryEl.setAttribute("min", minMonth);

  renderFavorites();
  renderBookings(); // ✅ load saved bookings
});
