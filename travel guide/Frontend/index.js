
const VOICES = {
  English: { Male: "Matthew", Female: "Alicia" },
  Hindi: { Male: "Aman", Female: "Namrita" },
  Tamil: { Male: "Murali", Female: "Iniya" },
  Telugu: { Male: "Zion", Female: "Josie" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN"
};

const state = {
  place: "",
  image: "",
  length: "Summary",
  voice: "Male"
};

const GENERATE_AUDIO_GUIDE_API_URL = "/generate-audio-guide";

// HTML elements
const cardsContainer =
  document.querySelector(".cards-grid") ||
  document.querySelector(".cards");

const experiencePanel = document.getElementById("experience");
const previewTitle = document.getElementById("previewTitle");
const audioSection = document.getElementById("audioSection");
const audioPlayer = document.getElementById("audioPlayer");

const transcriptText =
  document.getElementById("scriptText") ||
  document.getElementById("transcriptText");

const generateButton = document.getElementById("generateBtn");
const languageSelect = document.getElementById("selectLanguage");
const closeButton = document.getElementById("closeExperience");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const searchPreviewCard = document.getElementById("searchPreviewCard");
const searchPreviewImage = document.getElementById("searchPreviewImage");
const searchPreviewTitle = document.getElementById("searchPreviewTitle");

const transcriptToggle = document.getElementById("transcriptToggle");
const transcriptContent = document.getElementById("transcriptContent");
const transcriptArrow = document.getElementById("transcriptArrow");

// Select a destination
function selectDestination(place, image = "", clickedCard = null) {
  state.place = place;
  state.image = image || "";

  if (cardsContainer) {
    cardsContainer.classList.add("faded");
  }

  document.querySelectorAll(".place-card").forEach(card => {
    card.classList.remove("active");
  });

  if (clickedCard) {
    clickedCard.classList.add("active");
  }

  // Show the selected destination
  if (clickedCard) {
    if (searchPreviewCard) {
      searchPreviewCard.classList.add("hidden");
    }
  } else if (searchPreviewCard) {
    searchPreviewCard.classList.remove("hidden");
    searchPreviewCard.classList.add("active");

    if (searchPreviewTitle) {
      searchPreviewTitle.textContent = place;
    }

    if (searchPreviewImage) {
      if (image) {
        searchPreviewImage.src = image;
        searchPreviewImage.classList.remove("hidden");
      } else {
        searchPreviewImage.removeAttribute("src");
        searchPreviewImage.classList.add("hidden");
      }
    }
  }

  if (previewTitle) {
    previewTitle.textContent = place;
  }

  // Reset the previous audio and description
  if (audioSection) {
    audioSection.classList.add("hidden");
  }

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
  }

  if (transcriptText) {
    transcriptText.textContent = "";
  }

  if (generateButton) {
    generateButton.textContent = "Generate Audio Guide";
    generateButton.disabled = false;
  }

  // Open the experience panel
  if (experiencePanel) {
    experiencePanel.classList.remove("hidden");

    setTimeout(() => {
      experiencePanel.classList.add("visible");
    }, 10);
  }
}

// Make destination cards clickable
document.querySelectorAll(
  ".place-card:not(#searchPreviewCard)"
).forEach(card => {
  card.addEventListener("click", () => {
    selectDestination(
      card.dataset.place,
      card.dataset.image || "",
      card
    );
  });
});

// Search for a destination
function searchDestination() {
  if (!searchInput) return;

  const query = searchInput.value.trim();

  if (!query) {
    alert("Please enter a destination.");
    return;
  }

  const cards = document.querySelectorAll(
    ".place-card:not(#searchPreviewCard)"
  );

  let foundCard = null;

  cards.forEach(card => {
    const place = (card.dataset.place || "").toLowerCase();
    const searchName = query.toLowerCase();

    if (
      place === searchName ||
      (searchName === "agra" && place === "taj mahal")
    ) {
      foundCard = card;
    }
  });

  if (foundCard) {
    selectDestination(
      foundCard.dataset.place,
      foundCard.dataset.image || "",
      foundCard
    );
  } else {
    // Show a preview for a destination not in the cards
    selectDestination(query, "", null);
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", searchDestination);
}

if (searchInput) {
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      searchDestination();
    }
  });
}

// Summary and Detailed buttons
document.querySelectorAll('[data-group="length"]').forEach(button => {
  button.addEventListener("click", () => {
    state.length = button.dataset.value;

    document.querySelectorAll('[data-group="length"]').forEach(item => {
      item.classList.remove("selected-button");
    });

    button.classList.add("selected-button");
  });
});

// Male and Female voice buttons
document.querySelectorAll('[data-group="voice"]').forEach(button => {
  button.addEventListener("click", () => {
    state.voice = button.dataset.value;

    document.querySelectorAll('[data-group="voice"]').forEach(item => {
      item.classList.remove("selected-button");
    });

    button.classList.add("selected-button");
  });
});

// Close the destination panel
function deselectDestination() {
  if (experiencePanel) {
    experiencePanel.classList.remove("visible");

    setTimeout(() => {
      experiencePanel.classList.add("hidden");
    }, 200);
  }

  if (cardsContainer) {
    cardsContainer.classList.remove("faded");
  }

  document.querySelectorAll(".place-card").forEach(card => {
    card.classList.remove("active");
  });

  if (searchPreviewCard) {
    searchPreviewCard.classList.add("hidden");
  }

  state.place = "";
  state.image = "";

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
  }
}

if (closeButton) {
  closeButton.addEventListener("click", deselectDestination);
}

// Show or hide the transcript
if (transcriptToggle && transcriptContent) {
  transcriptToggle.addEventListener("click", () => {
    transcriptContent.classList.toggle("hidden");

    if (transcriptArrow) {
      transcriptArrow.textContent =
        transcriptContent.classList.contains("hidden") ? "▼" : "▲";
    }
  });
}

// Generate the audio guide
if (generateButton) {
  generateButton.addEventListener("click", async () => {
    if (!state.place) {
      alert("Please select a destination first.");
      return;
    }

    generateButton.disabled = true;
    generateButton.textContent = "Generating Audio...";

    try {
      
const selectedLanguage = languageSelect
  ? languageSelect.value
  : "English";


const selectedVoice =
  String(state.voice || "Male").toLowerCase() === "female"
    ? "Female"
    : "Male";

const voiceId = VOICES[selectedLanguage]?.[selectedVoice];
const locale = LOCALES[selectedLanguage];



      const response = await fetch(
        GENERATE_AUDIO_GUIDE_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          
          body: JSON.stringify({
            place: state.place,
            answerType: state.length,
            language: selectedLanguage,
            voiceId: voiceId,
            locale: locale
          })

        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      // Display the generated description
      if (transcriptText) {
        transcriptText.textContent = data.description || "";
      }

      if (audioSection) {
        audioSection.classList.remove("hidden");
      }

      // Play the generated audio
      if (data.audioBase64 && audioPlayer) {
        audioPlayer.src =
          "data:audio/mp3;base64," + data.audioBase64;

        audioPlayer.classList.remove("hidden");
        audioPlayer.load();

        generateButton.textContent = "Listen to Audio";
      } else {
        generateButton.textContent = "Guide Generated";
        alert(
          "The description was generated, but no audio was returned. Please check your Flask backend and Murf API key."
        );
      }
    } catch (error) {
      console.error("Generation error:", error);

      alert("Generation failed: " + error.message);

      generateButton.textContent = "Generate Audio Guide";
    } finally {
      generateButton.disabled = false;
    }
  });
}
