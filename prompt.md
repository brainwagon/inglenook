# 🚂 Project Prompt: Inglenook Sidings 3D Puzzle

## 📋 Overview
Create a web-based 3D railway shunting puzzle based on the **Inglenook Sidings** rules. The game will be built using **HTML5**, **Vanilla JavaScript**, and **Three.js**.

### 🧩 The Goal
*   **Setup:** 8 rail cars are randomly distributed across two sidings (Siding B and Siding C).
*   **Objective:** The player must use a locomotive to assemble a specific consist of **5 cars** in a randomly generated order on the main exit track.
*   **Constraint:** Respect track capacities:
    *   **Siding A (Lead/Headbolt):** Capacity for Locomotive + 3 cars.
    *   **Siding B (Long Siding):** Capacity for 5 cars.
    *   **Siding C (Short Siding):** Capacity for 3 cars.

---

## 🏗️ Technical Architecture

### 1. 🌐 Environment & Scene
*   **Renderer:** Three.js `WebGLRenderer` with shadows enabled.
*   **Scene:** A simple ground plane (tabletop or gravel texture) with basic lighting (Ambient + Directional).
*   **Camera:** A "God-view" perspective camera, slightly angled, with `OrbitControls` for zooming and panning.

### 2. 🛤️ Track & Geometry
*   **Track Layout:** Create a "Fan" layout using three linear paths (A, B, and C) connected by a central switch point.
*   **Visual Assets:** 
    *   Use simple boxes (`BoxGeometry`) to represent the **Locomotive** (e.g., Yellow) and **8 Rail Cars** (each with a unique color or a numbered label).
    *   Use thin cylinders or planes to represent the rails.

### 3. 🧠 Game Logic & State
*   **Data Structure:** Maintain an array for each track (`sidingA`, `sidingB`, `sidingC`) containing the IDs of the cars currently on that track.
*   **Movement Rules:** 
    *   The locomotive can only "pull" cars from a siding if it is coupled to them.
    *   Cars must move as a block when coupled.
    *   The locomotive cannot push/pull more cars into a siding than its capacity allows.

---

## 🎮 Interaction & UI

### 🖱️ Controls
*   **Raycasting:** Click on a siding or a specific car to move the locomotive to that position and couple/decouple.
*   **Buttons:** Simple HTML buttons for "Couple", "Decouple", and "Reset Game".

### 📊 Heads-Up Display (HUD)
*   **Target Consist:** A visual display at the top of the screen showing the 5 required car numbers/colors in the correct order.
*   **Move Counter:** Track how many shunting moves the player has made.
*   **Status:** Display "Victory" when the 5-car consist is correctly assembled on the lead track.

---

## 🛠️ Step-by-Step Implementation Instructions

1.  **Initialize Three.js:** Set up the basic scene, camera, and render loop.
2.  **Generate Sidings:** Define the `x, y, z` coordinates for the endpoints of tracks A, B, and C.
3.  **Spawn Cars:** Randomly assign 8 unique car objects to the arrays for Siding B and C.
4.  **Movement Logic:** Implement a function `moveTrain(targetSiding)` that calculates the 3D translation (tweening) of the locomotive and any attached cars.
5.  **Shuffling Algorithm:** Create a function to pick 5 random IDs from the 8 available cars to set the "Goal."
6.  **Win Detection:** After every move, check if the first 5 cars on the designated assembly track match the Goal array.

---

## 🎨 Visual Enhancements (Phase 2)
*   ✨ Add simple textures to the cubes to make them look like freight wagons.
*   ✨ Implement basic sound effects for "clunking" when cars couple.
*   ✨ Add a "Ghost" preview to show where the train will move.

---

### 🌐 Multilingual Support Note / Nota sobre Idiomas
*   **EN:** Ensure all UI strings (Move, Reset, Win) are stored in a JSON object for easy translation.
*   **ES:** Asegúrate de que todas las cadenas de la interfaz de usuario se guarden en un objeto JSON para facilitar la traducción.
*   **FR:** Assurez-vous que toutes les chaînes de l'interface utilisateur sont stockées dans un objet JSON pour une traduction facile.

---
