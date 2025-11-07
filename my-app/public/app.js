// Global state
let voices = [];
let selectedFile = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  loadVoices();
  setupEventListeners();
});

// Load available voices from API
async function loadVoices() {
  try {
    const response = await fetch('/api/voices');
    const data = await response.json();
    
    if (data.success) {
      voices = data.voices;
      populateVoiceSelect();
    } else {
      showError('Failed to load voices');
    }
  } catch (error) {
    console.error('Error loading voices:', error);
    showError('Error connecting to server');
  }
}

// Populate voice dropdown
function populateVoiceSelect() {
  const select = document.getElementById('voiceSelect');
  select.innerHTML = '';
  
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.id;
    option.textContent = `${voice.name} - ${voice.description}`;
    select.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Character count
  const textInput = document.getElementById('textInput');
  textInput.addEventListener('input', updateCharCount);
  
  // File input
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', handleFileSelect);
}

// Update character count
function updateCharCount() {
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  charCount.textContent = textInput.value.length;
}

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  const fileName = document.getElementById('fileName');
  
  if (file) {
    if (file.type !== 'text/plain') {
      showError('Please select a .txt file');
      event.target.value = '';
      return;
    }
    
    selectedFile = file;
    fileName.textContent = file.name;
    
    // Clear textarea when file is selected
    document.getElementById('textInput').value = '';
    updateCharCount();
  } else {
    selectedFile = null;
    fileName.textContent = 'No file chosen';
  }
}

// Main function to generate audio
async function generateAudio() {
  const textInput = document.getElementById('textInput').value.trim();
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceModelId = voiceSelect.value;
  
  // Validation
  if (!textInput && !selectedFile) {
    showError('Please provide text or upload a file');
    return;
  }
  
  if (!voiceModelId) {
    showError('Please select a voice');
    return;
  }
  
  // Prepare form data
  const formData = new FormData();
  
  if (selectedFile) {
    formData.append('textFile', selectedFile);
  } else {
    formData.append('text', textInput);
  }
  
  formData.append('voiceModelId', voiceModelId);
  
  // Show processing status
  showStatus();
  
  try {
    const response = await fetch('/api/generate-audio', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showResult(data.audioUrl, data.message);
    } else {
      hideStatus();
      showError(data.error || 'Failed to generate audio');
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    hideStatus();
    showError('Error connecting to server. Please try again.');
  }
}

// Show processing status
function showStatus() {
  document.getElementById('statusSection').style.display = 'block';
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('generateBtn').disabled = true;
  
  // Scroll to status section
  document.getElementById('statusSection').scrollIntoView({ behavior: 'smooth' });
}

// Hide processing status
function hideStatus() {
  document.getElementById('statusSection').style.display = 'none';
  document.getElementById('generateBtn').disabled = false;
}

// Show result
function showResult(audioUrl, message) {
  hideStatus();
  
  const resultSection = document.getElementById('resultSection');
  const audioPlayer = document.getElementById('audioPlayer');
  const audioSource = document.getElementById('audioSource');
  const downloadLink = document.getElementById('downloadLink');
  const resultMessage = document.getElementById('resultMessage');
  
  // Set audio source
  audioSource.src = audioUrl;
  audioPlayer.load();
  
  // Set download link
  downloadLink.href = audioUrl;
  
  // Set message
  resultMessage.textContent = message;
  
  // Show result section
  resultSection.style.display = 'block';
  
  // Scroll to result
  resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset form
function resetForm() {
  document.getElementById('textInput').value = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('fileName').textContent = 'No file chosen';
  selectedFile = null;
  updateCharCount();
  
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('statusSection').style.display = 'none';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error message
function showError(message) {
  alert('❌ Error: ' + message);
}
