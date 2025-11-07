# True-Crime

Product Requirements Document (PRD): "True Crime Narrator" App

1. Overview

"True Crime Narrator" is a personal-use web application designed for a YouTube creator. Its sole purpose is to convert long-form text (such as video transcripts, public domain novels, or research) into a single, downloadable, long-form audio file (e.g., a "podcast episode") using high-quality Text-to-Speech (TTS) models from Hugging Face.

2. Target User (Persona)

User: "The Creator" (You)

Role: YouTube channel owner (Mysteries & True Crime).

Goal: To efficiently create long-form audio-only content (podcast-style) from existing text scripts or sources.

Need: A simple, reliable tool to "read" a large amount of text and provide a single audio file for use in video production or as a podcast.

3. Goals & Objectives

Primary Goal: Enable the Creator to convert a text of any length (from a short script to a full novel) into a single audio file.

Secondary Goal: Provide a selection of high-quality voices from Hugging Face models to match the "mystery & true crime" tone.

Non-Goal (Out of Scope): This is not a public-facing app. It does not require user accounts, saved projects, or an audio editor. Simplicity is the priority.

4. User Stories (Core Features)

Here is the complete user-flow, broken into features:

Feature ID

User Story

F-01

Text Input: As the Creator, I want to paste my text (e.g., a transcript) into a large text box so the app can process it.

F-02

File Input: As the Creator, I want to also have the option to upload a .txt file, because my source text (like a novel) might be too large to paste.

F-03

Voice Selection: As the Creator, I want to see a simple dropdown menu of available voices (e.g., "Narrator 1," "Narrator 2 - Deep") so I can pick the one that fits my episode's mood.

F-04

Start Generation: As the Creator, I want to click a single "Generate Audio" button to begin the conversion.

F-05

Process Feedback: As the Creator, I want to see a clear "Processing..." message or loading bar, because I understand that converting a 60-minute-long text will take time.

F-06

Audio Preview: As the Creator, I want an in-app audio player to appear once the generation is done, so I can listen to the file and check for quality.

F-07

Download: As the Creator, I want a "Download Audio" button so I can save the final, complete audio file to my computer as a single .mp3.

5. Functional & Technical Requirements

This section details how the app must work "under the hood" to make the user stories possible.

5.1. TTS Model Integration (The "How")

The app will not run models locally. It will communicate with the remote Hugging Face Inference API to generate the speech.

A secure Hugging Face API key will be stored in the app's backend/server-side environment, not in the front-end (browser) code.

The Voice Selection (F-03) dropdown will be populated with a curated list of Hugging Face model identifiers (e.g., specific models from facebook/mms-tts, suno/bark, etc.) that you have pre-selected.

5.2. Long-Form Text Processing (The "Core Challenge")

Your request to process a novel or 60+ minutes of text is the main technical challenge, as the Hugging Face Inference API has character limits for its free tier. The app must handle this automatically.

Text Chunking: The app's backend will receive the entire text (from F-01 or F-02). It must automatically break this text into small, API-safe "chunks."

Intelligent Splitting: The chunking logic must be "smart." It should try to split text at natural pauses (like periods ., exclamation marks !, or newlines \n) to avoid an awkward audio cut-off in the middle of a sentence.

Sequential API Calls: The app will make many API calls to Hugging Face in a sequence—one for each chunk of text.

Audio Stitching: As the individual audio fragments are returned from the API, the app's backend must concatenate (stitch) them together in the correct order.

Final Output: The final result of this "chunk-and-stitch" process will be a single, long-form audio file (.mp3 format is recommended for its balance of quality and file size). This single file is what the user (F-06, F-07) will interact with.

5.3. User Interface (UI)

The UI will be minimal and built on a single page.

Layout:

A large <textarea> for text pasting (F-01).

An <input type="file"> for text file upload (F-02).

A <select> dropdown for voice models (F-03).

A <button> to "Generate Audio" (F-04).

A "Status" area to show "Processing..." or "Ready" (F-05).

An <audio> player (which is hidden until generation is complete) (F-06).

A <a> download link (which is hidden until generation is complete) (F-07).
