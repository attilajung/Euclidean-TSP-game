# TSP Challenge Game

An interactive browser-based puzzle where your objective is to solve or approximate the [Traveling Salesperson Problem (TSP)](https://en.wikipedia.org/wiki/Travelling_salesperson_problem) by finding the shortest possible continuous loop connecting a set of randomly generated points.

## 🌟 Features

- **Interactive Canvas Drawing**: Click connecting nodes to draw edges and manually build your tour.
- **Built-in Solver**: Employs a 2-Opt optimization heuristic in the background to instantly calculate a competitive target goal distance.
- **Real-Time Feedback**: 
  - Track your current path distance versus the optimal "Goal" distance dynamically.
  - Nodes intelligently change color based on their connection degree (Green: optimal 2 connections, Red: too many connections).
- **Hint System**: Having trouble? The hint functionality suggests either adding a missing optimal edge or removing an incorrect edge to guide your path.
- **Customizable Difficulty**: Adjust the number of generated points through a slider limit (from 4 to 50 points) for varying levels of complexity.

## 🛠 Tech Stack

- **Vanilla HTML5, CSS3, JavaScript**
- **HTML5 Canvas** for lightweight and performant rendering.
- Custom implementation of **2-Opt algorithm** in `tsp-solver.js`.

## 🚀 How to Run

There are no build steps or dependencies required! You can play the game just by opening the file:

1. Double-click on `index.html` to open it in your browser.
2. *Alternatively, serve it on a local static file server (e.g., `python -m http.server`, `npx serve`, or the VSCode Live Server extension).*

## 🎮 How to Play

1. **Start Drawing**: Click on any point to select it (it turns yellow). Click on another point to form an edge between them.
2. **Remove Edges**: If you want to remove an edge, simply select one of its connected points and click the other. You can also use the "**Clear Edges**" button to wipe the board clean.
3. **The Objective**: Create a continuous loop connecting *all* points exactly once (every point must be connected to exactly two other points, forming a single cycle).
4. **Win Condition**: If your continuous cycle connects all nodes, and the total distance matches the optimized background solver's goal distance (with a tiny margin of error), you complete the puzzle!
5. **Adjust Settings**: Change the amount of points in the bottom toolbar to adjust the puzzle's difficulty.

---

### File Structure

- `index.html`: Main puzzle interface and structure.
- `style.css`: Stylesheet with responsive layout and modern aesthetics (Dark mode default).
- `app.js`: Game logic, canvas rendering, and user interaction handling.
- `tsp-solver.js`: Background worker logic utilizing the 2-Opt approach to find shortest path solutions.
