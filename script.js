function goTo(sectionId) {
  // hide all sections
  document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
  // show the chosen section
  document.getElementById(sectionId).classList.remove('hidden');

  // update active nav button
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => {
    if (btn.textContent.includes('Home') && sectionId === 'home') {
      btn.classList.add('active');
    }
    if (btn.textContent.includes('Bookings') && sectionId === 'myBookings') {
      btn.classList.add('active');
    }
    if (btn.textContent.includes('Favorites') && sectionId === 'favorites') {
      btn.classList.add('active');
      renderFavorites();
    }
  });

  // simulate loading for results
  if(sectionId === 'results') {
    document.getElementById('loadingMsg').style.display = 'block';
    setTimeout(() => {
      document.getElementById('loadingMsg').style.display = 'none';
      document.getElementById('resultsList').classList.remove('hidden');

      // Apply combined keyword + filters
      const keyword = document.getElementById("searchBox").value.trim().toLowerCase();
      const filters = {
        price: document.getElementById("filterPrice").value,
        location: document.getElementById("filterLocation").value,
        rating: document.getElementById("filterRating").value,
        keyword: keyword
      };
      filterResults(filters);
    }, 1000);
  }
}

function validateBooking(event) {
  event.preventDefault();
  const checkin = document.getElementById('checkin').value;
  const guests = document.getElementById('guests').value;
  if(!checkin || !guests) {
    alert("Please enter date and guests before proceeding.");
  } else {
    goTo('payment');
  }
}

/* -------------------------------
   Favorites Feature
--------------------------------- */
function addToFavorites(item) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if(!favorites.includes(item)) {
    favorites.push(item);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert("Added to Favorites!");
  } else {
    alert("Already in Favorites!");
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
    alert("All favorites cleared!");
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

    // Add Clear All button
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
    keyword: document.getElementById("searchBox").value.trim().toLowerCase()
  };

  localStorage.setItem("savedFilters", JSON.stringify(filters));
  alert("Filters saved!");
}

function applyFilters() {
  const saved = localStorage.getItem("savedFilters");
  if(saved) {
    const filters = JSON.parse(saved);

    // Restore dropdowns
    document.getElementById("filterPrice").value = filters.price;
    document.getElementById("filterLocation").value = filters.location;
    document.getElementById("filterRating").value = filters.rating;
    document.getElementById("searchBox").value = filters.keyword;

    alert(`Applying saved filters:\nPrice: ${filters.price}\nLocation: ${filters.location}\nRating: ${filters.rating}\nKeyword: ${filters.keyword}`);

    filterResults(filters);
  } else {
    alert("No filters saved yet.");
  }
}

function clearFilters() {
  if(confirm("Are you sure you want to clear all filters?")) {
    document.getElementById("filterPrice").value = "";
    document.getElementById("filterLocation").value = "";
    document.getElementById("filterRating").value = "";
    document.getElementById("searchBox").value = "";

    // Reset results list
    const cards = document.querySelectorAll("#resultsList .card");
    cards.forEach(card => card.style.display = "block");

    // Hide "No results" message if shown
    const noResults = document.getElementById("noResultsMsg");
    if(noResults) noResults.style.display = "none";

    updateResultsCounter(cards.length);

    localStorage.removeItem("savedFilters");
    alert("Filters cleared!");
  }
}

function showAllResults() {
  // Reset dropdowns and search box
  document.getElementById("filterPrice").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterRating").value = "";
  document.getElementById("searchBox").value = "";

  // Show all cards
  const cards = document.querySelectorAll("#resultsList .card");
  cards.forEach(card => card.style.display = "block");

  // Hide "No results" message
  const noResults = document.getElementById("noResultsMsg");
  if(noResults) noResults.style.display = "none";

  updateResultsCounter(cards.length);

  localStorage.removeItem("savedFilters");
}

function filterResults(filters) {
  const cards = document.querySelectorAll("#resultsList .card");
  let visibleCount = 0;

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    let show = true;

    if(filters.price && !text.includes(filters.price.replace("Under ", "$").toLowerCase())) {
      show = false;
    }
    if(filters.location && !text.includes(filters.location.toLowerCase())) {
      show = false;
    }
    if(filters.keyword && !text.includes(filters.keyword)) {
      show = false;
    }
    // Ratings not in demo text, skip for now

    card.style.display = show ? "block" : "none";
    if(show) visibleCount++;
  });

  // Show "No results found" message if nothing visible
  const noResults = document.getElementById("noResultsMsg");
  if(noResults) {
    noResults.style.display = visibleCount === 0 ? "block" : "none";
  }

  updateResultsCounter(visibleCount);
}

/* -------------------------------
   Results Counter
--------------------------------- */
function updateResultsCounter(count) {
  const counter = document.getElementById("resultsCounter");
  if(counter) {
    counter.textContent = count > 0 ? `${count} result(s) found` : "";
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
          keyword: document.getElementById("searchBox").value.trim().toLowerCase()
        };
        filterResults(filters);
      });
    }
  });

  // Render favorites on load
  renderFavorites();
});
