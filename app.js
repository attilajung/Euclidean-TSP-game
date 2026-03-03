class TSPGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.querySelector('.canvas-container');

        this.points = [];
        this.edges = [];
        this.selectedPointIndex = -1;
        this.hoveredPointIndex = -1;
        this.isComplete = false;

        this.optimalSolution = null;
        this.hintEdge = null; // { u, v, type: 'add'|'remove', timestamp }

        this.config = {
            pointCount: 10,
            pointRadius: 6,
            hoverRadius: 10,
            colors: {
                point: '#38bdf8',
                pointHover: '#f472b6',
                pointSelected: '#facc15',
                pointError: '#ef4444',
                pointSuccess: '#4ade80',
                line: 'rgba(56, 189, 248, 0.5)',
                lineActive: 'rgba(244, 114, 182, 0.8)',
                lineHintAdd: '#facc15', // Yellow for missing edge
                lineHintRemove: '#ef4444', // Red for bad edge
                text: '#e2e8f0'
            }
        };

        this.mouse = { x: 0, y: 0 };

        this.resize();
        this.initEventListeners();
        this.startNewGame();

        this.animate();
    }

    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    initEventListeners() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.checkHover();
        });

        this.canvas.addEventListener('click', () => this.handleClick());

        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());

        const playAgain = document.getElementById('play-again-btn');
        if (playAgain) playAgain.addEventListener('click', () => this.startNewGame());

        document.getElementById('clear-edges-btn').addEventListener('click', () => this.clearEdges());
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());

        const pointInput = document.getElementById('point-count-input');
        const pointVal = document.getElementById('point-count-val');

        pointInput.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            pointVal.textContent = count;
            this.config.pointCount = count;
        });
    }

    startNewGame() {
        this.points = this.generatePoints(this.config.pointCount);
        this.edges = [];
        this.selectedPointIndex = -1;
        this.isComplete = false;
        this.hintEdge = null;

        document.getElementById('overlay-message').classList.remove('visible');
        document.getElementById('overlay-message').classList.add('hidden');
        document.querySelector('.instructions').textContent = "Select a point, then click another to connect/disconnect.";

        // Run Solver
        const solver = new TSPSolver(this.points);
        this.optimalSolution = solver.solve();
        console.log("Optimal Solution:", this.optimalSolution);

        // Show optimal stats immediately
        document.getElementById('optimal-stats').style.opacity = 1;
        document.getElementById('optimal-distance-display').textContent = this.optimalSolution.distance.toFixed(0);

        this.updateStats();
        this.render();
    }

    clearEdges() {
        this.edges = [];
        this.selectedPointIndex = -1;
        this.hintEdge = null;
        this.updateStats();
        this.render();
    }

    giveHint() {
        if (!this.optimalSolution || !this.optimalSolution.path) return;

        // Convert optimal path to edges set
        const optEdges = new Set();
        const path = this.optimalSolution.path;
        for (let i = 0; i < path.length; i++) {
            const u = path[i];
            const v = path[(i + 1) % path.length];
            const key = u < v ? `${u}-${v}` : `${v}-${u}`;
            optEdges.add(key);
        }

        // Convert current edges to set
        const curEdges = new Set();
        for (const e of this.edges) {
            const key = e.u < e.v ? `${e.u}-${e.v}` : `${e.v}-${e.u}`;
            curEdges.add(key);
        }

        // Find missing (in Opt but not in Cur)
        const missing = [];
        for (const key of optEdges) {
            if (!curEdges.has(key)) {
                const [u, v] = key.split('-').map(Number);
                missing.push({ u, v });
            }
        }

        // Find bad (in Cur but not in Opt)
        const bad = [];
        for (const key of curEdges) {
            if (!optEdges.has(key)) {
                const [u, v] = key.split('-').map(Number);
                bad.push({ u, v });
            }
        }

        // Decide what to show
        let hint = null;

        // Prioritize: 
        // 1. If we have bad edges, point out one to remove (helps clean up mess)
        // 2. If we have missing edges, point out one to add
        // ... Or maybe alternate? The user said "not in current (add)" OR "highlight current (remove)".
        // Let's randomize for variety? Or prioritize adding to help progress?
        // Let's go with: If there are bad edges, 50% chance to show bad, 50% to show missing.

        if (bad.length > 0 && (missing.length === 0 || Math.random() > 0.5)) {
            const edge = bad[Math.floor(Math.random() * bad.length)];
            hint = { ...edge, type: 'remove' };
        } else if (missing.length > 0) {
            const edge = missing[Math.floor(Math.random() * missing.length)];
            hint = { ...edge, type: 'add' };
        }

        if (hint) {
            const now = Date.now();
            this.hintEdge = { ...hint, timestamp: now };
            // Auto hide hint after 3s
            setTimeout(() => {
                if (this.hintEdge && this.hintEdge.timestamp === now) {
                    this.hintEdge = null;
                }
            }, 3000);
        }
    }

    generatePoints(count) {
        const points = [];
        const padding = 40;
        const width = this.canvas.width - padding * 2;
        const height = this.canvas.height - padding * 2;

        for (let i = 0; i < count; i++) {
            points.push({
                x: Math.random() * width + padding,
                y: Math.random() * height + padding
            });
        }
        return points;
    }

    checkHover() {
        let found = -1;
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            if (dx * dx + dy * dy < this.config.hoverRadius * 20) {
                found = i;
                break;
            }
        }
        this.hoveredPointIndex = found;
        this.canvas.style.cursor = found !== -1 ? 'pointer' : 'default';
    }

    handleClick() {
        if (this.hoveredPointIndex === -1) {
            this.selectedPointIndex = -1;
            return;
        }

        const index = this.hoveredPointIndex;

        if (this.selectedPointIndex === -1) {
            this.selectedPointIndex = index;
        } else if (this.selectedPointIndex === index) {
            this.selectedPointIndex = -1;
        } else {
            this.toggleEdge(this.selectedPointIndex, index);
            this.selectedPointIndex = index;
        }

        this.checkSolution();
        this.updateStats();
    }

    toggleEdge(u, v) {
        const p1 = u < v ? u : v;
        const p2 = u < v ? v : u;

        const existingIndex = this.edges.findIndex(e => e.u === p1 && e.v === p2);
        if (existingIndex !== -1) {
            this.edges.splice(existingIndex, 1);
        } else {
            this.edges.push({ u: p1, v: p2 });
        }
        // Clear hint if we interacted
        this.hintEdge = null;
    }

    getDegrees() {
        const deg = new Array(this.points.length).fill(0);
        for (const e of this.edges) {
            deg[e.u]++;
            deg[e.v]++;
        }
        return deg;
    }

    checkSolution() {
        const degrees = this.getDegrees();
        const allDegree2 = degrees.every(d => d === 2);

        if (!allDegree2) return;

        // Check connectivity
        if (this.points.length > 0) {
            const visited = new Set();
            const queue = [0];
            visited.add(0);
            while (queue.length > 0) {
                const u = queue.pop();
                for (const e of this.edges) {
                    const neighbor = e.u === u ? e.v : (e.v === u ? e.u : -1);
                    if (neighbor !== -1 && !visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                    }
                }
            }
            if (visited.size !== this.points.length) return;
        }

        // Cycle found! Check optimality.
        const currentDist = this.calculateTotalDistance();
        if (currentDist <= this.optimalSolution.distance + 1.0) {
            this.completeGame();
        }
    }

    completeGame() {
        if (this.isComplete) return;
        this.isComplete = true;

        const dist = this.calculateTotalDistance();
        document.getElementById('final-distance').textContent = dist.toFixed(0);

        const overlay = document.getElementById('overlay-message');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('visible');
        }, 100);
    }

    calculateTotalDistance() {
        let dist = 0;
        for (const e of this.edges) {
            const p1 = this.points[e.u];
            const p2 = this.points[e.v];
            dist += Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        return dist;
    }

    updateStats() {
        const currentDist = this.calculateTotalDistance();
        document.getElementById('distance-display').textContent = currentDist.toFixed(0);
        document.getElementById('point-count').textContent = `${this.points.length} Pts`;
    }

    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    render() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.config.colors.line;
        this.ctx.beginPath();
        for (const e of this.edges) {
            const p1 = this.points[e.u];
            const p2 = this.points[e.v];
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        }
        this.ctx.stroke();

        // Draw Hint Edge
        if (this.hintEdge) {
            const p1 = this.points[this.hintEdge.u];
            const p2 = this.points[this.hintEdge.v];

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineWidth = 4;

            if (this.hintEdge.type === 'add') {
                this.ctx.strokeStyle = this.config.colors.lineHintAdd;
                this.ctx.setLineDash([10, 10]);
            } else {
                this.ctx.strokeStyle = this.config.colors.lineHintRemove;
                this.ctx.setLineDash([]); // solid line for removal suggestion
            }

            // Pulsing opacity
            const time = (Date.now() - this.hintEdge.timestamp) / 1000;
            this.ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 10); // fast pulse
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;
            this.ctx.setLineDash([]);
            this.ctx.lineWidth = 2;
        }

        // Draw active connection line
        if (this.selectedPointIndex !== -1) {
            const p = this.points[this.selectedPointIndex];
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.strokeStyle = this.config.colors.lineActive;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        const degrees = this.getDegrees();

        // Draw points
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const isHovered = (i === this.hoveredPointIndex);
            const isSelected = (i === this.selectedPointIndex);

            let color = this.config.colors.point;
            if (isSelected) {
                color = this.config.colors.pointSelected;
            } else if (degrees[i] === 2) {
                color = this.config.colors.pointSuccess;
            } else if (degrees[i] > 2) {
                color = this.config.colors.pointError;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, isHovered ? this.config.pointRadius * 1.5 : this.config.pointRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.shadowBlur = (isHovered || isSelected) ? 10 : 0;
            this.ctx.shadowColor = color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TSPGame();
});
